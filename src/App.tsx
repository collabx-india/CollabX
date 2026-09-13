import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { GovHeader } from './components/common/GovHeader';
import { LandingPage } from './components/landing/LandingPage';
import { LoginSelectionPage } from './components/auth/LoginSelectionPage';
import { CitizenLoginPage } from './components/auth/CitizenLoginPage';
import { UniversityLoginPage } from './components/auth/UniversityLoginPage';
import { IndustryLoginPage } from './components/auth/IndustryLoginPage';
import { RestrictedAccessPage } from './components/auth/RestrictedAccessPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { PublicServicesPage } from './components/public/PublicServicesPage';
import { PublicReportPage } from './components/public/PublicReportPage';
import { PublicTrackPage } from './components/public/PublicTrackPage';
import { PublicChallengesPage } from './components/public/PublicChallengesPage';
import { AboutCollabXPage } from './components/public/AboutCollabXPage';
import { HelpPage } from './components/public/HelpPage';

import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { UniversityPortal } from './components/university/UniversityPortal';
import { IndustryDashboard } from './components/industry/IndustryDashboard';
import { GovDashboard } from './components/government/GovDashboard';
import { ExpertDashboard } from './components/expert/ExpertDashboard';

const MainAppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const [refreshKey, _setRefreshKey] = useState<number>(0);

  const isCitizenRoute = location.pathname.startsWith('/citizen');

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col ${isCitizenRoute ? '' : 'justify-between'} text-slate-800 font-sans`}>
      {/* GovTech Header */}
      <GovHeader />

      {/* Main Router Content Area */}
      <main 
        id="main-content" 
        className={`max-w-7xl mx-auto w-full px-4 sm:px-6 ${isCitizenRoute ? 'py-4' : 'flex-1 py-6'}`}
        key={`${currentUser.id}-${currentUser.role}-${currentUser.subRole}-${refreshKey}`}
      >
        <Routes>
          {/* Public Landing & Information Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<PublicServicesPage />} />
          <Route path="/report" element={<PublicReportPage />} />
          <Route path="/track" element={<PublicTrackPage />} />
          <Route path="/challenges" element={<PublicChallengesPage />} />
          <Route path="/challenges/:id" element={<PublicChallengesPage />} />
          <Route path="/about" element={<AboutCollabXPage />} />
          <Route path="/help" element={<HelpPage />} />

          {/* Authentication Selection & Login Forms */}
          <Route path="/login" element={<LoginSelectionPage />} />
          <Route path="/login/citizen" element={<CitizenLoginPage />} />
          <Route path="/login/university" element={<UniversityLoginPage />} />
          <Route path="/login/industry" element={<IndustryLoginPage />} />
          <Route path="/login/government" element={<RestrictedAccessPage />} />
          <Route path="/login/restricted" element={<RestrictedAccessPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Citizen Routes */}
          <Route
            path="/citizen/*"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected University Routes (Student & Professor) */}
          <Route
            path="/university/*"
            element={
              <ProtectedRoute allowedRoles={['student', 'professor']}>
                <UniversityPortal />
              </ProtectedRoute>
            }
          />

          {/* Protected Industry Routes */}
          <Route
            path="/industry/*"
            element={
              <ProtectedRoute allowedRoles={['industry']}>
                <IndustryDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Government Routes */}
          <Route
            path="/government/*"
            element={
              <ProtectedRoute allowedRoles={['government']}>
                <GovDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Domain Expert Routes */}
          <Route
            path="/expert/*"
            element={
              <ProtectedRoute allowedRoles={['expert']}>
                <ExpertDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Official GIGW-Compliant Government Footer */}
      <footer className={`bg-white border-t border-gov-border ${isCitizenRoute ? 'mt-6 py-6' : 'mt-12 py-8'} px-4 sm:px-8 text-sm text-slate-600`}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 border-b border-slate-200 pb-6">
            {/* Identity */}
            <div className="space-y-2">
              <div className="font-black text-gov-navy text-lg tracking-tight">COLLABX</div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Connecting Problems, Ideas & Impact
              </p>
              <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                Government of Jharkhand
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <div className="font-bold text-gov-navy text-sm uppercase tracking-wider">Important Links</div>
              <ul className="space-y-1.5 text-xs sm:text-sm font-medium text-slate-600">
                <li><Link to="/about" className="hover:underline hover:text-gov-blue">About CollabX</Link></li>
                <li><Link to="/services" className="hover:underline hover:text-gov-blue">Public Services Directory</Link></li>
                <li><Link to="/report" className="hover:underline hover:text-gov-blue">Report a Problem</Link></li>
                <li><Link to="/track" className="hover:underline hover:text-gov-blue">Track Report</Link></li>
                <li><Link to="/challenges" className="hover:underline hover:text-gov-blue">Public Challenges</Link></li>
                <li><Link to="/help" className="hover:underline hover:text-gov-blue">Help & FAQs</Link></li>
              </ul>
            </div>

            {/* Policies */}
            <div className="space-y-2">
              <div className="font-bold text-gov-navy text-sm uppercase tracking-wider">Website Policies</div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                <li><span className="hover:underline cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:underline cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:underline cursor-pointer">Copyright Policy</span></li>
                <li><span className="hover:underline cursor-pointer">Hyperlinking Policy</span></li>
                <li><span className="hover:underline cursor-pointer">Disclaimer</span></li>
              </ul>
            </div>

            {/* Accessibility & Compliance */}
            <div className="space-y-2">
              <div className="font-bold text-gov-navy text-sm uppercase tracking-wider">Accessibility & Standards</div>
              <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                <p>GIGW (Guidelines for Indian Government Websites) Compliant</p>
                <p>WCAG 2.1 AA Accessibility Standards</p>
                <p>WGS84 GIS Spatial Data Standards</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
            <p>
              Proposed GovTech platform architecture for the Government of Jharkhand. Demonstrations reflect local browser prototype state.
            </p>
            <div>
              © {new Date().getFullYear()} Government of Jharkhand. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
