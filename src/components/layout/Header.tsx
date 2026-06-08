import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, ChevronDown, User, LogOut, HelpCircle, Lock, Settings, Home, UserCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useDropdownDelay } from '../../utils/dropdown';
import type { MenuItem } from '../../interfaces';

interface UserData {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  user_type?: string;
}

interface HeaderProps {
  isAuthenticated: boolean;
  menuItems: MenuItem[];
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

const Header = ({ isAuthenticated, menuItems, onLogout, onToggleSidebar }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  // Use dropdown delay hook for user menu
  const userMenuDelay = useDropdownDelay(setIsUserMenuOpen);

  // Get user data from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserData(user);
      } catch {
        setUserData(null);
      }
    }
  }, [isAuthenticated]);

  // Get display name and email
  const displayName = userData?.first_name || userData?.username || 'User';
  const fullName = userData?.first_name && userData?.last_name
    ? `${userData.first_name} ${userData.last_name}`
    : userData?.username || 'User';
  const userEmail = userData?.email || '';

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const isActive = (path: string) => location.pathname === path;

  const handleMouseEnter = (menuId: string) => {
    if (window.innerWidth >= 1280) {
      // Clear any pending close timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setActiveDropdown(menuId);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1280) {
      // Add a delay before closing the dropdown (300ms delay)
      closeTimeoutRef.current = window.setTimeout(() => {
        setActiveDropdown(null);
      }, 300);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      userMenuDelay.cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDropdown = (menuId: string) => {
    setActiveDropdown(activeDropdown === menuId ? null : menuId);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <img
              src="/psm_logo1.png"
              alt="Gram Panchayat Logo"
              className="w-10 h-10"
            />
            <span className="flex flex-col leading-tight relative">
              <span className="text-[19px] font-black italic tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
                G<span className="text-primary-600 dark:text-primary-400">ram</span> V<span className="text-primary-600 dark:text-primary-400">ikas</span>
              </span>
              <span className="h-[2px] w-full bg-gradient-to-r from-primary-600 via-amber-500 to-primary-600 rounded-full"></span>
              <span className="text-[10px] font-bold tracking-[0.15em] text-gray-600 dark:text-gray-300 text-center mt-[2px]">
                ग्राम पंचायत सेवा
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                {item.subMenus && item.subMenus.length > 0 ? (
                  <>
                    <button
                      className={`px-4 py-2 rounded-lg flex items-center gap-1 transition-colors border-b-2 ${
                        isActive(item.path) || item.subMenus.some(sub => isActive(sub.path))
                          ? 'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400 font-semibold'
                          : 'text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeDropdown === item.id && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700">
                        {item.subMenus.map((subItem) => (
                          <Link
                            key={subItem.id}
                            to={subItem.path}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              isActive(subItem.path)
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`px-4 py-2 rounded-lg transition-colors border-b-2 ${
                      isActive(item.path)
                        ? 'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400 font-semibold'
                        : 'text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* User Menu (Dashboard only) */}
            {isAuthenticated && (
              <div
                className="relative hidden xl:block"
                ref={userMenuRef}
                onMouseEnter={userMenuDelay.handleMouseEnter}
                onMouseLeave={userMenuDelay.handleMouseLeave}
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{displayName}</span>
                </div>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Home className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserCircle className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to="/dashboard/help"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help
                    </Link>
                    <Link
                      to="/change-password"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Lock className="w-4 h-4" />
                      Change Password
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sidebar Toggle (Dashboard only - Desktop only) - After username */}
            {isAuthenticated && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden xl:block p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-gray-200 dark:border-gray-700 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {menuItems.map((item) => (
              <div key={item.id}>
                {item.subMenus && item.subMenus.length > 0 ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg flex items-center justify-between transition-colors border-l-4 ${
                        isActive(item.path) || item.subMenus.some(sub => isActive(sub.path))
                          ? 'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-gray-800 font-semibold'
                          : 'text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          activeDropdown === item.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {activeDropdown === item.id && (
                      <div className="ml-4 mt-1">
                        {item.subMenus.map((subItem) => (
                          <Link
                            key={subItem.id}
                            to={subItem.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block px-4 py-2 rounded-lg text-sm transition-colors border-l-4 ${
                              isActive(subItem.path)
                                ? 'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-gray-800 font-semibold'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg transition-colors border-l-4 ${
                      isActive(item.path)
                        ? 'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-gray-800 font-semibold'
                        : 'text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            {isAuthenticated && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    to="/dashboard/help"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help
                  </Link>
                  <Link
                    to="/change-password"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
