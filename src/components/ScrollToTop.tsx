import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll the page to the top whenever the route (pathname) changes, so opening a
 * new page never starts mid-scroll. Mounted inside each layout. Renders nothing.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // window + document (covers both window-scroll and html/body-scroll setups)
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
};

export default ScrollToTop;
