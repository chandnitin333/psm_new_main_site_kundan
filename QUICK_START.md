# Quick Start Guide

## Prerequisites
- Node.js v18 or higher installed

## Installation & Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

The application will start at `http://localhost:5173` (or another port if 5173 is busy).

3. **Build for production:**
```bash
npm run build
```

4. **Preview production build:**
```bash
npm run preview
```

## Demo Login Instructions

1. Navigate to the Login page
2. Select any **District**, **Taluka**, and **Gram Panchayat** from the dropdowns
3. Enter any text as **Username** and **Password**
4. Click **Sign In**
5. When prompted for OTP, enter: **123456**
6. You will be redirected to the Dashboard

## Features to Test

### Public Pages
- **Home** - View carousel, marquee, team cards, gallery (click images for zoom functionality)
- **About** - Detailed information page
- **Contact** - Fill and submit contact form
- **Login** - Test OTP verification flow
- **Register** - Test cascading dropdown functionality

### Dashboard (After Login)
- Toggle **sidebar** using the menu button (top-right)
- Navigate through **6 pages** with their **submenus**
- Test **active menu highlighting** (parent and submenu)
- Try **dark/light mode toggle** (moon/sun icon in header)
- Click **Logout** to return to home page

## Key Features

✅ Fully responsive (mobile, tablet, desktop)
✅ Dark/Light mode toggle with persistence
✅ Fixed header that stays on top while scrolling
✅ Carousel with auto-play
✅ Animated marquee notice board
✅ Image gallery with zoom, rotate, next/prev controls
✅ Custom toast notifications
✅ Cascading dropdowns (District → Taluka → Gram Panchayat → Gat Gram Panchayat)
✅ OTP verification with error handling
✅ Protected routes (dashboard requires login)
✅ Right sidebar with active menu tracking
✅ Dropdown menus in header and sidebar

## Project Structure

```
src/
├── components/
│   ├── common/         # Carousel, Marquee, TeamCard
│   ├── custom/         # Toast, Modal, Dialog, ImagePreview
│   └── layout/         # Header, Footer, Sidebar, PublicLayout
├── pages/
│   ├── public/         # Home, About, Contact, Login, Register
│   └── dashboard/      # Dashboard main + Page1-6 with submenus
├── hooks/              # useTheme, useToast
├── routes/             # React Router configuration
├── services/           # authService, contactService (mock APIs)
├── utils/              # Helper functions
├── constants/          # Static data, menu items
├── interfaces/         # TypeScript types
└── assets/data/        # Mock location data
```

## Customization Tips

### Change Theme Colors
Edit `tailwind.config.js` to customize the primary color palette.

### Modify Mock Data
- **Locations**: `src/assets/data/locations.ts`
- **Constants**: `src/constants/index.ts`
- **Menu Items**: `src/constants/menuItems.ts`

### Update OTP Validation
Edit `src/pages/public/Login.tsx` line 64 to change the accepted OTP from '123456' to your preferred value.

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Need Help?

Check out the main `README.md` for detailed feature documentation.

Happy coding! 🚀
