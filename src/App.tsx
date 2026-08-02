import { useMemo, useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { LoadingProvider } from './contexts/LoadingContext';
import { createRouter } from './routes';
import InstallPWA from './components/pwa/InstallPWA';
import AppLock from './components/applock/AppLock';
import ForcePasswordChange from './components/auth/ForcePasswordChange';
import UnderMaintenance from './pages/public/UnderMaintenance';
import MaintenanceBanner from './components/MaintenanceBanner';
import { api } from './services/api';
import { trackAction, flushTracker } from './utils/tracker';
import AppErrorBoundary from './components/AppErrorBoundary';
import { initErrorCapture } from './utils/errorLog';

// self-hosted client error monitoring — attach global handlers once
initErrorCapture();

function App() {
  // Maintenance gate — controlled from admin System Settings (maintenance_mode).
  // `checked` lets us wait for the status before rendering, so a refresh on the
  // /maintenance URL goes to the right place (no home flash / no 404).
  const [maintenance, setMaintenance] = useState<{ checked: boolean; enabled: boolean; message: string; scheduled: boolean; remaining: number; since: string }>({
    checked: false,
    enabled: false,
    message: '',
    scheduled: false,
    remaining: 0,
    since: '',
  });

  useEffect(() => {
    let alive = true;
    const check = () => api
      .get<{ enabled: boolean; message: string; scheduled?: boolean; remaining_seconds?: number; since?: string }>('/public/maintenance')
      .then((res) => {
        const d = (res?.data || {}) as { enabled?: boolean; message?: string; scheduled?: boolean; remaining_seconds?: number; since?: string };
        if (alive) setMaintenance({
          checked: true,
          enabled: !!d.enabled,
          message: d.message || '',
          scheduled: !!d.scheduled,
          remaining: d.remaining_seconds || 0,
          since: d.since || '',
        });
      })
      .catch(() => { if (alive) setMaintenance((m) => ({ ...m, checked: true })); });
    check();
    // re-check every 60s so a newly-scheduled maintenance shows up without a manual refresh
    const id = setInterval(check, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  const handleLogout = async () => {
    // Track the logout BEFORE clearing the token, then flush so it actually sends.
    trackAction('लॉग आऊट केले (Logout)', { page: window.location.pathname });
    try { await flushTracker(); } catch { /* ignore */ }
    localStorage.clear();
    window.location.href = '/login';
  };

  const router = useMemo(() => createRouter(handleLogout), []);

  // When maintenance is ON, reflect it in the address bar (any direct URL the
  // user hit becomes /maintenance) — the gate below already blocks every route.
  useEffect(() => {
    if (maintenance.enabled) {
      document.title = 'Maintenance Mode | देखभाल सुरू आहे';
      if (window.location.pathname !== '/maintenance') {
        window.history.replaceState(null, '', '/maintenance');
      }
    }
  }, [maintenance.enabled]);

  // Wait for the maintenance status before rendering (brief) — avoids a flash
  // of the app / a 404 on the /maintenance URL.
  if (!maintenance.checked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ width: 38, height: 38, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'appspin 0.8s linear infinite' }} />
        <style>{`@keyframes appspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (maintenance.enabled) {
    return <UnderMaintenance message={maintenance.message} since={maintenance.since} />;
  }

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <LoadingProvider>
          {maintenance.scheduled && <MaintenanceBanner seconds={maintenance.remaining} />}
          <RouterProvider router={router} />
          <InstallPWA />
          <AppLock />
          <ForcePasswordChange />
        </LoadingProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
