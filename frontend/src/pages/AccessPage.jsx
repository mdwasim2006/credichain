import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, setAuthToken } from '../services/api';

export default function AccessPage({ onRoleSelect }) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('verifier');
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleSummary = useMemo(
    () => ({
      admin: 'Issue certificates, generate hashes, run tamper simulation.',
      verifier: 'Verify certificates by ID or QR simulation in seconds.'
    }),
    []
  );

  function continueAsVerifier() {
    console.log('[RoleSelection] Continue as Verifier clicked');
    onRoleSelect({ role: 'verifier', isAuthenticated: true });
    navigate('/verify', { replace: true });
    console.log('[RoleSelection] Navigated to /verify');
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await loginAdmin(adminCredentials);
      setAuthToken(response.token);
      console.log('[RoleSelection] Admin login success');
      onRoleSelect({ role: 'admin', isAuthenticated: true, token: response.token });
      navigate('/dashboard', { replace: true });
      console.log('[RoleSelection] Navigated to /dashboard');
    } catch (loginError) {
      setError(loginError.message || 'Invalid credentials');
      console.log('[RoleSelection] Admin login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid-pattern glass-panel w-full rounded-xl p-8 md:p-10 fade-in-up">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">CrediChain Access Gateway</p>
        <h1 className="mt-3 text-4xl font-black text-slateui-900 sm:text-5xl">Choose your role to enter the system</h1>
        <p className="mt-4 max-w-3xl text-slateui-600">
          This role gate makes CrediChain feel deployment-ready for institutions while keeping the hackathon flow simple and fast.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`rounded-xl border p-6 text-left transition ${selectedRole === 'admin' ? 'border-blue-600 bg-blue-50 shadow-glow' : 'border-slateui-200 bg-white hover:bg-slateui-50'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Role</p>
            <h2 className="mt-2 text-2xl font-bold text-slateui-900">Admin</h2>
            <p className="mt-3 text-sm text-slateui-600">{roleSummary.admin}</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('verifier')}
            className={`rounded-xl border p-6 text-left transition ${selectedRole === 'verifier' ? 'border-emerald-600 bg-emerald-50 shadow-glow' : 'border-slateui-200 bg-white hover:bg-slateui-50'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Role</p>
            <h2 className="mt-2 text-2xl font-bold text-slateui-900">Verifier</h2>
            <p className="mt-3 text-sm text-slateui-600">{roleSummary.verifier}</p>
          </button>
        </div>

        <div className="mt-8">
          {selectedRole === 'admin' ? (
            <form onSubmit={handleAdminLogin} className="glass-panel rounded-xl border border-slateui-200 p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Admin Login</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slateui-700">Username</span>
                  <input
                    value={adminCredentials.username}
                    onChange={(event) => {
                      setAdminCredentials((prev) => ({ ...prev, username: event.target.value }));
                      setError('');
                    }}
                    className="w-full rounded-xl border border-slateui-200 bg-white px-4 py-3 text-slateui-900 outline-none transition placeholder:text-slateui-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="admin"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slateui-700">Password</span>
                  <input
                    type="password"
                    value={adminCredentials.password}
                    onChange={(event) => {
                      setAdminCredentials((prev) => ({ ...prev, password: event.target.value }));
                      setError('');
                    }}
                    className="w-full rounded-xl border border-slateui-200 bg-white px-4 py-3 text-slateui-900 outline-none transition placeholder:text-slateui-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="1234"
                  />
                </label>
              </div>

              {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={isSubmitting} className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Signing in...' : 'Enter Admin Panel'}
                </button>
                <p className="text-xs uppercase tracking-[0.2em] text-slateui-500">Uses backend admin auth</p>
              </div>
            </form>
          ) : (
            <div className="glass-panel rounded-xl border border-slateui-200 p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Verifier Access</p>
              <p className="mt-3 max-w-2xl text-sm text-slateui-600">
                Continue as verifier to test certificate authenticity using certificate ID input or QR scan simulation.
              </p>
              <button
                type="button"
                onClick={continueAsVerifier}
                className="mt-5 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Continue as Verifier
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}