import os
import pickle
from typing import Optional
from app.db.supabase_client import supabase

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "model.pkl")

import logging
logger = logging.getLogger(__name__)

# Attempt to load model at startup
model = None
if os.path.exists(MODEL_PATH):
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
    except Exception as e:
        logger.error(f"Failed to load model from {MODEL_PATH}: {e}")

# Fallback rules drawing only from 7 canonical classes
def fallback_predict(features: list) -> str:
    """
    Rule-based fallback when ML prediction fails.
    Features order: temperature, humidity, moisture, soil_type_id, crop_type_id, n, k, p
    """
    # Simple rule: if N is low, Urea. if P is low, DAP. Else 20-20.
    n, p = features[5], features[7]
    if n < 20:
        return "Urea"
    if p < 20:
        return "DAP"
    return "20-20"

def predict_fertilizer(
    temperature: float, 
    humidity: float, 
    moisture: float, 
    soil_type_id: int, 
    crop_type_id: int, 
    n: float, 
    k: float, 
    p: float
) -> int:
    """
    Predicts fertilizer name and resolves it to fertilizer_types.id.
    """
    # Exact 8-feature order: temperature, humidity, moisture, soil_type_id, crop_type_id, n, k, p
    features = [temperature, humidity, moisture, soil_type_id, crop_type_id, n, k, p]
    
    rec_fertilizer_name = None
    if model is not None:
        try:
            # Predict expects a 2D array
            prediction = model.predict([features])
            if prediction and len(prediction) > 0:
                rec_fertilizer_name = str(prediction[0])
        except Exception as e:
            logger.warning(f"Model prediction failed, using fallback rules: {e}")
            
    if not rec_fertilizer_name:
        rec_fertilizer_name = fallback_predict(features)
        logger.info(f"Fallback predictor selected: {rec_fertilizer_name}")
        
    # Resolve name to ID
    res = supabase.table("fertilizer_types").select("id").eq("fertilizer_name", rec_fertilizer_name).execute()
    if not res.data:
        # If somehow we predicted a name not in DB, fallback to a safe default if available, or raise error.
        # But our fallback always returns a valid canonical name.
        raise ValueError(f"Predicted fertilizer name '{rec_fertilizer_name}' not found in database.")
        
    return res.data[0]["id"]
