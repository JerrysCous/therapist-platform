import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

import AuthForm from "./AuthForm";
import OwnerDashboard from "./dashboards/OwnerDashboard";
import PracticeManagerAdmin from "./dashboards/PracticeManagerAdmin";
import PracticeManagerClinical from "./dashboards/PracticeManagerClinical";
import TherapistDashboard from "./dashboards/TherapistDashboard";
import InternDashboard from "./dashboards/InternDashboard";
import ClientDashboard from "./dashboards/ClientDashboard";

import ChatPage from "./ChatPage";

// NEW PAGES
import TherapistAvailability from "./dashboards/TherapistAvailability";
import PendingAppointments from "./dashboards/PendingAppointments";

// Dynamic Chat Wrapper
function ChatWrapper() {
  const { id } = useParams();
  return <ChatPage otherUserId={parseInt(id)} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route path="/" element={<AuthForm />} />

        {/* DASHBOARDS */}
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/practice-manager-admin" element={<PracticeManagerAdmin />} />
        <Route path="/practice-manager-clinical" element={<PracticeManagerClinical />} />
        <Route path="/therapist-dashboard" element={<TherapistDashboard />} />
        <Route path="/intern-dashboard" element={<InternDashboard />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />

        {/* APPOINTMENTS */}
        <Route path="/appointments/pending" element={<PendingAppointments />} />

        {/* THERAPIST AVAILABILITY PAGE */}
        <Route path="/therapist/availability" element={<TherapistAvailability />} />

        {/* CHAT */}
        <Route path="/chat/:id" element={<ChatWrapper />} />

      </Routes>
    </BrowserRouter>
  );
}
