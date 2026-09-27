import { useId, useState } from "react";

export function Field({ label, hint, error, optional, children, id }) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        <span>{label}</span>
        {optional && <small>optional</small>}
      </label>
      {children}
      {error ? <div className="err" id={`${id}-err`} role="alert">{error}</div> : hint ? <div className="help">{hint}</div> : null}
    </div>
  );
}

export function PasswordInput({ id, value, onChange, onBlur, autoComplete = "current-password", invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input id={id} className="input" type={show ? "text" : "password"} value={value} onChange={onChange} onBlur={onBlur}
        autoComplete={autoComplete} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-err` : undefined} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
    </div>
  );
}

export const useFieldId = (name) => `${name}-${useId().replace(/:/g, "")}`;
