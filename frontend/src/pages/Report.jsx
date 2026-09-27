import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import BagIcon from "../components/BagIcon";
import { useAuth } from "../context/AuthContext";

const fmt = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = (v) => "₹" + Math.round(v).toLocaleString("en-IN");

export default function Report() {
  const { id } = useParams();
  const nav = useNavigate();
  const { api } = useAuth();
  const [rec, setRec] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [crops, setCrops] = useState([]);
  const [soils, setSoils] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/crop-types"),
      api.get("/soil-types"),
      api.get("/fertilizer-types"),
      api.get("/districts")
    ]).then(([c, s, f, d]) => {
      setCrops(c.data);
      setSoils(s.data);
      setFertilizers(f.data);
      setDistricts(d.data);
    }).catch(console.error);
  }, [api]);

  useEffect(() => {
    api.get("/recommendations")
      .then(res => {
        const r = res.data.find(x => x.id.toString() === id.toString());
        if (!r) throw new Error("This report was not found.");
        setRec(r);
      })
      .catch((e) => setError(e.response?.data?.detail || e.message));
  }, [id, api]);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2200); return () => clearTimeout(t); }, [toast]);

  if (error) return (
    <><Header variant="app" /><main className="wrap page"><div className="panel empty"><h3>Report not available</h3><p>{error}</p><Link to="/dashboard" className="btn btn-primary">Back to dashboard</Link></div></main></>
  );
  if (!rec || !crops.length) return <><Header variant="app" /><main className="wrap page"><div className="skeleton" style={{ height: 120 }} /><div className="skeleton" style={{ height: 320 }} /></main></>;

  const cropName = crops.find(c => c.id === rec.crop_type_id)?.crop_name || "Unknown Crop";
  const soilName = soils.find(s => s.id === rec.soil_type_id)?.soil_name || "Unknown Soil";
  const fertName = fertilizers.find(f => f.id === rec.rec_fertilizer_id)?.fertilizer_name || "Unknown Fertilizer";
  const districtName = districts.find(d => d.id === rec.district_id)?.district_name || "";
  const stateName = districts.find(d => d.id === rec.district_id)?.state_name || "";

  const blendDetails = rec.blend_details || null;
  const blendList = blendDetails?.blend || [];
  const blendCost = blendDetails?.blend_total_cost || 0;
  const advisory = rec.advisory || blendDetails?.advisory || {};
  const nutrientAssessment = advisory.nutrient_assessment || {};
  const weatherAssessment = advisory.weather_assessment || {};
  const historyAssessment = advisory.previous_report_relevance || {};
  const sustainability = advisory.sustainability || {};
  const timing = advisory.timing || {};
  const hasAdvisory = Object.keys(advisory).length > 0;

  const shareText = () =>
    `FertiSense report: ${cropName} at ${rec.growth_stage} stage (per acre)\nRecommended: ${fertName} - ${rec.rec_quantity} ${rec.rec_unit}\nTiming: ${rec.application_timing}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareText()); setToast("Summary copied"); }
    catch { setToast("Copy is blocked here. Use Print instead."); }
  };
  const remove = async () => {
    if (!confirm("Delete this report? This can't be undone.")) return;
    try {
      // Delete not supported yet, but if it was:
      // await api.delete(`/recommendations/${id}`);
      nav("/dashboard", { replace: true });
    } catch(e) {
      alert(e.message);
    }
  };

  return (
    <>
      <Header variant="app" />
      <main className="wrap page">
        <Link to="/dashboard" className="crumb">← Dashboard</Link>
        <div className="page-head">
          <div>
            <h1>{cropName} fertilizer plan</h1>
            <p>{[districtName, stateName].filter(Boolean).join(", ")} · {soilName} · {rec.growth_stage} stage · created {fmt(rec.created_at)}</p>
          </div>
          <div className="report-actions">
            <button className="btn btn-ghost" onClick={() => window.print()}>Print</button>
            <button className="btn btn-ghost" onClick={copy}>Copy summary</button>
            <Link className="btn btn-primary" to="/recommendations/new">New recommendation</Link>
          </div>
        </div>

        <div className="report-grid" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section className="panel buy-panel" aria-labelledby="buy">
            <h2 id="buy">What to buy</h2>
            <p className="lead">
              Quantities are <b>per acre</b> for the <b>{rec.growth_stage?.toLowerCase()}</b> stage. Main fertilizer: <b>{fertName}</b>
            </p>
            
            {blendList.length > 0 ? (
              <div className="bags">
                {blendList.map((b, i) => (
                  <div className="bag" key={i}>
                    <BagIcon product={b.fertilizer_name} />
                    <div className="n">{b.bags} {b.bags === 1 ? "bag" : "bags"}</div>
                    <div className="d">{b.quantity_kg} kg per acre · {b.role} · {inr(b.total_cost)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bags">
                <div className="bag">
                  <BagIcon product={fertName} />
                  <div className="n">{rec.rec_quantity} {rec.rec_unit}</div>
                  <div className="d">Main Anchor</div>
                </div>
              </div>
            )}

            {blendCost > 0 && (
              <div className="costrow" style={{ marginTop: 24 }}>
                <div><div className="muted small">Estimated cost per acre</div><b>{inr(blendCost)}</b></div>
                <span className="muted small">At approximate MRP; buy full bags and store the rest dry.</span>
              </div>
            )}
          </section>

          <section className="panel" aria-labelledby="sched">
            <h2 id="sched">When to apply</h2>
            <p className="lead" style={{ whiteSpace: 'pre-line' }}>{rec.application_timing}</p>
            {timing.weather_relevance && <p className="muted" style={{ whiteSpace: 'pre-line', marginBottom: 0 }}><b>Weather note:</b> {timing.weather_relevance}</p>}
          </section>

          <section className="panel" aria-labelledby="model">
            <h2 id="model">Why {fertName}</h2>
            <p className="lead" style={{ whiteSpace: 'pre-line' }}>{rec.explanation}</p>
          </section>

          {hasAdvisory && <section className="panel" aria-labelledby="field-assessment">
            <h2 id="field-assessment">Field assessment</h2>
            {Object.keys(nutrientAssessment).length > 0 && <><h3>Soil nutrients</h3><dl className="report-assessment">
              {[["Nitrogen", nutrientAssessment.nitrogen], ["Phosphorus", nutrientAssessment.phosphorus], ["Potassium", nutrientAssessment.potassium], ["pH", nutrientAssessment.ph]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl></>}
            {(weatherAssessment.impact || weatherAssessment.relevant_parameters?.length) && <><h3>Weather and application</h3>
              {weatherAssessment.relevant_parameters?.length > 0 && <p className="muted small">Considered: {weatherAssessment.relevant_parameters.join(", ")}</p>}
              <p className="lead">{weatherAssessment.impact}</p>
            </>}
            {historyAssessment.relevant_information && <><h3>Previous field activity</h3><p className="lead"><b>Relevant history:</b> {historyAssessment.relevant_information}</p>
              {historyAssessment.impact_on_current_recommendation && <p className="lead"><b>Effect on this plan:</b> {historyAssessment.impact_on_current_recommendation}</p>}</>}
            {Object.keys(sustainability).length > 0 && <><h3>Sustainable use</h3><dl className="report-assessment">
              {[["Nutrient efficiency", sustainability.nutrient_use_efficiency], ["Loss reduction", sustainability.nutrient_loss_reduction], ["Soil health", sustainability.soil_health]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl></>}
            {advisory.warning && <div className="form-alert" style={{ marginTop: 18 }}><b>Important:</b> {advisory.warning}</div>}
          </section>}

        </div>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
