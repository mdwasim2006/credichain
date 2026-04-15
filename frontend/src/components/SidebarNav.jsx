import { useNavigate } from 'react-router-dom';

const adminItems = [
  { to: '/dashboard', label: 'Dashboard', hint: 'Overview & KPIs' },
  { to: '/admin', label: 'Issue Certificate', hint: 'Create and sign' },
  { to: '/audit', label: 'Audit Logs', hint: 'Verification history' }
];

const verifierItems = [
  { to: '/verify', label: 'Verify Certificate', hint: 'Scan or enter ID' }
];

export default function SidebarNav({ role }) {
  const navigate = useNavigate();
  const items = role === 'admin' ? adminItems : verifierItems;

  function handleNavigate(path, label) {
    console.log(`[SidebarNav] Navigating to ${path} from ${label}`);
    navigate(path);
  }

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slateui-200 bg-white/90 px-5 py-6 backdrop-blur-xl lg:block">
      <div className="mb-8 rounded-xl bg-slateui-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Enterprise Console</p>
        <p className="mt-2 text-sm text-slateui-600">Manage certificate issuance, verification, and audit trails.</p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleNavigate(item.to, item.label)}
            className="group block w-full rounded-xl border border-transparent px-4 py-3 text-left transition hover:border-slateui-200 hover:bg-slateui-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slateui-900">{item.label}</p>
                <p className="mt-1 text-xs text-slateui-500">{item.hint}</p>
              </div>
              <span className="rounded-full bg-slateui-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slateui-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                Go
              </span>
            </div>
          </button>
        ))}
      </nav>

      <div className="mt-8 rounded-xl border border-slateui-200 bg-slateui-50 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slateui-500">Visual Language</p>
        <div className="mt-3 space-y-2 text-sm text-slateui-600">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-600" />Primary</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" />Success</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600" />Error</div>
        </div>
      </div>
    </aside>
  );
}