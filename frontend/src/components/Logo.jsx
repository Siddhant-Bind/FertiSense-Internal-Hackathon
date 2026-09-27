import { Link } from "react-router-dom";

export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="logo" aria-label="FertiSense home">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="24" width="36" height="5" rx="2" fill="#8A5A2B" />
        <rect x="2" y="30" width="36" height="4" rx="2" fill="#5E3B1C" />
        <rect x="2" y="35" width="36" height="3" rx="1.5" fill="#3E2712" />
        <path d="M20 24V12" stroke="#2E6A38" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 15c-6 0-9-4-9-9 6 0 9 4 9 9z" fill="#4E9A58" />
        <path d="M20 12c5 0 8-3 8-8-5 0-8 3-8 8z" fill="#2E6A38" />
      </svg>
      FertiSense
    </Link>
  );
}
