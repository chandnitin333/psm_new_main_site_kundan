import { useEffect, useState } from 'react';

interface Props {
  seconds: number; // remaining seconds until maintenance
}

const fmt = (s: number) => {
  if (s <= 0) return '00:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// Top warning banner shown to ALL users (logged in or not) when a maintenance
// is scheduled. Live countdown; when it hits 0 the page reloads -> the backend
// then reports full maintenance -> Under Maintenance page.
const MaintenanceBanner = ({ seconds }: Props) => {
  const [left, setLeft] = useState(seconds);

  useEffect(() => { setLeft(seconds); }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      // deadline reached — reload so the maintenance gate kicks in
      const t = setTimeout(() => window.location.reload(), 800);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  // push the whole app down so the fixed banner doesn't cover the header/sidebar.
  // The body class shifts the fixed header (top-0) and sidebar (top-16) down by
  // the banner height; on unmount everything snaps back to normal.
  useEffect(() => {
    const prev = document.body.style.paddingTop;
    document.body.style.paddingTop = '42px';
    document.body.classList.add('maint-banner-on');
    return () => {
      document.body.style.paddingTop = prev;
      document.body.classList.remove('maint-banner-on');
    };
  }, []);

  const msg = `⚠️ सूचना: ही वेबसाईट ${fmt(left)} मिनिटांत देखभालीसाठी बंद होणार आहे — कृपया तुमचे काम जतन (Save) करून ठेवा!  •  Site will go under maintenance in ${fmt(left)} — please save your work!`;

  return (
    <div className="mbar">
      <style>{`
        .mbar {
          position: fixed; top: 0; left: 0; right: 0; height: 42px; z-index: 100000;
          display: flex; align-items: center; overflow: hidden; color: #1f1300;
          background: repeating-linear-gradient(45deg, #f59e0b, #f59e0b 18px, #fbbf24 18px, #fbbf24 36px);
          box-shadow: 0 2px 10px rgba(0,0,0,.25); font-weight: 700;
        }
        .mbar-chip {
          flex-shrink: 0; z-index: 2; height: 100%; display: flex; align-items: center; gap: 8px;
          padding: 0 16px; background: #7f1d1d; color: #fff; font-weight: 800; font-size: 14px;
          letter-spacing: .03em;
        }
        .mbar-dot { width: 9px; height: 9px; border-radius: 50%; background: #ef4444; animation: mbarBlink 1s steps(2) infinite; }
        @keyframes mbarBlink { 50% { opacity: .25; } }
        .mbar-track { flex: 1; overflow: hidden; white-space: nowrap; position: relative; }
        .mbar-track span { display: inline-block; padding-left: 100%; animation: mbarScroll 18s linear infinite; font-size: 14px; }
        @keyframes mbarScroll { to { transform: translateX(-100%); } }
      `}</style>
      <div className="mbar-chip"><span className="mbar-dot" />⏳ {fmt(left)}</div>
      <div className="mbar-track"><span>{msg}</span></div>
    </div>
  );
};

export default MaintenanceBanner;
