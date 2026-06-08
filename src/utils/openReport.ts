/**
 * Open a report in a new tab only if data exists.
 *
 * Opens a blank tab synchronously (preserves the user-gesture so popup blockers
 * don't kick in), then fetches/filters the records. If there is data, it stores
 * the params in sessionStorage and navigates the tab to the report URL; otherwise
 * it closes the tab and calls onEmpty (show a toast).
 */
export async function openReportIfData<T>(opts: {
  fetcher: () => Promise<T[]>;
  url: string;
  sessionKey: string;
  sessionValue: unknown;
  onEmpty: () => void;
  onError?: () => void;
}): Promise<void> {
  // Store params BEFORE opening the tab. A tab opened via window.open inherits a
  // snapshot of the opener's sessionStorage at open-time; values written afterwards
  // are NOT visible to it. Setting first guarantees the report tab can read them.
  sessionStorage.setItem(opts.sessionKey, JSON.stringify(opts.sessionValue));
  const win = window.open('', '_blank');
  try {
    const data = await opts.fetcher();
    if (!data || data.length === 0) {
      win?.close();
      opts.onEmpty();
      return;
    }
    if (win) win.location.href = opts.url;
    else window.open(opts.url, '_blank');
  } catch (e) {
    console.error('openReportIfData failed', e);
    win?.close();
    (opts.onError || opts.onEmpty)();
  }
}
