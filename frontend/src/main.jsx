import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

try { const t = localStorage.getItem("fs.theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* ignore */ }

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
