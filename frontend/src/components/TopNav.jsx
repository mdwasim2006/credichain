import { Link } from 'react-router-dom';

export default function TopNav({ session, onLogout }) {
  const role = session?.role || 'Guest';

  return (
    <header className="sticky top-0 z-30 border-b border-slateui-200 bg-white/90 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 text-lg font-black text-white shadow-glow">
            C
          </div>
          <div>
            <p className="text-base font-bold text-slateui-900">CrediChain</p>
            <p className="text-xs uppercase tracking-[0.25em] text-slateui-500">Certificate Verification System</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden rounded-full bg-slateui-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slateui-600 sm:block">
            Role: {String(role).toUpperCase()}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}