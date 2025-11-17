import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

// AUTH
import AuthForm from "./AuthForm";

// DASHBOARDS
import OwnerDashboard from "./dashboards/OwnerDashboard";
import PracticeManagerAdmin from "./dashboards/PracticeManagerAdmin";
import PracticeManagerClinical from "./dashboards/PracticeManagerClinical";
import TherapistDashboard from "./dashboards/TherapistDashboard";
import InternDashboard from "./dashboards/InternDashboard";
import ClientDashboard from "./dashboards/ClientDashboard";

// CLIENT APPOINTMENTS
import MyAppointments from "./dashboards/MyAppointments";

// THERAPIST APPOINTMENT PAGES
import CompletedAppointments from "./dashboards/CompletedAppointments";
import PendingAppointments from "./dashboards/PendingAppointments";
import TherapistRescheduleRequests from "./dashboards/TherapistRescheduleRequests";
import TherapistRescheduleDirect from "./dashboards/TherapistRescheduleDirect";

// AVAILABILITY PAGE
import TherapistAvailability from "./dashboards/TherapistAvailability";

// CHAT
import ChatPage from "./ChatPage";

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

        {/* CLIENT */}
        <Route path="/my-appointments" element={<MyAppointments />} />

        {/* THERAPIST APPOINTMENT MANAGEMENT */}
        <Route path="/appointments/pending" element={<PendingAppointments />} />
        <Route path="/completed-appointments" element={<CompletedAppointments />} />
        <Route path="/therapist/reschedule-requests" element={<TherapistRescheduleRequests />} />
        <Route path="/therapist/reschedule-direct" element={<TherapistRescheduleDirect />} />

        {/* THERAPIST AVAILABILITY */}
        <Route path="/therapist/availability" element={<TherapistAvailability />} />

        {/* CHAT */}
        <Route path="/chat/:id" element={<ChatWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}
