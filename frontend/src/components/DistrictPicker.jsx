import { useState, useEffect } from "react";
import { Field } from "./Field";
import { useAuth } from "../context/AuthContext";

export default function DistrictPicker({ state, district, districtId, onChange, errors = {}, onBlur, includeDistrictId = false }) {
  const [districtsData, setDistrictsData] = useState([]);
  const { api } = useAuth();

  useEffect(() => {
    api.get("/districts").then(res => setDistrictsData(res.data)).catch(console.error);
  }, [api]);

  const states = [...new Set(districtsData.map(d => d.state_name))].sort();
  const filteredDistricts = districtsData.filter(d => d.state_name === state).sort((a, b) => a.district_name.localeCompare(b.district_name));

  return (
    <div className="two">
      <Field id="state" label="State" error={errors.state}>
        <select id="state" className="select" value={state} onBlur={onBlur}
          onChange={(e) => onChange({ state: e.target.value, district: "", ...(includeDistrictId ? { districtId: null } : {}) })}>
          <option value="">Select state</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field id="district" label="District" error={errors.district}>
        <select id="district" className="select"
          value={includeDistrictId ? (districtId?.toString() || districtsData.find((d) => d.district_name === district && d.state_name === state)?.id?.toString() || "") : district}
          disabled={!state} onBlur={onBlur}
          onChange={(e) => {
            const selected = districtsData.find((d) => (includeDistrictId ? d.id.toString() : d.district_name) === e.target.value);
            onChange({
              state,
              district: selected?.district_name || "",
              ...(includeDistrictId ? { districtId: selected?.id ?? null } : {}),
            });
          }}>
          <option value="">{state ? "Select district" : "Choose state first"}</option>
          {filteredDistricts.map((d) => <option key={d.id} value={includeDistrictId ? d.id : d.district_name}>{d.district_name}</option>)}
        </select>
      </Field>
    </div>
  );
}
