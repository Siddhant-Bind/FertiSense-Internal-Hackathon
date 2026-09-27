import { normalizePhone } from "../lib/validation";

/**
 * API layer.
 * - If VITE_API_URL is set, requests go to your backend (see README for the contract).
 * - Otherwise a mock backend stored in the browser is used, so the UI works end to end for demos.
 */
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "fs.token";

export const session = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(message, field) { super(message); this.field = field; }
}

/* ---------------- real backend ---------------- */
async function http(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(session.get() ? { Authorization: `Bearer ${session.get()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.detail || data.message || "Something went wrong. Try again.", data.field);
  return data;
}

export const api = {
  // Auth
  signUp: (b) => http("/auth/signup", { method: "POST", body: b }),
  signIn: (b) => http("/auth/login", { method: "POST", body: b }), // Changed to /login per API.md
  
  // Fields
  listFields: () => http("/fields"),
  createField: (b) => http("/fields", { method: "POST", body: b }),
  
  // Recommendations
  listRecommendations: () => http("/recommendations"), // User-level history across fields
  createRecommendation: (b) => http("/recommend", { method: "POST", body: b }), // Core pipeline
  getRecommendationHistoryForField: (fieldId) => http(`/recommendations/${fieldId}`),
  getRecommendation: async (id) => {
    const all = await api.listRecommendations();
    const rec = all.find(r => r.id.toString() === id.toString());
    if (!rec) throw new Error("This report was not found.");
    return rec;
  },
  deleteRecommendation: () => { throw new Error("Delete not supported in this hackathon version."); },
  
  // Reference Data
  getDistricts: () => http("/districts"),
  getVillages: (districtId) => http(`/districts/${districtId}/villages`),
  getCropTypes: () => http("/crop-types"),
  getSoilTypes: () => http("/soil-types"),
  getFertilizerTypes: () => http("/fertilizer-types"),
};

export const usingMock = false;
