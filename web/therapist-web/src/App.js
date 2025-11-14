import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import AuthForm from "./AuthForm";
import OwnerDashboard from "./dashboards/OwnerDashboard";
import PracticeManagerAdmin from "./dashboards/PracticeManagerAdmin";
import PracticeManagerClinical from "./dashboards/PracticeManagerClinical";
import TherapistDashboard from "./dashboards/TherapistDashboard";
import InternDashboard from "./dashboards/InternDashboard";
import ClientDashboard from "./dashboards/ClientDashboard";
import ChatPage from "./ChatPage";

// Wrapper so chat pages can get the dynamic user ID
function ChatWrapper() {
  const { id } = useParams();
  return <ChatPage otherUserId={parseInt(id)} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route path="/" element={<AuthForm />} />

        {/* DASHBOARDS BY ROLE */}
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/practice-manager-admin" element={<PracticeManagerAdmin />} />
        <Route path="/practice-manager-clinical" element={<PracticeManagerClinical />} />
        <Route path="/therapist-dashboard" element={<TherapistDashboard />} />
        <Route path="/intern-dashboard" element={<InternDashboard />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />

        {/* CHAT */}
        <Route path="/chat/:id" element={<ChatWrapper />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

