import { Link } from "react-router-dom";
import Header from "../components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="wrap page"><div className="panel empty"><h3>Page not found</h3><p>The link may be old or mistyped.</p><Link to="/" className="btn btn-primary">Go to home</Link></div></main>
    </>
  );
}
