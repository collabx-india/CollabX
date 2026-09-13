import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { 
  Home, 
  PlusCircle, 
  FileText
} from 'lucide-react';

interface CitizenSidebarProps {
  id?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const CitizenSidebar: React.FC<CitizenSidebarProps> = ({
  id,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useAccessibility();
  const { currentUser } = useAuth();

  // Get dynamic counts for My Reports and Notifications
  const problems = storageService.getProblems();
  const myReports = problems.filter(p => 
    p.citizenName?.toLowerCase().includes((currentUser?.name || '').toLowerCase()) || 
    p.citizenPhone === (currentUser as any)?.phone
  );
  const displayReports = myReports.length > 0 ? myReports : problems;

  // Determine active item based on location.pathname
  const getActiveId = () => {
    const p = location.pathname;
    if (p.endsWith('/report')) return 'report';
    if (p.includes('/reports') || p.endsWith('/track') || p.endsWith('/nearby')) return 'my_reports';
    return 'home';
  };

  const activeId = getActiveId();

  const handleNavClick = (path: string) => {
    if (onCloseMobile) onCloseMobile();
    navigate(path);
  };

  const navItems = [
    { id: 'home', label: t('Dashboard', 'डैशबोर्ड'), path: '/citizen', icon: Home },
    { id: 'report', label: t('Report Problem', 'समस्या दर्ज करें'), path: '/citizen/report', icon: PlusCircle },
    { id: 'my_reports', label: t('My Problems', 'मेरी समस्याएं'), path: '/citizen/reports', icon: FileText, count: displayReports.length },
  ];

  return (
    <aside
      id={id}
      className={`w-full min-w-0 bg-white border border-slate-200 rounded-md p-4 space-y-2 flex-shrink-0 shadow-sm ${
        isMobileOpen ? 'block' : 'hidden'
      }`}
      aria-label="Citizen Portal Navigation"
    >
      <div className="px-3.5 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 mb-2">
        Navigation Menu
      </div>

      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={`w-full py-3 px-4 rounded-md gov-button flex items-center justify-between transition ${
              isActive
                ? 'bg-gov-navy text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100 hover:text-gov-navy'
            }`}
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.count !== undefined && item.count > 0 && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-bold flex-shrink-0 ml-2 ${
                isActive ? 'bg-white text-gov-navy' : 'bg-slate-200 text-slate-700'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
};
