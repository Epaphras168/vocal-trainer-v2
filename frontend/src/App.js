import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import PitchLab from "@/pages/PitchLab";
import NoteMatch from "@/pages/NoteMatch";
import Scales from "@/pages/Scales";
import Octaves from "@/pages/Octaves";
import Intervals from "@/pages/Intervals";
import Breathing from "@/pages/Breathing";
import SongStudio from "@/pages/SongStudio";
import Insights from "@/pages/Insights";

function Gate({ children }) {
  const { profile } = useApp();
  const location = useLocation();
  if (!profile.onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/*"
        element={
          <Gate>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lab" element={<PitchLab />} />
                <Route path="/match" element={<NoteMatch />} />
                <Route path="/scales" element={<Scales />} />
                <Route path="/octaves" element={<Octaves />} />
                <Route path="/intervals" element={<Intervals />} />
                <Route path="/breath" element={<Breathing />} />
                <Route path="/songs" element={<SongStudio />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Gate>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}
