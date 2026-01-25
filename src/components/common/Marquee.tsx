interface MarqueeProps {
  items: string[];
}

const Marquee = ({ items }: MarqueeProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 py-3 overflow-hidden">
      <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
        {[...items, ...items, ...items].map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 rounded-full" />
            <span className="text-sm md:text-base font-medium text-red-600 dark:text-red-500">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
