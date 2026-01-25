interface TeamCardProps {
  name: string;
  profession: string;
  image: string;
}

const TeamCard = ({ name, profession, image }: TeamCardProps) => {
  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-primary-500">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
        {name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
        {profession}
      </p>
    </div>
  );
};

export default TeamCard;
