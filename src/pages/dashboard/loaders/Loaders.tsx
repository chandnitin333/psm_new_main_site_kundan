import Loader from '../../../components/common/Loader';

const Loaders = () => {
  const loaderTypes = [
    { type: 'spinner' as const, text: 'Saving record' },
    { type: 'dots' as const, text: 'Fetching records' },
    { type: 'pulse' as const, text: 'Processing data' },
    { type: 'bars' as const, text: 'Loading content' },
    { type: 'circle' as const, text: 'Updating information' },
    { type: 'squares' as const, text: 'Syncing data' },
    { type: 'wave' as const, text: 'Uploading files' },
    { type: 'bounce' as const, text: 'Validating form' },
    { type: 'ring' as const, text: 'Connecting to server' },
    { type: 'dual-ring' as const, text: 'Generating report' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Loaders / लोडर
          </h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            Different types of loading indicators with dynamic text. Each loader supports customization of size, color, and text.
          </p>
        </div>

        {/* Grid of all loader types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loaderTypes.map((loader, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize text-center">
                  {loader.type.replace('-', ' ')}
                </h3>
              </div>
              <Loader type={loader.type} text={loader.text} size="medium" color="primary-600" />
            </div>
          ))}
        </div>

        {/* Size Variants Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Size Variants / आकार प्रकार
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Small</h3>
              <Loader type="spinner" text="Small loader" size="small" color="blue-600" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Medium</h3>
              <Loader type="spinner" text="Medium loader" size="medium" color="green-600" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Large</h3>
              <Loader type="spinner" text="Large loader" size="large" color="red-600" />
            </div>
          </div>
        </div>

        {/* Color Variants Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Color Variants / रंग प्रकार
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primary</h3>
              <Loader type="dots" text="Primary color" size="medium" color="primary-600" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Blue</h3>
              <Loader type="dots" text="Blue color" size="medium" color="blue-600" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Green</h3>
              <Loader type="dots" text="Green color" size="medium" color="green-600" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Red</h3>
              <Loader type="dots" text="Red color" size="medium" color="red-600" />
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Usage Example / वापर उदाहरण
          </h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import Loader from '../components/common/Loader';

// Basic usage
<Loader text="Loading..." />

// With custom type
<Loader type="dots" text="Fetching records" />

// With size and color
<Loader
  type="spinner"
  text="Saving record"
  size="large"
  color="green-600"
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Loaders;
