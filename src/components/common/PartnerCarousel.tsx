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

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 1;
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
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
      >
        {[...partners, ...partners, ...partners].map((partner, index) => (
          <div
            key={`${partner.id}-${index}`}
            className="flex-shrink-0 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center w-48 h-24"
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerCarousel;
