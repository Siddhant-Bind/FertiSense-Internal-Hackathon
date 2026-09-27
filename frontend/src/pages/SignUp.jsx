import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { Field, PasswordInput } from "../components/Field";
import DistrictPicker from "../components/DistrictPicker";
import { useAuth } from "../context/AuthContext";
import { validators, passwordStrength } from "../lib/validation";

const STRENGTH = ["Too weak", "Weak", "Fair", "Good", "Strong"];

function validate(f) {
  const e = {
    name: f.name.trim() ? "" : "Please enter your name",
    email: validators.email(f.email),
    phone: validators.phone(f.phone),
    password: validators.password(f.password),
    confirm: f.confirm !== f.password ? "Passwords don't match" : "",
    state: f.state ? "" : "Choose your state",
    district: f.district ? "" : "Choose your district",
    agree: f.agree ? "" : "Accept the terms to continue",
  };
  Object.keys(e).forEach((k) => !e[k] && delete e[k]);
  return e;
}

export default function SignUp() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "", state: "", district: "", agree: false });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState({});
  const [busy, setBusy] = useState(false);

  const errs = { ...validate(f), ...serverErr };
  const show = (k) => (submitted || touched[k]) && errs[k];
  const set = (patch) => { setF((p) => ({ ...p, ...patch })); setServerErr({}); };
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const strength = passwordStrength(f.password);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(f)).length) return;
    setBusy(true);
    
    const res = await register(f.name, f.email, `+91-${f.phone}`, f.password, f.confirm, f.state, f.district);
    setBusy(false);

    if (res.success) {
      nav("/dashboard", { replace: true });
    } else {
      setServerErr({ form: res.message });
    }
  };

  return (
    <AuthLayout title="Start with your district." text="We use it to preload your local soil type and climate into every recommendation, so each plan fits your fields.">
      <h1>Create your account</h1>
      <p className="sub">Takes under a minute. No fees.</p>
      <form className="form" onSubmit={submit} noValidate>
        {serverErr.form && <div className="form-alert" role="alert">{serverErr.form}</div>}
        <Field id="name" label="Full name" error={show("name")}>
          <input id="name" className="input" type="text" autoComplete="name" value={f.name}
            onChange={(e) => set({ name: e.target.value })} onBlur={blur("name")} aria-invalid={!!show("name") || undefined} />
        </Field>
        <Field id="email" label="Email address" error={show("email")}>
          <input id="email" className="input" type="email" autoComplete="email" inputMode="email" value={f.email}
            onChange={(e) => set({ email: e.target.value })} onBlur={blur("email")} aria-invalid={!!show("email") || undefined} />
        </Field>
        <Field id="phone" label="Mobile number" error={show("phone")} hint="We'll use this for SMS reminders on application days.">
          <div className="input-group">
            <span className="prefix">+91</span>
            <input id="phone" className="input" type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={14} value={f.phone}
              placeholder="98765 43210" onChange={(e) => set({ phone: e.target.value.replace(/[^\d\s]/g, "") })} onBlur={blur("phone")} aria-invalid={!!show("phone") || undefined} />
          </div>
        </Field>
        <DistrictPicker state={f.state} district={f.district} onChange={set}
          errors={{ state: show("state"), district: show("district") }} onBlur={() => setTouched((t) => ({ ...t, state: true, district: true }))} />
        <Field id="password" label="Password" error={show("password")}>
          <PasswordInput id="password" autoComplete="new-password" value={f.password} invalid={!!show("password")}
            onChange={(e) => set({ password: e.target.value })} onBlur={blur("password")} />
          {f.password && (
            <>
              <div className={`meter s${strength}`} aria-hidden="true"><i /><i /><i /><i /></div>
              <div className="help">Strength: {STRENGTH[strength]} · at least 8 characters with letters and numbers</div>
            </>
          )}
        </Field>
        <Field id="confirm" label="Confirm password" error={show("confirm")}>
          <PasswordInput id="confirm" autoComplete="new-password" value={f.confirm} invalid={!!show("confirm")}
            onChange={(e) => set({ confirm: e.target.value })} onBlur={blur("confirm")} />
        </Field>
        <div className="field">
          <label className="check" htmlFor="agree" style={{ fontWeight: 400 }}>
            <input id="agree" type="checkbox" checked={f.agree} onChange={(e) => set({ agree: e.target.checked })} />
            <span>I agree to the terms of use and understand recommendations are advisory.</span>
          </label>
          {show("agree") && <div className="err" role="alert">{errs.agree}</div>}
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />} {busy ? "Creating account" : "Create account"}
        </button>
      </form>
      <p className="switch">Already have an account? <Link to="/signin">Sign in</Link></p>
    </AuthLayout>
  );
}
