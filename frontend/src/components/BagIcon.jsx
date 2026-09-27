const COLORS = {
  "Urea": { bag: 45, color: "#E0F7FA", ink: "#006064" },
  "DAP": { bag: 50, color: "#E8F5E9", ink: "#1B5E20" },
  "MOP": { bag: 50, color: "#FCE4EC", ink: "#880E4F" },
  "SSP": { bag: 50, color: "#FFF8E1", ink: "#F57F17" }
};

export default function BagIcon({ product }) {
  const p = { ...(COLORS[product] || { bag: 50, color: "#DDD", ink: "#444" }), name: product };
  const long = p.name.length > 6;
  const path = "M22 20 Q20 12 30 12 L70 12 Q80 12 78 20 L85 102 Q86 113 74 113 L26 113 Q14 113 15 102 Z";
  return (
    <svg viewBox="0 0 100 120" role="img" aria-label={`${p.name} bag, ${p.bag} kg`}>
      <path d={path} fill={p.color} stroke={p.ink} strokeWidth="2" />
      <path d="M28 12 Q50 2 72 12" fill="none" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 6 L50 12 L56 6" fill="none" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
      <rect x="20" y="44" width="60" height="30" rx="4" fill={p.ink} />
      <text x="50" y={long ? 63 : 65} textAnchor="middle" fontFamily="Bricolage Grotesque, Noto Sans, sans-serif" fontWeight="800" fontSize={long ? 11 : 15} fill={p.color}>{p.name}</text>
      <text x="50" y="92" textAnchor="middle" fontFamily="Noto Sans, sans-serif" fontWeight="700" fontSize="10" fill={p.ink}>{p.bag} kg</text>
    </svg>
  );
}
