import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SidebarNav from './components/SidebarNav';
import ProtectedRoute from './components/ProtectedRoute';
import TopNav from './components/TopNav';
import AccessPage from './pages/AccessPage';
import AdminPage from './pages/AdminPage';
import Dashboard from './pages/Dashboard';
import AuditLogs from './pages/AuditLogs';
import VerifyPage from './pages/VerifyPage';

function HomeRedirect({ role }) {
  if (role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === 'verifier') {
    return <Navigate to="/verify" replace />;
  }

  return <Navigate to="/access" replace />;
}

export default function App() {
  const [session, setSession] = useState({ role: null, isAuthenticated: false });

  function readStoredSession() {
    try {
      const storedRole = localStorage.getItem('credichain-role');
      const storedAuth = localStorage.getItem('credichain-auth');
      const savedSession = JSON.parse(sessionStorage.getItem('credichain-session') || '{}');

      if (storedRole && storedAuth === 'true') {
        return { role: storedRole, isAuthenticated: true };
      }

      if (savedSession?.role && savedSession?.isAuthenticated) {
        return savedSession;
      }
    } catch {
      return { role: null, isAuthenticated: false };
    }

    return { role: null, isAuthenticated: false };
  }

  useEffect(() => {
    const savedSession = readStoredSession();
    if (savedSession.role && savedSession.isAuthenticated) {
      setSession(savedSession);
    }
  }, []);

  function handleRoleSelect(nextSession) {
    setSession(nextSession);
    localStorage.setItem('credichain-role', nextSession.role);
    localStorage.setItem('credichain-auth', String(Boolean(nextSession.isAuthenticated)));
    sessionStorage.setItem('credichain-session', JSON.stringify(nextSession));
  }

  function handleLogout() {
    setSession({ role: null, isAuthenticated: false });
    localStorage.removeItem('credichain-role');
    localStorage.removeItem('credichain-auth');
    sessionStorage.removeItem('credichain-session');
  }

  const effectiveSession = session.isAuthenticated ? session : readStoredSession();

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect role={effectiveSession.role} />} />
      <Route path="/access" element={<AccessPage onRoleSelect={handleRoleSelect} />} />
      <Route
        path="/*"
        element={
          effectiveSession.isAuthenticated ? (
            <div className="min-h-screen bg-slateui-50">
              <TopNav session={effectiveSession} onLogout={handleLogout} />
              <div className="mx-auto flex max-w-[1600px]">
                <SidebarNav role={effectiveSession.role} />
                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
                  <Routes>
                    <Route
                      path="dashboard"
                      element={
                        <ProtectedRoute role={effectiveSession.role} allowedRoles={[ 'admin' ]} fallbackPath="/verify">
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="audit"
                      element={
                        <ProtectedRoute role={effectiveSession.role} allowedRoles={[ 'admin' ]} fallbackPath="/verify">
                          <AuditLogs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="admin"
                      element={
                        <ProtectedRoute role={effectiveSession.role} allowedRoles={[ 'admin' ]} fallbackPath="/verify">
                          <AdminPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="verify"
                      element={
                        <ProtectedRoute role={effectiveSession.role} allowedRoles={[ 'verifier' ]} fallbackPath="/dashboard">
                          <VerifyPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/access" replace />
          )
        }
      />
    </Routes>
  );
}