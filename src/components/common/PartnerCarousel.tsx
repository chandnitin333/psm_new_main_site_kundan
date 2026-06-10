import { useEffect, useRef } from 'react';

interface Partner {
  id: string;
  name: string;
  logo: string;
}

interface PartnerCarouselProps {
  partners: Partner[];
}

const PartnerCarousel = ({ partners }: PartnerCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollPosition = 0;

    const scroll = () => {
      // pause auto-scroll while hovered
      if (!pausedRef.current) {
        scrollPosition += 1;
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0;
        }
        scrollContainer.scrollLeft = scrollPosition;
      } else {
        // keep position in sync if user is hovering
        scrollPosition = scrollContainer.scrollLeft;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-8 items-center overflow-x-hidden scrollbar-hide"
        style={{ scrollBehavior: 'auto' }}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {[...partners, ...partners, ...partners].map((partner, index) => (
          <div
            key={`${partner.id}-${index}`}
            className="relative flex-shrink-0 bg-white dark:bg-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden w-64 h-44"
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="w-full h-full object-cover"
            />
            {partner.name && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                <span className="block text-white text-sm font-semibold truncate text-center drop-shadow">
                  {partner.name}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerCarousel;
