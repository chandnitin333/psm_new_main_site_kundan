# Gram Panchayat Portal - React + Vite + TypeScript

A professional, fully responsive website with dark mode support for managing Gram Panchayat operations.

## Features

### Public Pages
- **Home Page**
  - Carousel with text overlay
  - Marquee notice board (right to left animation)
  - Team member cards (5 members: 3 on top, 2 below)
  - About Us section (30% image, 70% text)
  - Events section (70% text, 30% image)
  - Three information boxes (Documents, Special Events, Schemes with links)
  - Partners scroller
  - Gallery with modal image preview (zoom in/out, next/prev functionality)

- **About Us Page**
  - Detailed content (1000+ words)
  - Multiple sections covering vision, mission, history, etc.

- **Contact Us Page**
  - Contact form with validation
  - Company owner details (3 personnel with contact info)
  - Office address and contact information

- **Login Page**
  - Cascading dropdowns (District → Taluka → Gram Panchayat)
  - Username/Email and Password fields
  - OTP verification (6-digit)
  - Wrong OTP handling
  - Link to registration page

- **Register Page**
  - Cascading dropdowns (District → Taluka → Gram Panchayat → Gat Gram Panchayat)
  - Personal information fields
  - Password confirmation
  - Mobile number validation
  - Designation dropdown

### Dashboard (After Login)
- **Layout**
  - Fixed header (similar to Udemy)
  - Right sidebar (hidden by default, toggleable)
  - 6 main pages with dropdown submenus
  - Active menu highlighting (parent and submenu)
  - Auto-close submenus when clicking non-submenu items

- **Dashboard Pages**
  - Page 1 with 3 submenus
  - Page 2 with 2 submenus
  - Page 3 with 3 submenus
  - Page 4 with 2 submenus
  - Page 5 with 3 submenus
  - Page 6 with 2 submenus

### Custom Components
- **Toast Notifications**
  - Success, Error, Info, Warning types
  - Auto-dismiss with configurable duration
  - Close button

- **Image Preview**
  - Full-screen modal
  - Zoom in/out functionality
  - Image rotation
  - Next/Previous navigation
  - Thumbnail strip
  - Keyboard navigation (Arrow keys, Escape)

- **Modal**
  - Customizable sizes (sm, md, lg, xl)
  - Backdrop click to close
  - Header with title

- **Dialog**
  - Info, Warning, Success, Error types
  - Confirm/Cancel actions
  - Customizable buttons

- **Confirmation Box**
  - Built on Dialog component
  - Yes/No confirmation prompts

### Features
- **Dark/Light Mode**
  - Toggle button in header
  - Persistent theme (localStorage)
  - Smooth transitions

- **Responsive Design**
  - Mobile-first approach
  - Breakpoints: sm, md, lg, xl
  - Hamburger menu for mobile

- **Authentication**
  - Protected routes
  - Login with OTP verification
  - Session management
  - Logout functionality

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **State Management**: React Hooks

## Project Structure

```
src/
├── assets/
│   └── data/           # Mock data for locations
├── components/
│   ├── common/         # Reusable components (Carousel, Marquee, etc.)
│   ├── custom/         # Custom components (Toast, Modal, Dialog, etc.)
│   └── layout/         # Layout components (Header, Footer, Sidebar)
├── constants/          # Constants and static data
├── hooks/              # Custom React hooks
├── interfaces/         # TypeScript interfaces
├── pages/
│   ├── public/         # Public pages (Home, About, Contact, Login, Register)
│   └── dashboard/      # Dashboard pages
├── routes/             # Route configuration
├── services/           # API services
└── utils/              # Utility functions
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Demo Credentials

### Login
- **District**: Select any district
- **Taluka**: Select any taluka
- **Gram Panchayat**: Select any gram panchayat
- **Username**: Any text
- **Password**: Any text
- **OTP**: 123456

## Features Checklist

✅ Responsive design (mobile, tablet, desktop)
✅ Dark/Light mode toggle
✅ Fixed header
✅ Carousel with auto-play
✅ Marquee animation
✅ Team member cards
✅ Image gallery with preview
✅ Custom toast notifications
✅ Custom modal/dialog components
✅ Cascading dropdowns
✅ OTP verification
✅ Protected routes
✅ Sidebar with active menu highlighting
✅ Dropdown menus in header and sidebar
✅ Form validation
✅ Mock data and services

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is for demonstration purposes.
