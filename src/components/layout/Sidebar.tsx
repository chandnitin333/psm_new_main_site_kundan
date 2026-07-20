import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, X, FileText, Building2, RefreshCw, DollarSign, FileCheck, BarChart3, Home, Boxes, Loader2, Award, LifeBuoy, Megaphone } from 'lucide-react';
import type { MenuItem } from '../../interfaces';

// Icon mapping
const iconMap: { [key: string]: any } = {
  Home,
  Boxes,
  FileText,
  Building2,
  RefreshCw,
  DollarSign,
  FileCheck,
  BarChart3,
  Loader2,
  Award,
  LifeBuoy,
  Megaphone,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

const Sidebar = ({ isOpen, onClose, menuItems }: SidebarProps) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Auto-expand parent menu if child is active
  useEffect(() => {
    const activeParents: string[] = [];

    menuItems.forEach((item) => {
      if (item.subMenus && item.subMenus.length > 0) {
        const hasActiveChild = item.subMenus.some(sub => isActive(sub.path));
        if (hasActiveChild) {
          activeParents.push(item.id);
        }
      }
    });

    if (activeParents.length > 0) {
      setExpandedMenus(activeParents);
    }
  }, [location.pathname, menuItems]);

  // Close sidebar when clicking outside on desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth >= 1024 // Only on desktop (lg breakpoint)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const isParentActive = (item: MenuItem) => {
    if (isActive(item.path)) return true;
    if (item.subMenus) {
      return item.subMenus.some(sub => isActive(sub.path));
    }
    return false;
  };

  const toggleMenu = (menuId: string, hasSubMenus: boolean) => {
    if (hasSubMenus) {
      setExpandedMenus(prev =>
        prev.includes(menuId)
          ? prev.filter(id => id !== menuId)
          : [...prev, menuId]
      );
    } else {
      // Close all submenus when a non-submenu item is clicked
      setExpandedMenus([]);
    }
  };

  const handleSubMenuClick = (parentId: string) => {
    // Keep the parent menu expanded when submenu is clicked
    if (!expandedMenus.includes(parentId)) {
      setExpandedMenus(prev => [...prev, parentId]);
    }
  };

  return (
    <>
      {/* Backdrop for desktop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 hidden lg:block print:!hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Only visible on desktop */}
      <aside
        ref={sidebarRef}
        className={`hidden lg:block fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg transform transition-transform duration-300 ease-in-out z-40 print:!hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto scrollbar-hide p-4">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const hasSubMenus = item.subMenus && item.subMenus.length > 0;
              const isExpanded = expandedMenus.includes(item.id);
              const isItemActive = isParentActive(item);
              const Icon = item.icon ? iconMap[item.icon] : null;

              return (
                <div key={item.id}>
                  {hasSubMenus ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.id, hasSubMenus)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-4 ${
                          isItemActive
                            ? 'text-primary-600 dark:text-primary-500 border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-gray-800 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4" />}
                          {item.label}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      {/* Submenu */}
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subMenus!.map((subItem) => (
                            <Link
                              key={subItem.id}
                              to={subItem.path}
                              onClick={() => handleSubMenuClick(item.id)}
                              className={`block px-4 py-2 rounded-lg text-sm transition-colors border-l-4 ${
                                isActive(subItem.path)
                                  ? 'text-primary-600 dark:text-primary-500 border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-gray-800 font-semibold'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
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
                      onClick={() => toggleMenu(item.id, false)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-4 ${
                        isItemActive
                          ? 'text-primary-600 dark:text-primary-500 border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-gray-800 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
