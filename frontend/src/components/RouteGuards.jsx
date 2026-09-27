import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Loading() {
  return <div className="generating"><div className="spinner" style={{ width: 32, height: 32, color: "var(--green)" }} aria-label="Loading" /></div>;
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/signin" replace state={{ from: loc.pathname }} />;
  return children;
}

export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
