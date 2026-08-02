import { useEffect, useState } from 'react';
import { Download, Share, Plus, MoreVertical, CheckCircle2, Smartphone, Receipt, MessageSquareWarning, Droplet, KeyRound } from 'lucide-react';

/** Chrome/Android install prompt event (not in the standard TS lib) */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

declare global {
  interface Window {
    __pwaInstallPrompt: BeforeInstallPromptEvent | null;
  }
}

const isIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

/**
 * Public "Install the App" landing page — this is what a scanned QR poster opens.
 * Mobile-first, Marathi. On Android/Chrome it triggers the one-tap install prompt;
 * on iPhone/other browsers it shows simple manual "Add to Home Screen" steps.
 */
const InstallApp = () => {
  const params = new URLSearchParams(window.location.search);
  const gpName = (params.get('gp') || '').trim();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    typeof window !== 'undefined' ? window.__pwaInstallPrompt : null
  );
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const onInstallable = () => setDeferredPrompt(window.__pwaInstallPrompt);
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
    };
    window.addEventListener('pwa-installable', onInstallable);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('pwa-installable', onInstallable);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt ?? window.__pwaInstallPrompt;
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
      return;
    }
    // iOS / browsers without the native prompt → manual steps
    setShowSteps(true);
  };

  const benefits = [
    { icon: Receipt, text: 'घरबसल्या कर भरा व पावती मिळवा' },
    { icon: Droplet, text: 'पाणी बिल पहा आणि भरा' },
    { icon: MessageSquareWarning, text: 'तक्रार नोंदवा व स्थिती पहा' },
    { icon: Smartphone, text: 'मालमत्ता व सूचना — सर्व एका ठिकाणी' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white px-5 py-8 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        {/* App icon */}
        <img
          src="/pwa-192x192.png"
          alt="App"
          className="h-24 w-24 rounded-3xl shadow-lg ring-1 ring-black/5"
        />
        <h1 className="mt-4 text-center text-xl font-extrabold text-gray-900 dark:text-white">
          ग्रामपंचायत मालमत्ता व कर सेवा
        </h1>
        {gpName ? (
          <p className="mt-1 text-center text-base font-semibold text-primary-700 dark:text-primary-300">
            {gpName}
          </p>
        ) : null}
        <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-300">
          अ‍ॅप इन्स्टॉल करा — मोबाईलवर सर्व सेवा वापरा
        </p>

        {/* Already installed */}
        {installed ? (
          <div className="mt-6 w-full rounded-2xl border border-green-200 bg-green-50 p-5 text-center dark:border-green-800 dark:bg-green-900/30">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <p className="mt-2 font-semibold text-green-800 dark:text-green-200">
              अ‍ॅप आधीच इन्स्टॉल आहे!
            </p>
            <a
              href="/login"
              className="mt-3 inline-block rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              अ‍ॅप उघडा / लॉगिन करा
            </a>
          </div>
        ) : (
          <>
            <button
              onClick={handleInstall}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              अ‍ॅप इन्स्टॉल करा
            </button>

            {/* Manual steps (iOS / no native prompt) */}
            {showSteps && (
              <div className="mt-4 w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
                  अ‍ॅप कसे इन्स्टॉल करावे:
                </p>
                {isIos() ? (
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                    <li className="flex items-center gap-2">
                      <Share className="h-4 w-4 shrink-0 text-primary-600" /> १. खालील शेअर (Share) बटण दाबा
                    </li>
                    <li className="flex items-center gap-2">
                      <Plus className="h-4 w-4 shrink-0 text-primary-600" /> २. &quot;Add to Home Screen&quot; निवडा
                    </li>
                    <li>३. &quot;Add&quot; दाबा — अ‍ॅप होम स्क्रीनवर येईल</li>
                  </ol>
                ) : (
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                    <li className="flex items-center gap-2">
                      <MoreVertical className="h-4 w-4 shrink-0 text-primary-600" /> १. ब्राउझर मेनू (⋮) उघडा
                    </li>
                    <li>२. &quot;Install app&quot; / &quot;Add to Home screen&quot; निवडा</li>
                    <li>३. &quot;Install&quot; दाबा — अ‍ॅप इन्स्टॉल होईल</li>
                  </ol>
                )}
              </div>
            )}

            <a
              href="/login"
              className="mt-3 text-sm font-medium text-primary-700 underline dark:text-primary-300"
            >
              किंवा ब्राउझरमध्ये उघडा
            </a>
          </>
        )}

        {/* First-time login help */}
        <div className="mt-6 w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-900/20">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
            <KeyRound className="h-4 w-4" /> पहिल्यांदा लॉगिन कसे करावे
          </p>
          <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-200">
            <li>• <b>Username:</b> तुमचा मोबाईल नंबर</li>
            <li>• <b>पहिला पासवर्ड:</b> <span className="rounded bg-white px-1.5 py-0.5 font-mono text-primary-700 dark:bg-gray-800 dark:text-primary-300">Pass@123</span></li>
            <li className="font-semibold text-amber-800 dark:text-amber-300">• लॉगिन केल्यावर लगेच पासवर्ड बदला 🔒</li>
          </ul>
        </div>

        {/* Benefits */}
        <div className="mt-8 w-full space-y-3">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <b.icon className="h-5 w-5" />
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-200">{b.text}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by Gram Vikas
        </p>
      </div>
    </div>
  );
};

export default InstallApp;
