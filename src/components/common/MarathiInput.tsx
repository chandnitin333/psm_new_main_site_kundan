import { useEffect, useRef, useState, useCallback } from 'react';

/*
  MarathiInput — drop-in replacement for <input>/<textarea> with phonetic
  Marathi (Devanagari) transliteration. User types Roman (e.g. "mumbai") and
  picks the Marathi suggestion (मुंबई) from a dropdown.

  Uses Google Input Tools' free endpoint (no API key / no cost):
    https://inputtools.google.com/request?itc=mr-t-i0-und&...
  Calls are made from the browser, so the device only needs internet access.

  Usage (controlled):
    <MarathiInput value={form.name} onChange={(v) => setForm({ ...form, name: v })}
                  className="..." placeholder="नाव" />
*/

/* onChange receives a (possibly synthetic) change event — same shape as a native
   <input> onChange — so existing `handleInputChange`/`(e) => setX(e.target.value)`
   handlers work as a pure drop-in. e.target.name and e.target.value are always set. */
type ChangeLike = React.ChangeEvent<HTMLInputElement>;

interface MarathiInputProps {
  value: string;
  onChange: (e: ChangeLike) => void;
  /** render a multiline textarea instead of a single-line input */
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  onBlur?: () => void;
  /** disable transliteration (acts like a plain input) */
  disableTransliteration?: boolean;
}

const isLatin = (ch: string) => /[A-Za-z]/.test(ch);

const MarathiInput = ({
  value,
  onChange,
  multiline = false,
  className = '',
  placeholder,
  id,
  name,
  disabled,
  readOnly,
  rows,
  onBlur,
  disableTransliteration = false,
}: MarathiInputProps) => {
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [show, setShow] = useState(false);
  // boundaries of the Roman word currently being transliterated
  const wordRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  const closeSuggestions = useCallback(() => {
    setShow(false);
    setSuggestions([]);
    setActive(0);
  }, []);

  const fetchSuggestions = useCallback((word: string) => {
    const myId = ++reqIdRef.current;
    const url =
      'https://inputtools.google.com/request?itc=mr-t-i0-und&num=6&cp=0&cs=1&ie=utf-8&oe=utf-8&text=' +
      encodeURIComponent(word);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (myId !== reqIdRef.current) return; // a newer request superseded this one
        if (Array.isArray(data) && data[0] === 'SUCCESS' && data[1]?.[0]?.[1]?.length) {
          const list: string[] = data[1][0][1];
          // keep the typed Roman word as the last fallback option
          setSuggestions([...list, word]);
          setActive(0);
          setShow(true);
        } else {
          closeSuggestions();
        }
      })
      .catch(() => closeSuggestions());
  }, [closeSuggestions]);

  // figure out the Roman token around the caret and trigger a (debounced) fetch
  const updateSuggestions = useCallback((text: string, caret: number) => {
    if (disableTransliteration) return;
    let start = caret;
    while (start > 0 && isLatin(text[start - 1])) start--;
    let end = caret;
    while (end < text.length && isLatin(text[end])) end++;
    const word = text.slice(start, end);
    wordRef.current = { start, end };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!word || word.length < 1) {
      closeSuggestions();
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(word), 130);
  }, [disableTransliteration, closeSuggestions, fetchSuggestions]);

  // emit a (possibly synthetic) change event carrying the new full value + field name
  const emit = useCallback((newValue: string) => {
    onChange({ target: { name: name ?? '', value: newValue } } as ChangeLike);
  }, [onChange, name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.target.value;
    emit(text);
    updateSuggestions(text, e.target.selectionStart ?? text.length);
  };

  // replace the active Roman word with the chosen suggestion
  const choose = (suggestion: string) => {
    const { start, end } = wordRef.current;
    const next = value.slice(0, start) + suggestion + value.slice(end);
    emit(next);
    closeSuggestions();
    const caret = start + suggestion.length;
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(caret, caret);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!show || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
      // confirm the highlighted suggestion; space adds a trailing space
      e.preventDefault();
      const chosen = suggestions[active];
      const { start, end } = wordRef.current;
      const suffix = e.key === ' ' ? ' ' : '';
      const next = value.slice(0, start) + chosen + suffix + value.slice(end);
      emit(next);
      closeSuggestions();
      const caret = start + chosen.length + suffix.length;
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) { el.focus(); el.setSelectionRange(caret, caret); }
      });
    } else if (e.key === 'Escape') {
      closeSuggestions();
    } else if (/^[1-9]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < suggestions.length) {
        e.preventDefault();
        choose(suggestions[idx]);
      }
    }
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const commonProps = {
    ref: inputRef,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: () => { onBlur?.(); setTimeout(closeSuggestions, 150); },
    className,
    placeholder,
    id,
    name,
    disabled,
    readOnly,
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea {...commonProps} rows={rows ?? 3} />
      ) : (
        <input type="text" {...commonProps} />
      )}
      {show && suggestions.length > 0 && (
        <ul
          style={{ scrollbarWidth: 'thin' }}
          className="absolute z-50 left-0 top-full mt-1 max-h-56 w-max min-w-[8rem] overflow-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500"
        >
          {suggestions.map((sug, i) => (
            <li
              key={`${sug}-${i}`}
              // onMouseDown (not onClick) so it fires before the input's onBlur
              onMouseDown={(e) => { e.preventDefault(); choose(sug); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${
                i === active
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-xs opacity-60">{i + 1}</span>
              <span>{sug}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MarathiInput;
