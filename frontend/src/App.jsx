import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, PublicOnly } from "./components/RouteGuards";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import NewRecommendation from "./pages/NewRecommendation";
import Report from "./pages/Report";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// HashRouter works on any static host with no server rewrites. Swap to BrowserRouter if your host supports SPA fallbacks.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
          <Route path="/signin" element={<PublicOnly><SignIn /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><SignUp /></PublicOnly>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/recommendations/new" element={<RequireAuth><NewRecommendation /></RequireAuth>} />
          <Route path="/reports/:id" element={<RequireAuth><Report /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
