import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import Home from "./Home";
import NewAdmission from "./NewAdmission";
import Revenue from "./Revenue";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route path="/home" element={<Home />} />
      <Route path="/new-admission" element={<NewAdmission />} />
      <Route path="/renewfees" element={<Navigate to="/new-admission" replace />} />
      <Route path="/revenue" element={<Revenue />} />
    </Routes>
  );
}

export default App;
