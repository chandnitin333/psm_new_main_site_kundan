import { useState } from 'react';
import { DatePicker, TimePicker, Table, Modal, Select2, type Column, type TableAction, type Select2Option } from '../../../components/common';
import type { User } from '../../../interfaces/dashboard/components/Components.types';

const Components = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSmallModalOpen, setIsSmallModalOpen] = useState(false);
  const [isMediumModalOpen, setIsMediumModalOpen] = useState(false);
  const [isLargeModalOpen, setIsLargeModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCities, setSelectedCities] = useState<(string | number)[]>([]);

  // Sample data for Select2
  const countryOptions: Select2Option[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'in', label: 'India' },
    { value: 'jp', label: 'Japan' },
  ];

  const cityOptions: Select2Option[] = [
    { value: 'ny', label: 'New York' },
    { value: 'la', label: 'Los Angeles' },
    { value: 'ch', label: 'Chicago' },
    { value: 'sf', label: 'San Francisco' },
    { value: 'ld', label: 'London' },
    { value: 'pr', label: 'Paris' },
    { value: 'tk', label: 'Tokyo' },
    { value: 'mb', label: 'Mumbai' },
  ];

  // Sample data for table
  const users: User[] = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['Admin', 'User', 'Manager'][i % 3],
    status: ['Active', 'Inactive'][i % 2],
    joinDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  }));

  const columns: Column<User>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.role === 'Admin'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              : user.role === 'Manager'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (user) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.status === 'Active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {user.status}
        </span>
      ),
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      sortable: true,
    },
  ];

  // Define table actions
  const tableActions: TableAction<User>[] = [
    {
      icon: 'view',
      label: 'View',
      onClick: (user) => alert(`Viewing user: ${user.name}`),
    },
    {
      icon: 'edit',
      label: 'Edit',
      onClick: (user) => alert(`Editing user: ${user.name}`),
      show: (user) => user.role === 'Admin' || user.role === 'Manager',
    },
    {
      icon: 'delete',
      label: 'Delete',
      onClick: (user) => {
        if (confirm(`Are you sure you want to delete ${user.name}?`)) {
          alert(`Deleting user: ${user.name}`);
        }
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Custom Components Reference
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          All available custom components with examples and usage demonstrations
        </p>
      </div>

      {/* Modal Component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Modal Component
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Modal dialogs in three sizes: small, medium, and large. Features include backdrop blur, escape key support, click-outside to close, and body scroll lock.
        </p>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Examples:</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setIsSmallModalOpen(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Open Small Modal
            </button>
            <button
              onClick={() => setIsMediumModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Open Medium Modal
            </button>
            <button
              onClick={() => setIsLargeModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Open Large Modal
            </button>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Usage:</h4>
            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
{`<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="medium" // 'small' | 'medium' | 'large'
  footer={<button>Save</button>}
>
  Modal content here
</Modal>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Select2 Component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Select2 Component
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Advanced dropdown with search, single/multiple selection, and clearable options. Features include auto-focus search, click-outside detection, and keyboard navigation.
        </p>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Examples:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select2
              label="Country (Single Select)"
              options={countryOptions}
              value={selectedCountry}
              onChange={(value) => setSelectedCountry(value as string)}
              placeholder="Select a country"
              searchable={true}
              clearable={true}
            />
            <Select2
              label="Cities (Multiple Select)"
              options={cityOptions}
              value={selectedCities}
              onChange={(value) => setSelectedCities(value as (string | number)[])}
              placeholder="Select cities"
              searchable={true}
              clearable={true}
              multiple={true}
            />
          </div>
          {(selectedCountry || selectedCities.length > 0) && (
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Country: {selectedCountry || 'None'} | Cities: {selectedCities.length > 0 ? selectedCities.join(', ') : 'None'}
              </p>
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Usage:</h4>
            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
{`<Select2
  label="Label"
  options={[{value: '1', label: 'Option 1'}]}
  value={value}
  onChange={setValue}
  placeholder="Select..."
  searchable={true}
  clearable={true}
  multiple={false} // set true for multi-select
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Date & Time Pickers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Date & Time Pickers
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Native HTML5 date and time input components with consistent styling and dark mode support.
        </p>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Examples:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Choose a date"
            />
            <TimePicker
              label="Select Time"
              value={selectedTime}
              onChange={setSelectedTime}
              placeholder="Choose a time"
            />
          </div>
          {(selectedDate || selectedTime) && (
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Selected: {selectedDate || 'No date'} {selectedTime || 'No time'}
              </p>
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Usage:</h4>
            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
{`<DatePicker
  label="Date"
  value={date}
  onChange={setDate}
  required={false}
/>

<TimePicker
  label="Time"
  value={time}
  onChange={setTime}
  required={false}
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Table Component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Table Component
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Feature-rich data table with pagination, sorting, optional search, configurable actions, striped rows, and hover effects. Actions can be conditionally shown per row.
        </p>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Example with Search:</h3>
          <Table
            data={users}
            columns={columns}
            actions={tableActions}
            pageSize={10}
            showPagination={true}
            striped={true}
            hoverable={true}
            searchable={true}
            searchPlaceholder="Search users..."
          />

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Usage:</h4>
            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
{`const columns: Column<User>[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <span>{row.status}</span>
  }
];

const actions: TableAction<User>[] = [
  {
    icon: 'view',
    label: 'View',
    onClick: (row) => console.log(row),
  },
  {
    icon: 'edit',
    label: 'Edit',
    onClick: (row) => console.log(row),
    show: (row) => row.role === 'Admin', // conditional
  },
  {
    icon: 'delete',
    label: 'Delete',
    onClick: (row) => console.log(row),
  }
];

<Table
  data={data}
  columns={columns}
  actions={actions}
  pageSize={10}
  showPagination={true}
  searchable={true} // Optional: enable search
  searchPlaceholder="Search..." // Optional
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Modal Instances */}
      <Modal
        isOpen={isSmallModalOpen}
        onClose={() => setIsSmallModalOpen(false)}
        title="Small Modal"
        size="small"
        footer={
          <>
            <button
              onClick={() => setIsSmallModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Save
            </button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          This is a small modal. Perfect for simple confirmations or brief messages.
        </p>
      </Modal>

      <Modal
        isOpen={isMediumModalOpen}
        onClose={() => setIsMediumModalOpen(false)}
        title="Medium Modal"
        size="medium"
        footer={
          <>
            <button
              onClick={() => setIsMediumModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Confirm
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This is a medium modal. It provides more space for forms and detailed content.
          </p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <textarea
              placeholder="Enter description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isLargeModalOpen}
        onClose={() => setIsLargeModalOpen(false)}
        title="Large Modal"
        size="large"
        footer={
          <>
            <button
              onClick={() => setIsLargeModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Submit
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This is a large modal. Ideal for complex forms, data tables, or detailed content.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Column 1</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Large modals can contain complex layouts with multiple columns and sections.
              </p>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Column 2</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Perfect for displaying detailed information or complex forms.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Components;
