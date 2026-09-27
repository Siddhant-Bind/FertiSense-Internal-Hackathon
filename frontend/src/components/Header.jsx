import { Link } from "react-router-dom";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import AvatarMenu from "./AvatarMenu";
import { useAuth } from "../context/AuthContext";

export default function Header({ variant = "public" }) {
  const { user } = useAuth();
  return (
    <>
      <header className="header">
        <div className="wrap">
          <Logo to={user ? "/dashboard" : "/"} />
          <div className="header-actions">
            <ThemeToggle />
            {variant === "app" || user ? (
              <AvatarMenu />
            ) : (
              <>
                <Link to="/signin" className="btn btn-ghost">Sign in</Link>
                <Link to="/signup" className="btn btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
