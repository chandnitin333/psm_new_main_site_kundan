import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, RemoveFormatting } from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Lightweight rich-text editor (contentEditable). Supports basic formatting only —
// NO image upload by design (users can format text but not embed media).
const RichTextEditor = ({ value, onChange, placeholder = 'Type your message here...' }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  // keep DOM in sync when value is changed from outside (e.g. form reset),
  // without disturbing the caret while the user is typing.
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML || '');

  const exec = (command: string) => {
    document.execCommand(command, false);
    ref.current?.focus();
    emit();
  };

  const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

  const Btn = ({ cmd, title, children }: { cmd: string; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
      className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 dark:bg-gray-700">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-2 py-1.5">
        <Btn cmd="bold" title="Bold"><Bold className="w-4 h-4" /></Btn>
        <Btn cmd="italic" title="Italic"><Italic className="w-4 h-4" /></Btn>
        <Btn cmd="underline" title="Underline"><Underline className="w-4 h-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />
        <Btn cmd="insertUnorderedList" title="Bullet list"><List className="w-4 h-4" /></Btn>
        <Btn cmd="insertOrderedList" title="Numbered list"><ListOrdered className="w-4 h-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />
        <Btn cmd="removeFormat" title="Clear formatting"><RemoveFormatting className="w-4 h-4" /></Btn>
      </div>

      {/* Editable area */}
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-4 top-3 text-gray-400 text-sm">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          onInput={emit}
          className="rte-content min-h-[140px] w-full px-4 py-3 text-gray-900 dark:text-white outline-none text-sm leading-relaxed"
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
