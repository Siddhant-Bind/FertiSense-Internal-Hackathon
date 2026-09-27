export const validators = {
  email: (v) => (!v ? "Enter your email address" : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Enter a valid email, like name@example.com"),
  phone: (v) => {
    const d = (v || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!d) return "Enter your mobile number";
    return /^[6-9]\d{9}$/.test(d) ? "" : "Enter a 10-digit Indian mobile number";
  },
  password: (v) => {
    if (!v) return "Create a password";
    if (v.length < 8) return "Use at least 8 characters";
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Use both letters and numbers";
    return "";
  },
  required: (label) => (v) => (v ? "" : `Choose your ${label}`),
};

export const normalizePhone = (v) => (v || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

export function passwordStrength(v = "") {
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(4, s);
}
