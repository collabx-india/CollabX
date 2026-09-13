import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { NotificationDropdown } from './NotificationDropdown';
import { AccessibilityMenu } from './AccessibilityMenu';
import { storageService } from '../../services/storageService';
import { 
  Bell, 
  Search, 
  UserCheck, 
  LogOut, 
  ChevronDown, 
  Globe, 
  Shield, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2,
  Menu,
  X,
  LogIn
} from 'lucide-react';

interface GovHeaderProps {
  onSearch?: (term: string) => void;
}

export const GovHeader: React.FC<GovHeaderProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const {
    language,
    toggleLanguage,
    t
  } = useAccessibility();

  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState(() => storageService.getNotifications());
  const [searchTerm, setSearchTerm] = useState('');

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const isPublicAuthRoute = 
    location.pathname === '/' || 
    location.pathname.startsWith('/login') ||
    location.pathname === '/services' ||
    location.pathname === '/report' ||
    location.pathname === '/track' ||
    location.pathname.startsWith('/challenges') ||
    location.pathname === '/about' ||
    location.pathname === '/help';

  const publicNavLinks = [
    { label: t('Home', 'मुख्य पृष्ठ'), path: '/' },
    { label: t('Services', 'सेवाएँ'), path: '/services' },
    { label: t('Report a Problem', 'समस्या रिपोर्ट करें'), path: '/report' },
    { label: t('Track Report', 'रिपोर्ट देखें'), path: '/track' },
    { label: t('Challenges', 'चुनौतियाँ'), path: '/challenges' },
    { label: t('About', 'परिचय'), path: '/about' },
    { label: t('Help', 'सहायता'), path: '/help' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const refreshNotifications = () => {
    setNotifications(storageService.getNotifications());
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'government':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'expert':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'student':
      case 'professor':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'industry':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'citizen':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'government':
        return <Building2 className="w-3.5 h-3.5 text-amber-700" />;
      case 'expert':
        return <Shield className="w-3.5 h-3.5 text-purple-700" />;
      case 'student':
      case 'professor':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-700" />;
      case 'industry':
        return <Briefcase className="w-3.5 h-3.5 text-emerald-700" />;
      case 'citizen':
      default:
        return <UserCheck className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gov-border shadow-gov">
      {/* Tricolor Accent Ribbon */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      {/* Main Gov Header */}
      <div className="px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo & Identity */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')} title="COLLABX Home">
          <div className="w-10 h-10 rounded-full bg-gov-navy flex items-center justify-center text-white border-2 border-gov-saffron shadow-xs flex-shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#FF9933" strokeWidth="4" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3,3" />
              <circle cx="50" cy="50" r="8" fill="#138808" />
              <path d="M50 15 L50 85 M15 50 L85 50 M25 25 L75 75 M25 75 L75 25" stroke="#FFFFFF" strokeWidth="2.5" />
            </svg>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-600 tracking-wide uppercase">
                {t('Government of Jharkhand', 'झारखंड सरकार')}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight text-gov-navy font-sans leading-none">
              COLLAB<span className="text-gov-saffron">X</span>
            </div>
          </div>
        </div>

        {/* Center: Global Search (AUTHENTICATED ONLY) */}
        {!isPublicAuthRoute && (
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={t('Search civic problems, challenges, proposals...', 'समस्याएं, चुनौतियां और प्रस्ताव खोजें...')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 text-[0.9375rem] text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-gov-blue focus:ring-1 focus:ring-gov-blue transition placeholder:text-slate-500"
              />
            </div>
          </div>
        )}

        {/* Right Header Actions */}
        <div className="flex items-center space-x-3 text-sm">
          {/* Skip link for Accessibility */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:bg-gov-navy focus:text-white px-3 py-1.5 rounded text-sm font-semibold">
            {t('Skip to Content', 'सामग्री पर जाएं')}
          </a>

          {/* Accessibility Control (PROMINENT ON ALL PAGES) */}
          <button
            onClick={() => setIsAccessModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-gov-navy font-bold text-sm transition shadow-2xs focus:ring-2 focus:ring-gov-blue"
            title={t('Accessibility Controls', 'अभिगम्यता नियंत्रण')}
            aria-label="Accessibility Settings"
          >
            <span className="text-base" role="img" aria-label="Accessibility">♿</span>
            <span className="hidden sm:inline">{t('Accessibility', 'अभिगम्यता')}</span>
          </button>

          {/* Language Switcher (SEPARATE & PROMINENT ON ALL PAGES) */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition shadow-2xs focus:ring-2 focus:ring-gov-blue"
            title="Switch Language / भाषा बदलें"
            aria-label="Language Switcher"
          >
            <Globe className="w-4 h-4 text-gov-blue" />
            <span>{language === 'en' ? '🌐 हिंदी' : '🌐 English'}</span>
          </button>

          {/* Public Mobile Menu Toggle Button */}
          {isPublicAuthRoute && (
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-md transition focus:ring-2 focus:ring-gov-blue"
              aria-label="Toggle Mobile Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Authenticated Only Tools: Notifications & Profile Switcher */}
          {!isPublicAuthRoute && (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(prev => !prev)}
                  className="p-2 text-slate-600 hover:text-gov-navy hover:bg-slate-100 rounded-full relative transition focus:ring-2 focus:ring-gov-blue"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-gov-saffron text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  notifications={notifications}
                  isOpen={isNotifOpen}
                  onClose={() => setIsNotifOpen(false)}
                  onUpdate={refreshNotifications}
                />
              </div>

              {/* Persona Profile Switcher & Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(prev => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  aria-label="User Account Menu"
                  className="flex items-center space-x-2 p-1.5 border border-gov-border rounded-lg hover:bg-slate-50 transition text-left focus:outline-none focus:ring-2 focus:ring-gov-blue cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gov-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-bold text-gov-navy flex items-center space-x-1">
                      <span>{currentUser.name}</span>
                      {currentUser.verified && (
                        <span title="Verified Profile">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gov-green" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium flex items-center space-x-1 ${getRoleBadgeColor(currentUser.role)}`}>
                        {getRoleIcon(currentUser.role)}
                        <span>{currentUser.subRole || currentUser.role}</span>
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 hidden sm:block transition-transform duration-150 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-4 space-y-3"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {/* User Details Header */}
                    <div className="border-b border-slate-100 pb-3 space-y-1.5 text-left">
                      <div className="text-xs font-bold text-gov-navy uppercase tracking-wider">
                        {currentUser.role === 'citizen' ? 'Citizen Account' : `${currentUser.subRole || currentUser.role} Account`}
                      </div>
                      {currentUser.name && (
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {currentUser.name}
                        </div>
                      )}
                      <div className="text-xs text-slate-600 font-mono truncate">
                        <span className="font-semibold text-slate-500">Identifier: </span>
                        {(currentUser as any).phone || currentUser.email || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-500">Account Type: </span>
                        <span className="font-bold text-gov-navy capitalize">{currentUser.subRole || currentUser.role}</span>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="space-y-1 font-medium text-sm">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileOpen(false);
                          const profilePath = currentUser.role === 'citizen' ? '/citizen' :
                                              currentUser.role === 'student' || currentUser.role === 'professor' ? '/university' :
                                              currentUser.role === 'industry' ? '/industry' :
                                              currentUser.role === 'government' ? '/government' :
                                              currentUser.role === 'expert' ? '/expert' : '/citizen';
                          navigate(profilePath);
                        }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 text-slate-700 hover:text-gov-navy flex items-center space-x-2 transition cursor-pointer font-bold"
                      >
                        <UserCheck className="w-4 h-4 text-gov-blue" />
                        <span>Profile</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center space-x-2 transition cursor-pointer font-bold"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>{t('Sign out', 'लॉग आउट')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Public Navigation Bar */}
      {isPublicAuthRoute && (
        <div className="bg-slate-100 border-t border-gov-border px-4 sm:px-8 py-2">
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center justify-between text-sm font-semibold">
            <nav className="flex items-center space-x-1" aria-label="Public Main Navigation">
              {publicNavLinks.map(link => {
                 const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`px-3.5 py-1.5 rounded transition ${
                      isActive
                        ? 'bg-gov-navy text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-200 hover:text-gov-navy'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white rounded text-sm font-bold flex items-center space-x-2 shadow-xs transition focus:ring-2 focus:ring-gov-blue"
            >
              <LogIn className="w-4 h-4 text-gov-saffron-amber" />
              <span>{t('Login', 'लॉगिन')}</span>
            </button>
          </div>

          {/* Mobile Collapsible Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-3 space-y-2 border-t border-slate-200">
              <nav className="flex flex-col space-y-1 text-sm font-semibold" aria-label="Mobile Navigation">
                {publicNavLinks.map(link => {
                  const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                  return (
                    <button
                      key={link.path}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate(link.path);
                      }}
                      className={`text-left px-3.5 py-2.5 rounded transition ${
                        isActive
                          ? 'bg-gov-navy text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </nav>
              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full text-center px-4 py-2.5 bg-gov-navy text-white text-sm font-bold rounded flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4 text-gov-saffron-amber" />
                  <span>{t('Login to Portal', 'पोर्टल पर लॉगिन करें')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary Portal Navigation Bar (AUTHENTICATED ONLY) */}
      {!isPublicAuthRoute && (
        <div className="bg-slate-100 border-t border-gov-border px-4 sm:px-8 py-2 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Active Portal:</span>
            <div className="px-3 py-1 bg-gov-navy text-white rounded font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-xs">
              <span>
                {location.pathname.startsWith('/citizen') ? 'Citizen Portal' :
                 location.pathname.startsWith('/university') ? 'University Portal' :
                 location.pathname.startsWith('/industry') ? 'Industry Portal' :
                 location.pathname.startsWith('/government') ? 'Government Portal' :
                 location.pathname.startsWith('/expert') ? 'Domain Expert Portal' : 'CollabX Main'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Modal Drawer */}
      <AccessibilityMenu isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} />
    </header>
  );
};

