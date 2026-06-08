import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X, RefreshCw, Share, Plus, MoreVertical } from 'lucide-react';

/** Chrome/Android install prompt event (not in standard TS lib) */
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
  // iOS Safari
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

// Reports/print pages open in a NEW tab via window.open() — those have window.opener set.
// We never want the install UI on those popup/report tabs.
const isReportPopup = () => {
  try {
    return typeof window !== 'undefined' && !!window.opener;
  } catch {
    return false;
  }
};

const InstallPWA = () => {
  // initialise from the prompt captured early in index.html (may already be set)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    typeof window !== 'undefined' ? window.__pwaInstallPrompt : null
  );
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [showHelp, setShowHelp] = useState(false);

  // Service worker update handling
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    // the early index.html listener fires this once a prompt is available
    const onInstallable = () => setDeferredPrompt(window.__pwaInstallPrompt);
    // also handle the case where the event fires after mount
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
      setShowHelp(false);
    };
    const mql = window.matchMedia('(display-mode: standalone)');
    const onDisplayChange = () => setInstalled(isStandalone());

    window.addEventListener('pwa-installable', onInstallable);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    mql.addEventListener?.('change', onDisplayChange);

    return () => {
      window.removeEventListener('pwa-installable', onInstallable);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      mql.removeEventListener?.('change', onDisplayChange);
    };
  }, []);

  const handleClick = async () => {
    const prompt = deferredPrompt ?? window.__pwaInstallPrompt;
    // Native install available (Android / desktop Chromium) → install directly
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
      return;
    }
    // Fallback (iOS / browsers without the prompt) → manual instructions
    setShowHelp((v) => !v);
  };

  // Never show install / update UI on report or print popup tabs
  if (isReportPopup()) return null;

  return (
    <>
      {/* Update-available toast */}
      {needRefresh && (
        <div className="fixed inset-x-0 top-3 z-[1000] mx-auto flex w-[92%] max-w-md items-center gap-3 rounded-xl border border-primary-200 bg-white px-4 py-3 shadow-lg dark:border-primary-800 dark:bg-gray-800">
          <RefreshCw className="h-5 w-5 shrink-0 text-primary-600" />
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">
            नवीन आवृत्ती उपलब्ध आहे / New version available
          </span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            अपडेट करा
          </button>
          <button onClick={() => setNeedRefresh(false)} aria-label="बंद करा" className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Floating "Download the App" button — only when NOT installed */}
      {!installed && (
        <div className="fixed bottom-5 right-5 z-[999] flex flex-col items-end gap-2">
          {/* Help popover (iOS / no native prompt) */}
          {showHelp && (
            <div className="w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900 dark:text-white">अ‍ॅप कसे इन्स्टॉल करावे</p>
                <button onClick={() => setShowHelp(false)} aria-label="बंद करा" className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {isIos() ? (
                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <p className="flex items-center gap-1.5">
                    1. खालील <Share className="inline h-4 w-4 text-primary-600" /> (Share) बटण दाबा
                  </p>
                  <p className="flex items-center gap-1.5">
                    2. <Plus className="inline h-4 w-4 text-primary-600" /> &quot;Add to Home Screen&quot; निवडा
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <p className="flex items-center gap-1.5">
                    1. ब्राउझर मेनू <MoreVertical className="inline h-4 w-4 text-primary-600" /> उघडा
                  </p>
                  <p>2. &quot;Install app&quot; / &quot;Add to Home screen&quot; निवडा</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleClick}
            className="group flex items-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-700 hover:shadow-xl"
            title="Download the App / अ‍ॅप डाउनलोड करा"
          >
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">Download App</span>
          </button>
        </div>
      )}
    </>
  );
};

export default InstallPWA;
