from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Optional
from app.schemas.recommend import RecommendRequest, RecommendResponse
from app.core.security import get_optional_user
from app.core.constants import GROWTH_STAGES
from app.services.soil_service import resolve_soil_data
from app.services.weather_service import get_weather
from app.services.ml_service import predict_fertilizer
from app.services.llm_service import get_llm_recommendation
from app.services.blend_service import calculate_blend_metrics
from app.services.dosage_service import apply_dosage_clamp
from app.db.supabase_client import supabase, get_admin_client

router = APIRouter()

@router.post("/", response_model=RecommendResponse)
async def recommend(req: RecommendRequest, user_id: Optional[str] = Depends(get_optional_user)):
    if req.growth_stage not in GROWTH_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid growth_stage. Must be one of {GROWTH_STAGES}")

    # 0. Auto-Create Field if missing
    admin_client = get_admin_client()
    if user_id and not req.field_id:
        try:
            # Count user's existing fields to name the new one "Field X"
            count_res = admin_client.table("fields").select("id", count="exact").eq("user_id", user_id).execute()
            field_count = count_res.count if hasattr(count_res, 'count') and count_res.count is not None else len(count_res.data)
            new_name = f"Field {field_count + 1}"
            
            # Upsert user to prevent FK error
            admin_client.table("users").upsert({"id": user_id}).execute()
            
            new_field = admin_client.table("fields").insert({
                "user_id": user_id,
                "field_name": new_name,
                "state_id": req.state_id,
                "district_id": req.district_id,
                "village_id": req.village_id,
                "soil_type_id": req.soil_type_id
            }).execute()
            if new_field.data:
                req.field_id = new_field.data[0]["id"]
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("Failed to auto-create field: %s", e)

    # 1. Soil resolution
    soil = resolve_soil_data(
        req.district_id, req.village_id,
        req.manual_n, req.manual_p, req.manual_k, req.manual_ph
    )

    # 2. Weather resolution
    temp, humidity, rain_probability, rain_amount, wind_speed = await get_weather(soil["latitude"], soil["longitude"])

    # 3. ML prediction
    rec_fertilizer_id = predict_fertilizer(
        temp, humidity, req.moisture, req.soil_type_id, req.crop_type_id,
        soil["n"], soil["k"], soil["p"]
    )

    # Fetch fertilizer name for the recommended id
    fert_res = supabase.table("fertilizer_types").select("fertilizer_name").eq("id", rec_fertilizer_id).execute()
    rec_fertilizer_name = fert_res.data[0]["fertilizer_name"]

    # 4. Continuation Logic
    comparison_result = "MATCH" if req.prev_fertilizer_id == rec_fertilizer_id else "MISMATCH"
    
    previous_report = None
    if req.is_continuation and req.field_id:
        try:
            prev_res = supabase.table("recommendations").select("*").eq("field_id", req.field_id).order("created_at", desc=True).limit(1).execute()
            if prev_res.data:
                previous_report = prev_res.data[0]
        except Exception:
            pass

    # 5. LLM Generation
    llm_output = await get_llm_recommendation(
        rec_fertilizer_name, comparison_result, req.growth_stage,
        soil["n"], soil["p"], soil["k"], soil["ph"],
        temp, humidity, req.moisture, req.prev_fertilizer_qty, req.organic_carbon,
        previous_report=previous_report,
        rain_probability=rain_probability,
        rain_amount=rain_amount,
        wind_speed=wind_speed
    )

    # 6. Blend Quantification
    enriched_blend, blend_total_cost, npk_fulfillment = calculate_blend_metrics(llm_output["blend"])

    # 7. Dosage Clamp: enforce both the per-application and cumulative limits.
    clamped_qty, timing_override, explanation_override = apply_dosage_clamp(
        req.field_id, rec_fertilizer_id, llm_output["quantity"]
    )
    timing_data = llm_output.get("timing", {})
    if isinstance(timing_data, str):
        timing_data = {"recommendation": timing_data, "weather_relevance": ""}
    final_timing = timing_override or timing_data.get("recommendation", "Apply as advised by a local agronomist.")
    final_explanation = explanation_override or llm_output["explanation"]
    
    # 8. Log and respond
    insert_data = {
        "user_id": user_id, # Can be None for guest
        "field_id": req.field_id, # Will be None if missing, preventing FK failure
        "district_id": req.district_id,
        "village_id": req.village_id,
        "latitude": soil["latitude"],
        "longitude": soil["longitude"],
        "soil_type_id": req.soil_type_id,
        "crop_type_id": req.crop_type_id,
        "temperature": temp,
        "humidity": humidity,
        "moisture": req.moisture,
        "growth_stage": req.growth_stage,
        "prev_fertilizer_id": req.prev_fertilizer_id,
        "prev_fertilizer_qty": req.prev_fertilizer_qty,
        "rec_fertilizer_id": rec_fertilizer_id,
        "rec_quantity": clamped_qty,
        "rec_unit": llm_output.get("unit", "kg/acre"),
        "application_timing": final_timing,
        "explanation": final_explanation,
        "blend_details": {
            "blend": enriched_blend,
            "blend_total_cost": blend_total_cost,
            "npk_fulfillment": npk_fulfillment,
            "advisory": {
                "timing": {**timing_data, "recommendation": final_timing},
                "nutrient_assessment": llm_output.get("nutrient_assessment", {}),
                "previous_report_relevance": llm_output.get("previous_report_relevance", {}),
                "weather_assessment": llm_output.get("weather_assessment", {}),
                "sustainability": llm_output.get("sustainability", {}),
                "warning": llm_output.get("warning"),
            }
        }
    }

    # Ensure DB insert failure doesn't block response
    try:
        res = admin_client.table("recommendations").insert(insert_data).execute()
        recommendation_id = res.data[0]["id"] if res.data else -1
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Failed to log recommendation to DB: %s", e)
        recommendation_id = -1

    return RecommendResponse(
        recommendation_id=recommendation_id,
        rec_fertilizer=rec_fertilizer_name,
        rec_quantity=clamped_qty,
        rec_unit=llm_output.get("unit", "kg/acre"),
        application_timing=final_timing,
        explanation=final_explanation,
        comparison_result=comparison_result,
        blend=enriched_blend,
        blend_total_cost=blend_total_cost,
        npk_fulfillment=npk_fulfillment,
        advisory=insert_data["blend_details"]["advisory"]
    )
