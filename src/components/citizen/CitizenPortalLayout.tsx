import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { CitizenSidebar } from './CitizenSidebar';
import { Menu, X } from 'lucide-react';

interface CitizenPortalLayoutProps {
  children?: React.ReactNode;
}

const NAV_MENU_ID = 'citizen-nav-menu';

export const CitizenPortalLayout: React.FC<CitizenPortalLayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { t } = useAccessibility();
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNavOpen) {
        setIsNavOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isNavOpen]);

  return (
    <div className="space-y-4">
      {/* Official Section Header */}
      <div className="bg-white rounded-md border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-gov-navy uppercase tracking-wider block">
              {t('Government of Jharkhand • Grievance & Public Services Portal', 'झारखंड सरकार • शिकायत एवं नागरिक सेवा पोर्टल')}
            </span>
            <h1 className="gov-h1 mt-1">
              {t('Citizen Services', 'नागरिक सेवाएं')}
            </h1>
            <p className="gov-body text-slate-600 mt-1">
              {t('Report and track civic issues in your area.', 'अपने क्षेत्र की नागरिक समस्याओं को दर्ज और ट्रैक करें।')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Hamburger button — always visible */}
            <button
              onClick={() => setIsNavOpen(prev => !prev)}
              aria-expanded={isNavOpen}
              aria-controls={NAV_MENU_ID}
              aria-label={isNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gov-navy focus:ring-offset-1 transition"
            >
              {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="text-right text-sm text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block">{currentUser.name}</span>
              <div className="text-xs sm:text-sm text-slate-600 font-mono">
                {(currentUser as any).phone || currentUser.email || 'Grievance Registrant'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar (collapsible) + Main Content */}
      <div className="flex flex-col gap-[28px] items-start">
        {/* Shared Reusable Sidebar */}
        <CitizenSidebar
          id={NAV_MENU_ID}
          isMobileOpen={isNavOpen}
          onCloseMobile={() => setIsNavOpen(false)}
        />

        {/* Main Content Area */}
        <main className="w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
