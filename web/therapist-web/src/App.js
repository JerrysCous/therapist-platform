import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import AuthForm from "./AuthForm";
import TherapistDashboard from "./therapist-dashboard";
import ClientDashboard from "./client-dashboard";
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
        <Route path="/" element={<AuthForm />} />

        {/* Dashboards */}
        <Route path="/therapist-dashboard" element={<TherapistDashboard />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />

        {/* Chat route */}
        <Route path="/chat/:id" element={<ChatWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

