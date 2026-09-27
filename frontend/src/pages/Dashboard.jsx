import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const inr = (v) => "₹" + Math.round(v).toLocaleString("en-IN");
const fmt = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function Dashboard() {
  const { user, api } = useAuth();
  const [recs, setRecs] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => { 
    api.get("/recommendations")
      .then(res => setRecs(res.data))
      .catch((e) => setError(e.response?.data?.detail || e.message)); 
  }, [api]);

  const filtered = useMemo(() => (recs || []).filter((r) => (r.rec_fertilizer + (r.application_timing || "")).toLowerCase().includes(q.toLowerCase())), [recs, q]);
  const thisSeason = (recs || []).filter((r) => Date.now() - new Date(r.created_at) < 120 * 864e5).length;
  const avgScore = "–"; // Soil score is not persisted per API.md

  return (
    <>
      <Header variant="app" />
      <main className="wrap page">
        <div className="page-head">
          <div>
            <h1>Your recommendations</h1>
            <p>{user.district}, {user.state}</p>
          </div>
          <Link to="/recommendations/new" className="btn btn-primary btn-lg">+ New recommendation</Link>
        </div>

        <div className="stats">
          <div className="stat"><b>{recs ? recs.length : "–"}</b><span>Reports saved</span></div>
          <div className="stat"><b>{recs ? thisSeason : "–"}</b><span>In the last 4 months</span></div>
          <div className="stat"><b>{avgScore}</b><span>Average soil health score</span></div>
        </div>

        <section className="panel" aria-labelledby="hist">
          <div className="toolbar">
            <h2 id="hist">History</h2>
            {recs?.length > 0 && (
              <input className="input search" type="search" placeholder="Search fertilizer, timing" aria-label="Search history"
                value={q} onChange={(e) => setQ(e.target.value)} />
            )}
          </div>

          {error && <div className="form-alert">{error}</div>}
          {!recs && !error && <><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></>}

          {recs && recs.length === 0 && (
            <div className="empty">
              <svg viewBox="0 0 120 90" aria-hidden="true">
                <rect x="0" y="60" width="120" height="10" rx="3" fill="var(--soil-1)" />
                <rect x="0" y="72" width="120" height="8" rx="3" fill="var(--soil-2)" />
                <rect x="0" y="82" width="120" height="8" rx="3" fill="var(--soil-3)" />
                <path d="M60 60V34" stroke="var(--green)" strokeWidth="4" strokeLinecap="round" />
                <path d="M60 42c-10 0-15-7-15-15 10 0 15 7 15 15zM60 38c8 0 13-5 13-13-8 0-13 5-13 13z" fill="var(--green)" />
              </svg>
              <h3>No reports yet</h3>
              <p>Create your first recommendation. It takes about a minute.</p>
              <Link to="/recommendations/new" className="btn btn-primary">+ New recommendation</Link>
            </div>
          )}

          {recs && recs.length > 0 && filtered.length === 0 && <p className="muted" style={{ padding: "18px 4px" }}>No reports match “{q}”.</p>}

          {filtered.length > 0 && (
            <ul className="history">
              {filtered.map((r) => (
                <li key={r.id}>
                  <Link to={`/reports/${r.id}`} className="hrow">
                    <div>
                      <div className="t">{r.rec_fertilizer}</div>
                      <div className="s">{r.rec_quantity} kg/acre</div>
                    </div>
                    <div className="hide-sm">
                      <div className="t">{fmt(r.created_at)}</div>
                      <div className="s">Recommendation saved</div>
                    </div>
                    <span className="go">View report</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
