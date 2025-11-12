import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  X,
  Sun,
  Moon,
  Home,
  GitBranch,
  Bell,
  Activity,
  Settings,
  FileText,
  Users,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clientMenuOpen, setClientMenuOpen] = useState(true);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { title: 'Dashboard', path: '/', icon: Home },
    { title: 'Pending Changes', path: '/pending-changes', icon: Activity, badge: true },
    { title: 'Alerts', path: '/alerts', icon: Bell, badge: true },
    { title: 'Audit Trail', path: '/audit-trail', icon: FileText },
    { title: 'Thresholds', path: '/thresholds', icon: Settings },
    { title: 'Git Management', path: '/git-management', icon: GitBranch },
  ];

  const clientConnectionItems = [
    { title: 'Acquiring Clients', path: '/acquiring-clients' },
    { title: 'Issuing Clients', path: '/issuing-clients' },
  ];

  const businessConfigItems = [
    { title: 'All Configurations', path: '/business-configs' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full w-72 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-6">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Toolbox Manager
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    location.pathname === item.path
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              ))}

              {/* Client Connections Submenu */}
              <div className="pt-2">
                <button
                  onClick={() => setClientMenuOpen(!clientMenuOpen)}
                  data-testid="nav-client-connections-toggle"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <span>Client Connections</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      clientMenuOpen && 'rotate-180'
                    )}
                  />
                </button>
                {clientMenuOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {clientConnectionItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                          'flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
                          location.pathname === item.path
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Business Configurations Submenu */}
              <div>
                <button
                  onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
                  data-testid="nav-business-configs-toggle"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5" />
                    <span>Business Configs</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      businessMenuOpen && 'rotate-180'
                    )}
                  />
                </button>
                {businessMenuOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {businessConfigItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                          'flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
                          location.pathname === item.path
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* User Profile */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-72' : 'ml-0'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="sidebar-toggle"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Network Scheme Manager
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="user-menu-trigger">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-medium">{user?.username}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
