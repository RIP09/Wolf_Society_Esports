import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './components/public/Home';
import Teams from './components/public/Teams';
import Schedule from './components/public/Schedule';
import ContentFeed from './components/public/ContentFeed';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardLayout from './components/dashboard/DashboardLayout';
import PlayersTable from './components/dashboard/PlayersTable';
import MatchesTable from './components/dashboard/MatchesTable';
import TeamsTable from './components/dashboard/TeamsTable';
import ContractsTable from './components/dashboard/ContractsTable';
import AnnouncementsManager from './components/dashboard/AnnouncementsManager';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user && ['admin', 'manager'].includes(user.role) ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/content" element={<ContentFeed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PlayersTable />} />
              <Route path="players" element={<PlayersTable />} />
              <Route path="matches" element={<MatchesTable />} />
              <Route path="teams" element={<TeamsTable />} />
              <Route path="contracts" element={<ContractsTable />} />
              <Route path="announcements" element={<AnnouncementsManager />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
