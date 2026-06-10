// Lightweight shimmer skeleton blocks (Tailwind animate-pulse).
// Use while CMS-driven content is loading to avoid the static→dynamic "blink".

interface SkProps { className?: string }

export const Sk = ({ className = '' }: SkProps) => (
  <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
);

// a few text lines (last one shorter)
export const SkLines = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Sk key={i} className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

export default Sk;
