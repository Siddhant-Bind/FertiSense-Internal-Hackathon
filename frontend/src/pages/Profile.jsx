import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import DistrictPicker from "../components/DistrictPicker";
import { Field } from "../components/Field";
import { initials } from "../components/AvatarMenu";
import { useAuth } from "../context/AuthContext";
import { validators } from "../lib/validation";

export default function Profile() {
  const { user, updateUser, signOut } = useAuth();
  const [f, setF] = useState({ phone: user.phone || "", state: user.state || "", district: user.district || "" });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // /auth/me can complete after this route mounts. Keep form fields in sync
  // with the fetched profile rather than preserving the initial empty values.
  useEffect(() => {
    setF({ phone: user.phone || "", state: user.state || "", district: user.district || "" });
  }, [user.phone, user.state, user.district]);

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    const pe = validators.phone(f.phone); if (pe) errs.phone = pe;
    if (!f.district) errs.district = "Choose your district";
    setErrors(errs); setMsg("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { await updateUser(f); setMsg("Changes saved"); } catch (err) { setMsg(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <Header variant="app" />
      <main className="wrap page">
        <Link to="/dashboard" className="crumb">← Dashboard</Link>
        <div className="page-head"><div><h1>Profile</h1><p>Your district is used as the default for new recommendations.</p></div></div>
        <div className="profile-grid">
          <div className="panel profile-card">
            <div className="avatar">{initials(user.email)}</div>
            <b style={{ wordBreak: "break-all" }}>{user.name}</b>
            <p className="muted small" style={{ marginTop: 4 }}>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}</p>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 18 }} onClick={signOut}>Sign out</button>
          </div>
          <form className="panel form" onSubmit={save} noValidate>
            <h2>Account details</h2>
            <Field id="p-email" label="Email address" hint="Contact support to change your email.">
              <input id="p-email" className="input" value={user.email} disabled />
            </Field>
            <Field id="p-phone" label="Mobile number" error={errors.phone}>
              <div className="input-group"><span className="prefix">+91</span>
                <input id="p-phone" className="input" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^\d\s]/g, "") })} />
              </div>
            </Field>
            <DistrictPicker state={f.state} district={f.district} errors={errors} onChange={(v) => setF({ ...f, ...v })} />
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving" : "Save changes"}</button>
              {msg && <span className="muted small" role="status">{msg}</span>}
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
