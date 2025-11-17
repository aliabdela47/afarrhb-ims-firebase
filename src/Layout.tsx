// src/Layout.tsx
import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Tag, Warehouse, ShoppingCart, TrendingUp,
  Users, Building, User, Car, MapPin, CarFront, Wrench, Hammer,
  Map as MapIcon, Radio, Volume2, Fence, FileText,
  Moon, Sun, Languages, LogOut, Menu, X,
  ChevronDown, ChevronRight,
  // Icons for Accordion
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names

// Define types for navigation items if needed later
interface NavItem {
  title: string;
  icon: React.ComponentType<any>; // Lucide icon type
  href: string;
  langKey?: string; // Optional key for multi-language lookup if implemented
}

interface AccordionGroup {
  title: string;
  icon: React.ComponentType<any>;
  items: NavItem[];
  langKey?: string;
}

// Define the main Layout component
const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for sidebar collapsed/expanded
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // State for mobile sidebar open/close
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // State for active accordion groups
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  // Get current path for active link highlighting
  const location = useLocation();
  const navigate = useNavigate(); // For logout or other navigation if needed

  // Toggle sidebar collapse state and save to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // Toggle mobile sidebar
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  // Toggle accordion
  const toggleAccordion = (title: string) => {
    setActiveAccordion(activeAccordion === title ? null : title);
  };

  // Sync accordion state with route changes
  useEffect(() => {
    // Close accordion when navigating to a page inside an accordion group
    // This is a basic heuristic, can be refined
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const currentPathBase = pathSegments[0]; // e.g., 'items', 'requests', 'vehicles'
      const matchingGroup = navigationStructure.find(group => 
        group.items.some(item => item.href.includes(currentPathBase))
      );
      if (matchingGroup) {
        setActiveAccordion(matchingGroup.title);
      }
    }
  }, [location.pathname]);

  // Navigation structure based on spec
  const navigationStructure: AccordionGroup[] = [
    {
      title: "Operations",
      icon: Package,
      items: [
        { title: "Items", icon: Package, href: "/items" },
        { title: "Categories", icon: Tag, href: "/categories" },
        { title: "Warehouses", icon: Warehouse, href: "/warehouses" },
        { title: "Requests", icon: ShoppingCart, href: "/requests" },
        { title: "Issuances", icon: TrendingUp, href: "/issuances" },
      ],
    },
    {
      title: "People & Organizations",
      icon: Users,
      items: [
        { title: "Employees", icon: User, href: "/employees" },
        { title: "Directorates", icon: Building, href: "/directorates" },
        { title: "Customers", icon: User, href: "/customers" }, // Using User icon, might need specific one
      ],
    },
    {
      title: "Fleet Management",
      icon: Car,
      items: [
        { title: "Vehicles", icon: CarFront, href: "/vehicles" },
        { title: "Assignments", icon: MapPin, href: "/vehicle-assignments" }, // Adjust href if different
        { title: "Services", icon: Wrench, href: "/vehicle-services" },
        { title: "Garages", icon: Hammer, href: "/vehicle-garages" },
        { title: "Map", icon: MapIcon, href: "/vehicle-map" },
        { title: "Tracking", icon: Radio, href: "/vehicle-tracking" },
        { title: "Alerts", icon: Volume2, href: "/vehicle-alerts" },
        { title: "Geofences", icon: Fence, href: "/geofences" },
      ],
    },
    {
      title: "System",
      icon: FileText, // Or Settings icon
      items: [
        { title: "Audit Logs", icon: FileText, href: "/audit-logs" },
      ],
    },
  ];

  // Get initials from user name (placeholder)
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Placeholder user data (replace with real auth context later)
  const user = {
    name: "Ali Admin", // Example name
    role: "Admin",
    email: "admin@afarrhb.org", // Example email
    // photo: "", // Optional photo URL
  };

  // Placeholder theme/language state (replace with context later)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'en' | 'am'>('en');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Example: Update document class or context
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'am' : 'en';
    setLanguage(newLang);
    // Example: Update context or localStorage
  };

  // Logout function (placeholder)
  const handleLogout = () => {
    // Implement actual logout logic here (e.g., Firebase Auth signOut)
    console.log("Logout clicked");
    // navigate('/login'); // Redirect after logout
  };

  // --- Render the Layout ---
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-slate-50 dark:from-slate-900 dark:via-violet-900 dark:to-slate-900 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed lg:static z-50 h-full flex flex-col border-r bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 glass-card transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-72" // Use Tailwind classes for width
        )}
        initial={false}
        animate={{ width: isCollapsed ? 80 : 288 }} // Framer Motion animate width
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Sidebar Header */}
        <Card className="border-0 rounded-none glass-card">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      AfarRHB IMS
                    </CardTitle>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-8 w-8"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Single Items */}
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
              location.pathname === "/"
                ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            )}
          >
            <LayoutDashboard className={cn("h-5 w-5", location.pathname === "/" ? "text-violet-600 dark:text-violet-300" : "")} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Dashboard
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Accordion Groups */}
          {navigationStructure.map((group) => (
            <div key={group.title}>
              <button
                onClick={() => toggleAccordion(group.title)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 w-full text-left transition-all",
                  activeAccordion === group.title
                    ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                )}
              >
                <group.icon className={cn("h-5 w-5", activeAccordion === group.title ? "text-violet-600 dark:text-violet-300" : "")} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1"
                    >
                      <span>{group.title}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      animate={{ rotate: activeAccordion === group.title ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeAccordion === group.title ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {activeAccordion === group.title && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-4"
                  >
                    <div className="py-1 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            location.pathname === item.href
                              ? "bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-violet-700 dark:text-violet-200"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4", location.pathname === item.href ? "text-violet-700 dark:text-violet-200" : "")} />
                          <span>{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          {/* User Profile Card */}
          <Card className="border-0 glass-card">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold">
                  {getUserInitials(user.name)}
                </div>
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-green-500 dark:ring-gray-800"></span>
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Settings & Logout */}
          <div className="flex flex-col space-y-1 mt-2 px-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="h-8 w-8 p-0"
              >
                <Languages className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full mt-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={toggleMobile}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gradient-to-br from-slate-50 via-violet-50 to-slate-50 dark:from-slate-900 dark:via-violet-900 dark:to-slate-900">
        {children} {/* This renders the page content (e.g., Dashboard) */}
      </main>

      {/* Mobile Sidebar (Slide-in Drawer) */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg lg:hidden flex flex-col"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            {/* Mobile Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="icon" onClick={toggleMobile}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Nav Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <Link
                to="/"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  location.pathname === "/"
                    ? "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
                onClick={toggleMobile} // Close menu on click
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>

              {navigationStructure.map((group) => (
                <div key={group.title}>
                  <button
                    onClick={() => toggleAccordion(group.title)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 w-full text-left transition-all text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <group.icon className="h-5 w-5" />
                    <span className="flex-1">{group.title}</span>
                    {activeAccordion === group.title ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {activeAccordion === group.title && (
                    <div className="ml-4 py-1 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            location.pathname === item.href
                              ? "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200"
                              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          )}
                          onClick={toggleMobile} // Close menu on click
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 p-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold">
                  {getUserInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-1 mt-2 px-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="h-8 w-8 p-0"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLanguage}
                    className="h-8 w-8 p-0"
                  >
                    <Languages className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full mt-1"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
