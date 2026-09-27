import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const initials = (email = "") => (email.trim()[0] || "?").toUpperCase();

export default function AvatarMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  if (!user) return null;
  return (
    <div className="avatar-wrap" ref={ref}>
      <button className="avatar" aria-haspopup="menu" aria-expanded={open} aria-label="Open profile menu" onClick={() => setOpen((o) => !o)}>
        {initials(user.email || user.id)}
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="who">
            <b>{user.email || user.id}</b>
          </div>
          <Link role="menuitem" to="/profile" onClick={() => setOpen(false)}>Profile</Link>
          <Link role="menuitem" to="/dashboard" onClick={() => setOpen(false)}>My recommendations</Link>
          <button role="menuitem" onClick={() => { logout(); navigate("/"); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}
