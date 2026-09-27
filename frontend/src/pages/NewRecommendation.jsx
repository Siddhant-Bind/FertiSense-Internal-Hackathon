import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Field } from "../components/Field";
import DistrictPicker from "../components/DistrictPicker";
import { useAuth } from "../context/AuthContext";
import VillageCombobox from "../components/VillageCombobox";

const GROWTH_STAGES = ["Sowing", "Vegetative", "Flowering", "Maturity"];
const GEN_STEPS = ["Reading soil values", "Sizing doses for your crop", "Choosing fertilizers", "Building the schedule"];

function Generating() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => Math.min(x + 1, GEN_STEPS.length - 1)), 420); return () => clearInterval(t); }, []);
  return (
    <div className="generating" role="status" aria-live="polite">
      <div>
        <svg className="growing" viewBox="0 0 88 88" aria-hidden="true">
          <rect x="4" y="66" width="80" height="8" rx="3" fill="var(--soil-1)" />
          <rect x="4" y="76" width="80" height="8" rx="3" fill="var(--soil-3)" />
          <path d="M44 66V30" stroke="var(--green)" strokeWidth="4" strokeLinecap="round" />
          <path d="M44 42c-11 0-16-8-16-17 11 0 16 8 16 17zM44 36c9 0 14-6 14-14-9 0-14 6-14 14z" fill="var(--green)" />
        </svg>
        <h2>Preparing your report</h2>
        <p className="muted">This usually takes a few seconds.</p>
        <ul className="gen-steps">
          {GEN_STEPS.map((s, k) => <li key={s} className={k < i ? "done" : k === i ? "active" : ""}><i />{s}</li>)}
        </ul>
      </div>
    </div>
  );
}

export default function NewRecommendation() {
  const { user, api } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    state: user?.state || "",
    district: user?.district || "",
    districtId: null,
    village: null,
    soilType: "", crop: "", growthStage: "",
    previous: [{ fertilizer: "", quantity: "", unit: "kg" }],
    hasTest: false, soilTest: { N: "", P: "", K: "", pH: "", OC: "" },
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const [villages, setVillages] = useState([]);
  const [villagesLoading, setVillagesLoading] = useState(false);
  const [villagesError, setVillagesError] = useState("");
  
  const [cropsData, setCropsData] = useState([]);
  const [soilsData, setSoilsData] = useState([]);
  const [fertilizersData, setFertilizersData] = useState([]);
  const [districtsData, setDistrictsData] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/crop-types"),
      api.get("/soil-types"),
      api.get("/fertilizer-types")
    ]).then(([c, s, f]) => {
      setCropsData(c.data);
      setSoilsData(s.data);
      setFertilizersData(f.data);
    }).catch(console.error);

    // The selected district ID is needed to load villages. Keep this request
    // independent so a failed non-location reference request cannot block it.
    api.get("/districts").then((res) => setDistrictsData(res.data)).catch(console.error);
  }, [api]);

  const selectedDistrictId = f.districtId ?? districtsData.find(d => d.district_name === f.district && d.state_name === f.state)?.id;

  // Load the villages whenever the district changes.
  useEffect(() => {
    let live = true;
    setVillages([]);
    setVillagesError("");
    if (!selectedDistrictId) return;
    setVillagesLoading(true);
    api.get(`/districts/${selectedDistrictId}/villages`)
      .then((res) => { if (live) setVillages(res.data); })
      .catch(() => { if (live) setVillagesError("Could not load villages. Please choose the district again."); })
      .finally(() => { if (live) setVillagesLoading(false); });
    return () => { live = false; };
  }, [selectedDistrictId, api]);

  // Turning on the Soil Health Card toggle starts from the village averages, which the farmer can overwrite.
  const toggleTest = (on) => setF((p) => {
    const v = p.village;
    const fill = (k, val) => (p.soilTest[k] !== "" ? p.soilTest[k] : v ? String(val) : "");
    return { ...p, hasTest: on, soilTest: on ? { ...p.soilTest, N: fill("N", v?.n), P: fill("P", v?.p), K: fill("K", v?.k), pH: fill("pH", v?.ph) } : p.soilTest };
  });
  const setTest = (k, v) => setF((p) => ({ ...p, soilTest: { ...p.soilTest, [k]: v } }));
  const setPrev = (i, patch) => setF((p) => ({ ...p, previous: p.previous.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const addPrev = () => setF((p) => ({ ...p, previous: [...p.previous, { fertilizer: "", quantity: "", unit: "kg" }] }));
  const removePrev = (i) => setF((p) => ({ ...p, previous: p.previous.length > 1 ? p.previous.filter((_, j) => j !== i) : [{ fertilizer: "", quantity: "", unit: "kg" }] }));
  const filledPrev = f.previous.filter((r) => r.fertilizer && +r.quantity > 0);

  const validate = () => {
    const e = {};
    if (!f.district) e.district = "Choose a district";
    if (!f.soilType) e.soilType = "Choose the soil type";
    if (!f.crop) e.crop = "Choose the crop";
    if (!f.village) e.village = "Choose your village";
    if (!f.growthStage) e.growthStage = "Choose the crop's current stage";
    f.previous.forEach((r, i) => {
      if (r.fertilizer && !(+r.quantity > 0)) e[`prev${i}`] = "Enter the quantity used";
      if (!r.fertilizer && r.quantity !== "") e[`prev${i}`] = "Choose the fertilizer";
    });
    if (f.hasTest) ["N", "P", "K"].forEach((k) => { if (f.soilTest[k] === "" || +f.soilTest[k] < 0) e[k] = "Required"; });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) { document.querySelector(".has-error")?.scrollIntoView({ block: "center" }); return; }
    setBusy(true); setServerError("");
    try {
      const payload = {
        state_id: f.state,
        district_id: selectedDistrictId,
        village_id: f.village.id,
        soil_type_id: parseInt(f.soilType, 10),
        crop_type_id: parseInt(f.crop, 10),
        growth_stage: f.growthStage,
        moisture: 45.0, // Default for now unless UI provides it
        is_continuation: false,
      };
      
      if (f.hasTest) {
        payload.manual_n = parseFloat(f.soilTest.N) || null;
        payload.manual_p = parseFloat(f.soilTest.P) || null;
        payload.manual_k = parseFloat(f.soilTest.K) || null;
        payload.manual_ph = parseFloat(f.soilTest.pH) || null;
        payload.organic_carbon = parseFloat(f.soilTest.OC) || null;
      }
      
      const prevFertilizer = filledPrev[0];
      if (prevFertilizer) {
        payload.prev_fertilizer_id = parseInt(prevFertilizer.fertilizer, 10);
        // Convert to kg if it was in bags (assuming 50kg standard bag for now since PRODUCTS is removed)
        payload.prev_fertilizer_qty = prevFertilizer.unit === "bags" ? (parseFloat(prevFertilizer.quantity) * 50.0) : parseFloat(prevFertilizer.quantity);
      }

      const res = await api.post("/recommend", payload);
      nav(`/reports/${res.data.recommendation_id}`, { replace: true });
    } catch (e) { setServerError(e.response?.data?.detail || e.message); setBusy(false); }
  };

  if (busy) return <><Header variant="app" /><main className="wrap"><Generating /></main></>;

  const cropName = cropsData.find(c => c.id.toString() === f.crop)?.crop_name;

  return (
    <>
      <Header variant="app" />
      <main className="wrap page">
        <Link to="/dashboard" className="crumb">← Dashboard</Link>
        <div className="page-head"><div><h1>New recommendation</h1><p>Tell us about the field. Your state and district are filled in from your profile.</p></div></div>

        <form className="form-layout" onSubmit={submit} noValidate>
          <div className="panel">
            {serverError && <div className="form-alert" style={{ marginBottom: 16 }}>{serverError}</div>}
            <div className="section-title">Location</div>
            <DistrictPicker state={f.state} district={f.district} districtId={f.districtId} errors={errors} includeDistrictId
              onChange={(v) => set({ ...v, village: null, soilType: f.soilType })} />
            <div style={{ marginTop: 14 }}>
              <Field id="village" label="Village" error={errors.village || villagesError}
                hint={f.district && !villagesLoading && !f.village ? "Type to search." : undefined}>
                <VillageCombobox id="village" villages={villages} loading={villagesLoading} value={f.village}
                  disabled={!f.district} invalid={!!errors.village} onChange={(v) => set({ village: v })} />
              </Field>
            </div>

            <hr className="divider" />
            <div className="section-title">Soil type</div>
            {errors.soilType && <div className="field has-error"><div className="err">{errors.soilType}</div></div>}
            <div className="choice-grid" role="radiogroup" aria-label="Soil type">
              {soilsData.map((s) => (
                <label key={s.id} className="choice">
                  <input type="radio" name="soil" value={s.id} checked={f.soilType === s.id.toString()} onChange={() => set({ soilType: s.id.toString() })} />
                  <span>{s.soil_name}</span>
                </label>
              ))}
            </div>

            <hr className="divider" />
            <div className="section-title">Crop</div>
            <div className="two">
              <Field id="crop" label="Crop type" error={errors.crop}>
                <select id="crop" className="select" value={f.crop} onChange={(e) => set({ crop: e.target.value })}>
                  <option value="">Select crop</option>
                  {cropsData.map((c) => <option key={c.id} value={c.id}>{c.crop_name}</option>)}
                </select>
              </Field>
              <Field id="growthStage" label="Current growth stage" error={errors.growthStage}>
                <select id="growthStage" className="select" value={f.growthStage} onChange={(e) => set({ growthStage: e.target.value })}>
                  <option value="">Select stage</option>
                  {GROWTH_STAGES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="stage-track" aria-hidden="true">
                  {GROWTH_STAGES.map((g, i) => <span key={g} className={i <= GROWTH_STAGES.indexOf(f.growthStage) ? "on" : ""} />)}
                </div>
                <div className="stage-labels" aria-hidden="true">{GROWTH_STAGES.map((g) => <span key={g}>{g}</span>)}</div>
              </Field>
            </div>

            <hr className="divider" />
            <div className="section-title">Previously used fertilizer</div>
            <p className="muted small" style={{ marginTop: -6, marginBottom: 14 }}>What you applied per acre last season on this field. Leave empty if you don't know.</p>
            <div className="prev-list">
              {f.previous.map((r, i) => (
                <div key={i} className={`prev-row${errors[`prev${i}`] ? " has-error" : ""}`}>
                  <Field id={`pf-${i}`} label={i === 0 ? "Fertilizer" : <span className="sr-only">Fertilizer</span>}>
                    <select id={`pf-${i}`} className="select" value={r.fertilizer} onChange={(e) => setPrev(i, { fertilizer: e.target.value })}>
                      <option value="">Select fertilizer</option>
                      {fertilizersData.map((k) => <option key={k.id} value={k.id}>{k.fertilizer_name}</option>)}
                    </select>
                  </Field>
                  <Field id={`pq-${i}`} label={i === 0 ? "Quantity used per acre" : <span className="sr-only">Quantity used per acre</span>}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input id={`pq-${i}`} type="number" min="0" step="0.5" inputMode="decimal" className="input" value={r.quantity}
                        onChange={(e) => setPrev(i, { quantity: e.target.value })} />
                      <select className="select" style={{ width: 96 }} aria-label="Unit" value={r.unit} onChange={(e) => setPrev(i, { unit: e.target.value })}>
                        <option value="kg">kg</option><option value="bags">bags</option>
                      </select>
                    </div>
                  </Field>
                  <button type="button" className="icon-btn prev-remove" aria-label={`Remove row ${i + 1}`} onClick={() => removePrev(i)}>✕</button>
                  {errors[`prev${i}`] && <div className="err prev-err" role="alert">{errors[`prev${i}`]}</div>}
                </div>
              ))}
            </div>
            {f.previous.length < 1 && <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={addPrev}>+ Add another fertilizer</button>}

            <hr className="divider" />
            <label className="toggle">
              <span><b>I have my own Soil Health Card</b><br /><span className="small muted">Enter your field's own test values.</span></span>
              <input type="checkbox" checked={f.hasTest} onChange={(e) => toggleTest(e.target.checked)} />
            </label>
            {f.hasTest && (
              <div className="two" style={{ marginTop: 16 }}>
                {[["N", "Available nitrogen (kg/ha)"], ["P", "Available phosphorus (kg/ha)"], ["K", "Available potassium (kg/ha)"], ["pH", "pH", true], ["OC", "Organic carbon (%)", true]].map(([k, label, opt]) => (
                  <Field key={k} id={`t-${k}`} label={label} optional={opt} error={errors[k]}>
                    <input id={`t-${k}`} type="number" step="any" min="0" inputMode="decimal" className="input" value={f.soilTest[k]} onChange={(e) => setTest(k, e.target.value)} />
                  </Field>
                ))}
              </div>
            )}
          </div>

          <aside className="panel summary">
            <h2>Summary</h2>
            <p className="lead">Check before generating.</p>
            <dl>
              <div><dt>Location</dt><dd>{f.district ? [f.village?.village_name, f.district, f.state].filter(Boolean).join(", ") : "Not selected"}</dd></div>
              <div><dt>Soil</dt><dd>{soilsData.find(s => s.id.toString() === f.soilType)?.soil_name || "Not selected"}</dd></div>
              <div><dt>Crop</dt><dd>{cropName || "Not selected"}</dd></div>
              <div><dt>Growth stage</dt><dd>{f.growthStage || "Not selected"}</dd></div>
              <div><dt>Previously used</dt><dd>{filledPrev.length ? "Entered" : "None entered"}</dd></div>
            </dl>
            <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }}>Generate report</button>
          </aside>
        </form>
      </main>
    </>
  );
}
