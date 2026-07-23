import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { MarathiInput } from '../common';
import { commonDdlService } from '../../services';
import { canModule, isFullAccess, canAnyCertificate } from '../../utils/permissions';
import { FLOWS, matchFlow, type Flow, type FlowStep } from './gramSahayak.flows';

interface Msg { role: 'bot' | 'user'; text: string }
interface Opt { label: string; value: string }

const currentYear = new Date().getFullYear();
const YEAR_OPTS: Opt[] = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear - i;
  return { label: String(y), value: String(y) };
});

const GREETING = 'नमस्कार! 🙏 मी ग्राम सहायक. मला सांगा काय हवंय — अहवाल, वसुली, प्रमाणपत्र किंवा कोणतेही पान. खालीलपैकी निवडा किंवा टाइप करा.';
const WELCOME_VOICE = 'नमस्कार, मी ग्राम सहायक. मी तुमच्या मदतीस उपलब्ध आहे. खालील पर्यायांमधून निवडा.';

const GramSahayak = () => {
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();

  // open state + conversation persist across layout remounts (each route group has its
  // own DashboardLayout, so navigating remounts this widget — without this it'd close).
  const [open, setOpen] = useState<boolean>(() => sessionStorage.getItem('gs_open') === '1');
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const s = sessionStorage.getItem('gs_msgs');
      if (s) return JSON.parse(s) as Msg[];
    } catch { /* ignore */ }
    return [{ role: 'bot', text: GREETING }];
  });
  const [text, setText] = useState('');

  // active flow state
  const [flow, setFlow] = useState<Flow | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const answersRef = useRef<Record<string, string>>({});

  // ward options (fetched once)
  const [wards, setWards] = useState<Opt[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // voice OUTPUT — text-to-speech (reads messages aloud, free browser API, Marathi)
  const ttsSupported = useMemo(() => typeof window !== 'undefined' && 'speechSynthesis' in window, []);
  const [muted, setMuted] = useState<boolean>(() => sessionStorage.getItem('gs_muted') === '1');
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; sessionStorage.setItem('gs_muted', muted ? '1' : '0'); }, [muted]);
  // holds the latest speak() so handlers/closures always call the current one
  const speakRef = useRef<(t: string) => void>(() => {});

  const ctx = { navigate, toastError: (m: string) => toast.error(m) };

  // only the flows this user is allowed to use (permission-based)
  const visibleFlows = useMemo<Flow[]>(() => {
    if (isFullAccess()) return FLOWS;
    return FLOWS.filter((f) => {
      if (f.id === 'nav-certificates') return canAnyCertificate();
      return f.module ? canModule(f.module) : true;
    });
  }, []);

  const push = (m: Msg) => setMsgs((p) => [...p, m]);
  const pushBot = (t: string) => { push({ role: 'bot', text: t }); speakRef.current(t); };
  const pushUser = (t: string) => push({ role: 'user', text: t });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  // persist open + messages so the widget survives layout remounts on navigation
  useEffect(() => { sessionStorage.setItem('gs_open', open ? '1' : '0'); }, [open]);
  useEffect(() => {
    try { sessionStorage.setItem('gs_msgs', JSON.stringify(msgs.slice(-40))); } catch { /* ignore */ }
  }, [msgs]);

  // fetch wards on first open
  useEffect(() => {
    if (!open || wards.length) return;
    (async () => {
      try {
        const res = await commonDdlService.getWards();
        if (res.success) {
          const opts = ((res.data as { ward_number: string | number }[]) || [])
            .filter((w) => w.ward_number !== null && w.ward_number !== undefined && w.ward_number !== '')
            .map((w) => ({ value: String(w.ward_number), label: `प्रभाग ${w.ward_number}` }));
          setWards(opts);
        }
      } catch { /* ignore — ward step will just show 'सर्व वॉर्ड' */ }
    })();
  }, [open, wards.length]);

  // speak text aloud — prefers a Marathi voice, falls back to Hindi (reads Devanagari
  // fine) so it isn't silent when no mr-IN voice is installed.
  const speak = useCallback((t: string) => {
    if (!ttsSupported || mutedRef.current || !t) return;
    const clean = t.replace(/[^ऀ-ॿa-zA-Z0-9\s.,?:/()-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    const synth = window.speechSynthesis;
    const run = () => {
      try {
        const voices = synth.getVoices();
        const v =
          voices.find((x) => x.lang === 'mr-IN') ||
          voices.find((x) => x.lang?.toLowerCase().startsWith('mr')) ||
          voices.find((x) => x.lang === 'hi-IN') ||
          voices.find((x) => x.lang?.toLowerCase().startsWith('hi')) ||
          undefined;
        // speak only with a real Marathi/Hindi voice (fluent). No such voice -> stay
        // silent rather than mispronouncing with an English voice.
        if (!v) return;
        const u = new SpeechSynthesisUtterance(clean);
        u.voice = v;
        u.lang = v.lang;
        u.rate = 0.95;
        // one utterance at a time (latest wins) — avoids Chrome's "only first of a queue plays" bug
        if (synth.speaking || synth.pending) synth.cancel();
        synth.resume();
        synth.speak(u);
      } catch { /* ignore */ }
    };
    if (synth.getVoices().length === 0) {
      // voices not loaded yet — run once they are (with a small fallback delay)
      let done = false;
      const go = () => { if (done) return; done = true; run(); };
      try { synth.addEventListener('voiceschanged', go, { once: true }); } catch { /* ignore */ }
      setTimeout(go, 300);
    } else {
      run();
    }
  }, [ttsSupported]);

  const stopSpeak = useCallback(() => {
    if (ttsSupported) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
  }, [ttsSupported]);

  useEffect(() => { speakRef.current = speak; }, [speak]);

  // warm up the voice list early so the first speak (on open click) isn't silent
  useEffect(() => { if (ttsSupported) { try { window.speechSynthesis.getVoices(); } catch { /* ignore */ } } }, [ttsSupported]);

  // stop any speech when the widget unmounts
  useEffect(() => () => { stopSpeak(); }, [stopSpeak]);

  const resetToMenu = useCallback(() => {
    setFlow(null);
    setStepIdx(0);
    answersRef.current = {};
  }, []);

  const finishFlow = useCallback(async (f: Flow) => {
    try {
      const result = await f.run({ ...answersRef.current }, ctx);
      pushBot(result);
    } catch {
      pushBot('क्षमस्व, काहीतरी अडचण आली. पुन्हा प्रयत्न करा.');
    }
    resetToMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToMenu]);

  const startFlow = useCallback((f: Flow) => {
    answersRef.current = {};
    if (f.steps.length === 0) {
      // navigation flow — run immediately
      pushUser(f.label);
      (async () => {
        const result = await f.run({}, ctx);
        pushBot(result);
      })();
      return;
    }
    setFlow(f);
    setStepIdx(0);
    pushUser(f.label);
    pushBot(f.steps[0].prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = useCallback((f: Flow, idx: number) => {
    const next = idx + 1;
    if (next >= f.steps.length) {
      void finishFlow(f);
    } else {
      setStepIdx(next);
      pushBot(f.steps[next].prompt);
    }
  }, [finishFlow]);

  // user answers the current step
  const answerStep = (display: string, value: string) => {
    if (!flow) return;
    const step = flow.steps[stepIdx];
    pushUser(display);
    answersRef.current[step.key] = value;
    advance(flow, stepIdx);   // the next prompt (or final response) is spoken via pushBot
  };

  const skipStep = () => {
    if (!flow) return;
    const step = flow.steps[stepIdx];
    pushUser('— वगळा —');
    answersRef.current[step.key] = '';
    advance(flow, stepIdx);
  };

  // free-text submit (menu mode = match a flow; in-flow = treat as text/number answer)
  const submitText = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    if (flow) {
      const step = flow.steps[stepIdx];
      if (step.type === 'text' || step.type === 'number' || step.type === 'ward' || step.type === 'year') {
        answerStep(t, t);
      }
      return;
    }
    // menu: match intent (only among allowed flows)
    pushUser(t);
    const f = matchFlow(t, visibleFlows);
    if (f) startFlow(f);
    else pushBot('मला नीट समजलं नाही. कृपया खालील पर्यायांपैकी निवडा 👇');
  };

  // options for the current step
  const stepOptions = (step: FlowStep): Opt[] => {
    if (step.type === 'options') return step.options || [];
    if (step.type === 'ward') return wards;
    if (step.type === 'year') return YEAR_OPTS;
    return [];
  };

  const step = flow ? flow.steps[stepIdx] : null;
  const showOptionButtons = step && (step.type === 'options' || step.type === 'ward' || step.type === 'year');

  // no permitted features → don't show the assistant at all
  if (visibleFlows.length === 0) return null;

  return (
    <>
      <ToastContainer />

      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => { setOpen(true); speakRef.current(WELCOME_VOICE); }}
          className="gv-float no-print fixed bottom-24 right-5 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700"
          aria-label="ग्राम सहायक"
          title="ग्राम सहायक"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="gv-float no-print fixed bottom-5 right-5 z-[1001] flex h-[70vh] max-h-[560px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          {/* header */}
          <div className="flex items-center justify-between bg-primary-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {flow && (
                <button onClick={() => { pushBot('ठीक आहे, मुख्य मेनूवर आलो. 👇'); resetToMenu(); }} className="rounded p-1 hover:bg-white/20" title="मागे">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <span className="text-lg">🤝</span>
              <div>
                <p className="text-sm font-bold leading-tight">ग्राम सहायक</p>
                <p className="text-[11px] opacity-80 leading-tight">तुमचा मदतनीस</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {ttsSupported && (
                <button
                  onClick={() => { if (!muted) stopSpeak(); setMuted((m) => !m); }}
                  className="rounded p-1 hover:bg-white/20"
                  title={muted ? 'आवाज सुरू करा' : 'आवाज बंद करा'}
                  aria-label="आवाज चालू/बंद"
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              )}
              <button onClick={() => { stopSpeak(); setOpen(false); }} className="rounded p-1 hover:bg-white/20" aria-label="बंद करा">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3 dark:bg-gray-900">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-primary-600 text-white'
                      : 'rounded-bl-sm bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* quick-reply / option buttons for current step or the menu */}
            <div className="flex flex-wrap gap-2 pt-1">
              {showOptionButtons && step ? (
                <>
                  {stepOptions(step).length === 0 && step.type === 'ward' ? (
                    <span className="text-xs text-gray-400">वॉर्ड लोड होत आहेत...</span>
                  ) : (
                    stepOptions(step).map((o) => (
                      <button
                        key={o.value}
                        onClick={() => answerStep(o.label, o.value)}
                        className="rounded-full border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-200"
                      >
                        {o.label}
                      </button>
                    ))
                  )}
                  {step.optional && (
                    <button onClick={skipStep} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700">
                      {step.skipLabel ?? 'वगळा (Skip)'}
                    </button>
                  )}
                </>
              ) : flow && step && (step.type === 'number' || step.type === 'text') ? (
                // typed-input step — show a clear hint + Skip chip (if optional)
                <>
                  <span className="w-full text-xs text-gray-400">
                    {step.type === 'number' ? 'क्रमांक टाइप करा' : 'टाइप करा'}{step.optional ? ' किंवा वगळा 👇' : ' 👇'}
                  </span>
                  {step.optional && (
                    <button
                      onClick={skipStep}
                      className="rounded-full border border-primary-300 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-200"
                    >
                      {step.skipLabel ?? 'वगळा (Skip)'}
                    </button>
                  )}
                </>
              ) : !flow ? (
                // main menu (only permitted flows)
                visibleFlows.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => startFlow(f)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    {f.icon} {f.label}
                  </button>
                ))
              ) : null}
            </div>

            <div ref={endRef} />
          </div>

          {/* input */}
          <div className="flex items-center gap-2 border-t border-gray-200 p-2 dark:border-gray-700">
            {/* Enter sends — unless the Marathi suggestion dropdown handled it (preventDefault) */}
            <div className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter' && !e.defaultPrevented) submitText(); }}>
              <MarathiInput
                value={text}
                onChange={(e) => setText(e.target.value)}
                dropUp
                disableTransliteration={step?.type === 'number'}
                placeholder={step && step.type === 'number' ? 'क्रमांक टाइप करा...' : 'इथे टाइप करा... (मराठी)'}
                className="w-full rounded-full border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button onClick={submitText} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700" aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GramSahayak;
