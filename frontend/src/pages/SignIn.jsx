import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { Field, PasswordInput } from "../components/Field";
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.identifier.trim()) errs.identifier = "Enter your email or mobile number";
    if (!form.password) errs.password = "Enter your password";
    setErrors(errs); setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    
    const res = await login(form.identifier, form.password);
    setBusy(false);
    
    if (res.success) {
      nav(loc.state?.from || "/dashboard", { replace: true });
    } else {
      setFormError(res.message);
    }
  };

  return (
    <AuthLayout title="Welcome back." text="Your saved recommendations and field details are waiting on your dashboard.">
      <h1>Sign in</h1>
      <p className="sub">Use the email or mobile number you signed up with.</p>
      <form className="form" onSubmit={submit} noValidate>
        {formError && <div className="form-alert" role="alert">{formError}</div>}
        <Field id="identifier" label="Email or mobile number" error={errors.identifier}>
          <input id="identifier" className="input" autoComplete="username" value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })} aria-invalid={!!errors.identifier || undefined} />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <PasswordInput id="password" value={form.password} invalid={!!errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />} {busy ? "Signing in" : "Sign in"}
        </button>
      </form>
      <p className="switch">New to FertiSense? <Link to="/signup">Create an account</Link></p>
    </AuthLayout>
  );
}
