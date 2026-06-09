import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initTracker, trackPageView, trackClick } from '../utils/tracker';

/**
 * Mounts once inside the dashboard. Records a page_view on every route change
 * and captures meaningful clicks (buttons / links / [data-track]).
 */
const PageTracker = () => {
  const location = useLocation();

  // page view on route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // global click capture (set up once)
  useEffect(() => {
    initTracker();
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest('button, a, [data-track], [role="button"]') as HTMLElement | null;
      if (!el) return;
      const label =
        el.getAttribute('data-track') ||
        el.getAttribute('title') ||
        el.getAttribute('aria-label') ||
        (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) ||
        el.tagName.toLowerCase();
      if (label) trackClick(label, window.location.pathname);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
};

export default PageTracker;
