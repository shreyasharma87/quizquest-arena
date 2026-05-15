import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PlayerDashboard from './pages/PlayerDashboard';
import LiveGame from './pages/LiveGame';
import HostDashboard from './pages/HostDashboard';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<PlayerDashboard />} />
        <Route path="/game/:roomId" element={<LiveGame />} />
        <Route path="/host/:roomId" element={<HostDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
