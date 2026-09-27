export default function ScoreRing({ score }) {
  const color = score >= 75 ? "var(--green)" : score >= 50 ? "var(--sun)" : "var(--alert)";
  const C = 2 * Math.PI * 50;
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={`Soil health score ${score} out of 100`}>
      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-2)" strokeWidth="12" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} transform="rotate(-90 60 60)" />
      <text x="60" y="68" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="30" fill="var(--ink)">{score}</text>
    </svg>
  );
}
