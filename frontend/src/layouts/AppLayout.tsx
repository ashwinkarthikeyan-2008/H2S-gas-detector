import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  PanelsTopLeft,
  Gauge,
  ContactRound,
  ChartNoAxesCombined,
  ShieldAlert,
  ChartSpline,
  UsersRound,
  BellDot,
  Menu,
  X,
  UserCheck,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { api } from '../services/api';
import { LoginResponse } from '../types';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV_GROUPS: { groupTitle: string; items: NavItem[] }[] = [
  {
    groupTitle: 'ADMIN MONITORING',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: PanelsTopLeft, exact: true },
      { path: '/exposure-monitoring', label: 'Exposure Monitoring', icon: ChartSpline, exact: true },
      { path: '/admin-details', label: 'Admin Details', icon: ContactRound, exact: true },
      { path: '/workers', label: 'Worker Details', icon: UsersRound, exact: true },
      { path: '/alerts', label: 'Worker Alerts', icon: BellDot, exact: true },
    ],
  },
];

const WORKER_NAV_GROUPS: { groupTitle: string; items: NavItem[] }[] = [
  {
    groupTitle: 'MY WORKSPACE',
    items: [
      { path: '/dashboard', label: 'My Dashboard', icon: Gauge },
      { path: '/worker-details', label: 'My Details', icon: ContactRound, exact: true },
      { path: '/worker-exposure', label: 'Shift Exposure', icon: ChartNoAxesCombined, exact: true },
      { path: '/alerts', label: 'Safety Alerts', icon: ShieldAlert },
    ],
  },
];

const WORKER_ICON_TONES: Record<string, string> = {
  'My Dashboard': 'bg-cyan-400/12 border-cyan-300/25 text-cyan-300',
  'My Details': 'bg-sky-400/12 border-sky-300/25 text-sky-300',
  'Shift Exposure': 'bg-emerald-400/12 border-emerald-300/25 text-emerald-300',
  'Safety Alerts': 'bg-amber-400/12 border-amber-300/25 text-amber-300',
};

const ADMIN_ICON_TONES: Record<string, string> = {
  Dashboard: 'bg-cyan-400/12 border-cyan-300/25 text-cyan-300',
  'Exposure Monitoring': 'bg-violet-400/12 border-violet-300/25 text-violet-300',
  'Admin Details': 'bg-teal-400/12 border-teal-300/25 text-teal-300',
  'Worker Details': 'bg-sky-400/12 border-sky-300/25 text-sky-300',
  'Worker Alerts': 'bg-amber-400/12 border-amber-300/25 text-amber-300',
};

const NavIconTile: React.FC<{ item: NavItem; active: boolean; role: 'admin' | 'worker' }> = ({ item, active, role }) => {
  const Icon = item.icon;
  const tones = role === 'worker' ? WORKER_ICON_TONES : ADMIN_ICON_TONES;
  return (
    <span className={`app-nav-icon-tile relative flex w-10 h-10 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105 ${tones[item.label] || 'bg-cyan-400/10 border-cyan-300/20 text-cyan-300'} ${active ? 'shadow-[0_0_14px_rgba(34,211,238,.16)]' : ''}`}>
      <Icon className="w-5 h-5" />
      <span className="absolute right-1.5 bottom-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-80" />
    </span>
  );
};
export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<LoginResponse>(() => {
    try {
      const saved = localStorage.getItem('chromaguard_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token && ['ROLE_ADMIN', 'ROLE_WORKER'].includes(parsed.role)) return parsed;
      }
    } catch {}
    return {
      token: null,
      username: null,
      role: null,
      fullName: null,
      associatedWorkerId: null,
      message: 'Active session',
    };
  });
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = Boolean(currentUser.token && ['ROLE_ADMIN', 'ROLE_WORKER'].includes(currentUser.role || ''));
  const navGroups = currentUser.role === 'ROLE_WORKER'
    ? WORKER_NAV_GROUPS
    : NAV_GROUPS;
  const adminNavGroups = currentUser.role === 'ROLE_ADMIN' ? navGroups : [];
  const visibleNavItems = (currentUser.role === 'ROLE_ADMIN' ? adminNavGroups : navGroups).flatMap((group) => group.items);

  useEffect(() => {
    if (!authenticated && location.pathname !== '/login') navigate('/login', { replace: true });
    if (authenticated && location.pathname === '/login') navigate('/dashboard', { replace: true });
    const adminOnlyPaths = ['/workers', '/records', '/analytics', '/zones', '/exposure-monitoring', '/admin-details'];
    if (currentUser.role === 'ROLE_WORKER' && adminOnlyPaths.includes(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
    const workerOnlyPaths = ['/worker-details', '/worker-exposure'];
    if (currentUser.role === 'ROLE_ADMIN' && workerOnlyPaths.includes(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [authenticated, currentUser.role, location.pathname, navigate]);

  useEffect(() => {
    if (localStorage.getItem('chromaguard_user')) {
      try {
        const saved = JSON.parse(localStorage.getItem('chromaguard_user') || '{}');
        if (saved?.token && ['ROLE_ADMIN', 'ROLE_WORKER'].includes(saved.role)) return;
      } catch {}
      localStorage.removeItem('chromaguard_user');
    }
    navigate('/login', { replace: true });
  }, []);

  useEffect(() => {
    const fetchAlertCount = () => {
      if (currentUser.role === 'ROLE_WORKER') {
        const workerId = currentUser.associatedWorkerId;
        if (!workerId) { setAlertCount(0); return; }
        api.getAlerts({ workerId }).then((alerts) => {
          setAlertCount(alerts.filter((alert) => !alert.isAcknowledged).length);
        }).catch(() => setAlertCount(0));
        return;
      }
      api.getSummary()
        .then((s) => {
          setAlertCount(s.unacknowledgedAlerts !== undefined ? s.unacknowledgedAlerts : s.totalAlerts);
        })
        .catch(() => {
          setAlertCount(40);
        });
    };
    const handleUserChanged = (event: Event) => {
      const user = (event as CustomEvent<LoginResponse | null>).detail;
      if (!user?.token) {
        localStorage.removeItem('chromaguard_user');
        navigate('/login', { replace: true });
        return;
      }
      setCurrentUser(user);
    };

    fetchAlertCount();
    const alertPollingTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchAlertCount();
    }, 15_000);

    window.addEventListener('chromaguard:simulation-reset', fetchAlertCount);
    window.addEventListener('chromaguard:alert-acknowledged', fetchAlertCount);
    window.addEventListener('chromaguard:alert-created', fetchAlertCount);
    window.addEventListener('chromaguard:user-changed', handleUserChanged);
    return () => {
      window.removeEventListener('chromaguard:simulation-reset', fetchAlertCount);
      window.removeEventListener('chromaguard:alert-acknowledged', fetchAlertCount);
      window.removeEventListener('chromaguard:alert-created', fetchAlertCount);
      window.removeEventListener('chromaguard:user-changed', handleUserChanged);
      window.clearInterval(alertPollingTimer);
    };
  }, [currentUser]);

  const isNavActive = (item: NavItem) => item.path === '/dashboard'
      ? location.pathname === item.path && !location.hash
      : item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path) && item.path !== '/';

  const getPageTitle = () => {
    const item = visibleNavItems.find(isNavActive);
    return item ? item.label : 'ChromaGuard Platform';
  };
  const routeKey = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';

  const signOut = () => {
    localStorage.removeItem('chromaguard_user');
    setCurrentUser({ token: null, username: null, role: null, fullName: null, associatedWorkerId: null, message: 'Signed out' });
    navigate('/login', { replace: true });
  };

  return (
    !authenticated ? null : <div className={`app-shell ${currentUser.role === 'ROLE_ADMIN' ? 'role-admin' : 'role-worker'} min-h-screen text-slate-700 flex flex-col md:flex-row selection:bg-cyan-200 selection:text-cyan-950`}>
      {/* Reset Simulation Dialog */}
      {/* Desktop Left Sidebar */}
      <aside className="app-sidebar hidden md:flex flex-col w-64 bg-midnight-900/95 border-r border-slate-800/80 backdrop-blur-2xl h-screen sticky top-0 z-40 select-none shadow-2xl">
        {/* Brand Header */}
        <div className="app-brand p-5 border-b border-slate-800/80 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-accent to-cyan-500 flex items-center justify-center shadow-glow-cyan/50 ring-1 ring-cyan-300/40">
            <span className="text-lg font-black text-white">C</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-bold tracking-tight text-white font-sans">Chroma</span>
              <span className="text-lg font-bold tracking-tight text-cyan-glow font-sans">Guard</span>
            </div>
            <p className="text-[10px] text-cyan-400 font-mono tracking-widest font-semibold uppercase">
              H₂S INDUSTRIAL INTEL
            </p>
          </div>
        </div>

        {/* Navigation Links with Group Headers */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {(currentUser.role === 'ROLE_ADMIN' ? adminNavGroups : navGroups).map((group) => (
            <div key={group.groupTitle} className="space-y-1.5">
              <p className="app-nav-group-title px-3 text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">
                {group.groupTitle}
              </p>
              <div className="space-y-1 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavActive(item);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`app-nav-link relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${isActive ? 'app-nav-link-active' : ''} ${
                        isActive
                          ? 'bg-cyan-500/12 text-cyan-glow border border-cyan-500/35 shadow-glow-cyan-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-cyan-glow before:rounded-r'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-midnight-800/70 border border-transparent hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {currentUser.role === 'ROLE_WORKER' || currentUser.role === 'ROLE_ADMIN'
                          ? <NavIconTile item={item} active={isActive} role={currentUser.role === 'ROLE_WORKER' ? 'worker' : 'admin'} />
                          : <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${isActive ? 'text-cyan-glow' : 'text-slate-400 group-hover:text-cyan-400'}`} />}
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.path === '/alerts' && alertCount !== null && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 shadow-sm">
                          {alertCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="app-topbar h-16 bg-midnight-900/85 border-b border-slate-800/80 backdrop-blur-2xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center space-x-4 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-midnight-850 border border-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb Header */}
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 truncate">
              <span className="text-slate-300 hidden sm:inline">ChromaGuard</span>
              <span className="text-slate-400 hidden sm:inline">/</span>
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight font-sans truncate">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Worker identity menu */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="app-profile-trigger flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-midnight-850 hover:bg-midnight-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition shadow-sm group"
                title="Open account details and sign out"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400"><UserCheck className="w-4 h-4" /></div>
                <div className="hidden sm:flex flex-col text-left leading-tight min-w-0">
                  <span className="max-w-32 truncate text-[11px] font-semibold text-white">{currentUser.fullName || currentUser.username}</span>
                  <span className="text-[9px] text-cyan-400 font-mono">{currentUser.role === 'ROLE_ADMIN' ? 'ADMIN' : `WORKER · ${currentUser.associatedWorkerId || 'PROFILE'}`}</span>
                </div>
                <ChevronDown className={`hidden sm:block w-3.5 h-3.5 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileOpen && <>
                <button className="fixed inset-0 z-40 cursor-default" aria-label="Close account menu" onClick={() => setProfileOpen(false)} />
                <div role="menu" className="app-profile-menu absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center"><UserCheck className="w-5 h-5" /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{currentUser.fullName || currentUser.username}</p></div>
                  </div>
                  <div className="py-3 space-y-2 text-xs">
                    {currentUser.role === 'ROLE_ADMIN' && <div className="flex justify-between gap-2"><span className="text-slate-500">Admin ID</span><strong className="text-slate-700">{currentUser.username || 'Not available'}</strong></div>}
                    {currentUser.role === 'ROLE_WORKER' && <div className="flex justify-between gap-2"><span className="text-slate-500">Worker ID</span><strong className="text-slate-700">{currentUser.associatedWorkerId || 'Not linked'}</strong></div>}
                  </div>
                  <button role="menuitem" onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"><LogOut className="w-4 h-4" />Sign out</button>
                </div>
              </>}
            </div>

          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="app-mobile-nav md:hidden bg-midnight-900/98 border-b border-slate-800 px-4 py-4 space-y-4 backdrop-blur-3xl shadow-2xl">
            {(currentUser.role === 'ROLE_ADMIN' ? adminNavGroups : navGroups).map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <p className="app-nav-group-title px-2 text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">
                  {group.groupTitle}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavActive(item);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`app-nav-link flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${isActive ? 'app-nav-link-active' : ''} ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-glow border border-cyan-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {currentUser.role === 'ROLE_WORKER' || currentUser.role === 'ROLE_ADMIN'
                          ? <NavIconTile item={item} active={isActive} role={currentUser.role === 'ROLE_WORKER' ? 'worker' : 'admin'} />
                          : <Icon className="w-4 h-4 text-cyan-400" />}
                        <span>{item.label}</span>
                      </div>
                      {item.path === '/alerts' && alertCount !== null && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
                          {alertCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}

          </div>
        )}

        {/* Page Content Outlet */}
        <main className={`app-page-view workspace-route-${routeKey} flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
