import { Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Mirror from "./pages/Mirror";
import Move from "./pages/Move";
import Witness from "./pages/Witness";
import Speak from "./pages/Speak";

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/mirror" element={<Mirror />} />
        <Route path="/dashboard/move" element={<Move />} />
        <Route path="/dashboard/witness" element={<Witness />} />
        <Route path="/dashboard/speak" element={<Speak />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}