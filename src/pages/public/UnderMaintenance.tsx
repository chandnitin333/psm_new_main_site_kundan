import { useEffect } from 'react';

interface Props {
  message?: string;
  since?: string; // "YYYY-MM-DD HH:MM:SS" — when maintenance started
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtSince = (s?: string) => {
  if (!s) return '';
  const m = String(s).replace('T', ' ').match(/(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})/);
  if (!m) return s;
  const [, , mo, d, hh, mm] = m;
  return `${d} ${MONTHS[Number(mo) - 1]}, ${hh}:${mm}`;
};

const UnderMaintenance = ({ message, since }: Props) => {
  useEffect(() => {
    document.title = 'Maintenance Mode | देखभाल सुरू आहे';
  }, []);

  const sinceText = fmtSince(since);

  return (
    <div className="mz-root">
      <style>{`
        .mz-root {
          position: fixed; inset: 0; overflow: hidden;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 6px; text-align: center; color: #e6f2ff; font-family: 'Segoe UI', system-ui, sans-serif;
          background:
            radial-gradient(900px 500px at 50% 35%, #1f8fd6 0%, #135fa8 38%, #0a3a78 66%, #061d3f 100%);
          background-color: #07306a;
        }
        .mz-root::before { /* subtle grid glow */
          content:''; position:absolute; inset:0;
          background-image: radial-gradient(circle at 50% 42%, rgba(56,189,248,.25), transparent 55%);
          pointer-events:none;
        }

        /* ===== floating code dust ===== */
        .mz-dust { position:absolute; inset:0; pointer-events:none; }
        .mz-dust span { position:absolute; color: rgba(125,211,252,.12); font-weight:800; animation: mzFloat linear infinite; }
        @keyframes mzFloat { 0%{transform:translateY(105vh) rotate(0);opacity:0} 12%{opacity:1} 88%{opacity:1} 100%{transform:translateY(-15vh) rotate(360deg);opacity:0} }

        /* ===== 3D scene ===== */
        .mz-scene { position: relative; width: min(760px, 94vw); height: 340px; z-index: 3; }
        .mz-el { position:absolute; filter: drop-shadow(0 14px 26px rgba(0,0,0,.45)); }
        @keyframes mzFloatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes mzSpin { to { transform: rotate(360deg); } }
        @keyframes mzGlow { 0%,100%{box-shadow:0 0 22px rgba(56,189,248,.45)} 50%{box-shadow:0 0 40px rgba(56,189,248,.85)} }

        /* laptop center */
        .mz-laptop { left: 50%; bottom: 18px; transform: translateX(-50%); font-size: 150px; line-height:1; z-index: 4; }
        .mz-laptop span { display:inline-block; animation: mzFloatY 4s ease-in-out infinite; }

        /* glassy floating UI cards */
        .ui-card {
          position:absolute; z-index: 5; width: 120px; border-radius: 12px; padding: 9px;
          background: linear-gradient(160deg, rgba(14,165,233,.30), rgba(2,132,199,.22));
          border: 1px solid rgba(125,211,252,.5); backdrop-filter: blur(3px);
          animation: mzFloatY 5s ease-in-out infinite, mzGlow 3.5s ease-in-out infinite;
        }
        .ui-bar { height: 7px; border-radius: 6px; margin-bottom: 6px; background: rgba(255,255,255,.85); }
        .ui-bar.acc { background: linear-gradient(90deg,#38bdf8,#22d3ee); }
        .ui-bar.org { background: linear-gradient(90deg,#fbbf24,#f59e0b); }
        .ui-bar.w70{width:70%}.ui-bar.w50{width:50%}.ui-bar.w90{width:90%}.ui-bar.w40{width:40%}
        .ui-dots { display:flex; gap:4px; margin-top:4px; }
        .ui-dots i { width:7px;height:7px;border-radius:50%; background:#7dd3fc; display:block; }
        .ui-pie { width:34px;height:34px;border-radius:50%; margin:2px auto 0;
          background: conic-gradient(#38bdf8 0 40%, #f59e0b 40% 65%, #34d399 65% 100%); }

        .c1 { top: 6px;  left: 8%;  animation-delay:.0s; }
        .c2 { top: 0px;  left: 38%; width:140px; animation-delay:.6s; }
        .c3 { top: 30px; right: 12%; animation-delay:.3s; }
        .c4 { top: 150px; left: 2%;  animation-delay:.9s; }
        .c5 { top: 168px; right: 6%; animation-delay:.45s; }

        /* wrench, gears, phone */
        .mz-wrench { left: -6px; top: 120px; font-size: 84px; animation: mzFloatY 4.5s ease-in-out infinite; transform: rotate(-18deg); }
        .mz-phone  { right: 2%; top: 70px; font-size: 96px; animation: mzFloatY 5s ease-in-out infinite .4s; }
        .mz-gear1  { right: -8px; bottom: 22px; font-size: 64px; animation: mzSpin 8s linear infinite; }
        .mz-gear2  { right: 40px; bottom: 0px; font-size: 50px; animation: mzSpin 6s linear infinite reverse; }

        /* ===== text ===== */
        .mz-text { position: relative; z-index: 6; max-width: 620px; padding: 0 18px; margin-top: 4px; }
        .mz-title { font-size: clamp(26px,5.5vw,42px); font-weight: 900; margin: 0 0 2px;
          background: linear-gradient(90deg,#bae6fd,#7dd3fc,#e0f2fe); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .mz-sub { font-size: 12.5px; font-weight:800; letter-spacing:.28em; text-transform:uppercase; color:#7dd3fc; margin:0 0 14px; }
        .mz-msg { font-size: 15px; color:#cfe8ff; line-height:1.65; margin:0 auto 18px; max-width:520px; }
        .mz-bar { height:8px; width:min(340px,78vw); border-radius:999px; background:rgba(255,255,255,.16); overflow:hidden; margin:0 auto 22px; }
        .mz-bar i { display:block; height:100%; width:36%; border-radius:999px; background:linear-gradient(90deg,#38bdf8,#22d3ee); animation: mzBar 1.7s ease-in-out infinite; }
        @keyframes mzBar { 0%{margin-left:-36%} 100%{margin-left:100%} }
        .mz-btn { padding:12px 30px; border:none; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer; color:#06283d;
          background: linear-gradient(90deg,#7dd3fc,#38bdf8); box-shadow:0 10px 30px rgba(56,189,248,.5); transition:transform .15s; }
        .mz-btn:hover { transform: translateY(-2px); }
        .mz-foot { margin-top:16px; font-size:12px; color:#9cc3e6; z-index:6; }
        @media (max-width: 600px){ .mz-scene{ height: 270px; } .mz-laptop{ font-size:110px; } }
      `}</style>

      <div className="mz-dust">
        {['</>', '{ }', '01', '=>', ';', '#', '( )', '[ ]', 'fn', '==='].map((s, i) => (
          <span key={i} style={{ left: `${(i * 9 + 4) % 95}%`, animationDuration: `${10 + (i % 5) * 2}s`, animationDelay: `${(i % 6) * 1.3}s`, fontSize: `${28 + (i % 4) * 12}px` }}>{s}</span>
        ))}
      </div>

      <div className="mz-scene">
        {/* floating UI / dashboard cards */}
        <div className="ui-card c1"><div className="ui-bar acc w90" /><div className="ui-bar w50" /><div className="ui-dots"><i/><i/><i/></div></div>
        <div className="ui-card c2"><div className="ui-bar w70" /><div className="ui-bar org w40" /><div className="ui-bar acc w90" /></div>
        <div className="ui-card c3"><div className="ui-pie" /><div className="ui-bar w70" style={{ marginTop: 6 }} /></div>
        <div className="ui-card c4"><div className="ui-bar acc w70" /><div className="ui-bar w90" /></div>
        <div className="ui-card c5"><div className="ui-bar org w50" /><div className="ui-bar w70" /></div>

        {/* hardware */}
        <div className="mz-el mz-wrench">🔧</div>
        <div className="mz-el mz-phone">📱</div>
        <div className="mz-el mz-gear1">⚙️</div>
        <div className="mz-el mz-gear2">⚙️</div>
        <div className="mz-el mz-laptop"><span>💻</span></div>
      </div>

      <div className="mz-text">
        <h1 className="mz-title">देखभाल सुरू आहे</h1>
        <p className="mz-sub">Site Under Maintenance · Updating</p>
        <div className="mz-bar"><i /></div>
        <p className="mz-msg">
          {message || 'आमचे डेव्हलपर्स वेबसाइट अपडेट करत आहेत. साइट लवकरच पुन्हा सुरू होईल — कृपया थोड्या वेळाने भेट द्या.'}
        </p>
        {sinceText && (
          <div style={{
            display: 'inline-block', margin: '0 auto 18px', padding: '7px 16px', borderRadius: 999,
            background: 'rgba(56,189,248,0.18)', border: '1px solid rgba(125,211,252,0.5)',
            color: '#bae6fd', fontSize: 13.5, fontWeight: 600,
          }}>
            🕐 देखभाल सुरू: {sinceText}
          </div>
        )}
        <button className="mz-btn" onClick={() => window.location.reload()}>↻ पुन्हा प्रयत्न करा (Retry)</button>
        <div className="mz-foot">👨‍💻 आमची टीम कामावर आहे • We'll be back shortly</div>
      </div>
    </div>
  );
};

export default UnderMaintenance;
