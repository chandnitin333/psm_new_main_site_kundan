import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { citizenNotificationService } from '../services';

/* Floating bell for citizens — shows unread सूचना count, taps to /my-notifications.
   Polls unread every 60s; refreshes when returning to the app / route change. */
const CitizenNotifBell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  const fetchCount = async () => {
    try {
      const res = await citizenNotificationService.getUnreadCount();
      if (res?.success && res.data) setUnread(res.data.unread || 0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchCount();
    const iv = setInterval(fetchCount, 60000);
    const onVis = () => { if (document.visibilityState === 'visible') fetchCount(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // refresh count on navigation (e.g. after reading on /my-notifications)
  useEffect(() => { fetchCount(); }, [location.pathname]);

  // hide on the notifications page itself
  if (location.pathname === '/my-notifications') return null;

  return (
    <button
      onClick={() => navigate('/my-notifications')}
      aria-label="सूचना"
      className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700 print:hidden"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
};

export default CitizenNotifBell;
