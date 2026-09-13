import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext';
import { ShieldCheck, Users, GraduationCap, Briefcase, Building2, ArrowRight } from 'lucide-react';

export const AboutCollabXPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-gov-blue mb-1.5">
          <ShieldCheck className="w-4 h-4 text-gov-saffron" />
          <span>{t('Government of Jharkhand • Proposed Platform Architecture', 'झारखंड सरकार • प्रस्तावित प्लेटफॉर्म आर्किटेक्चर')}</span>
        </div>
        <h1 className="text-2xl sm:text-[30px] font-bold text-gov-navy tracking-tight leading-tight">
          {t('About CollabX', 'CollabX के बारे में')}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 mt-2 leading-relaxed">
          {t(
            'CollabX is a proposed digital governance framework connecting citizen reports, department verification, academic research, and industry support.',
            'CollabX एक प्रस्तावित डिजिटल गवर्नेंस ढांचा है जो नागरिकों, विभाग सत्यापन, शैक्षणिक अनुसंधान और उद्योग सहायता को जोड़ता है।'
          )}
        </p>
      </div>

      {/* Core Objectives */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <h2 className="text-xl sm:text-[23px] font-bold text-gov-navy leading-tight">
          {t('Core Platform Principles', 'मुख्य प्लेटफॉर्म सिद्धांत')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <h3 className="text-base sm:text-[17px] font-semibold text-gov-navy block">
              1. Citizen Civic Voice
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Enable citizens across all districts to report localized civic challenges using text, voice notes, photos, and location markers.
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <h3 className="text-base sm:text-[17px] font-semibold text-gov-navy block">
              2. Institutional Verification
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Structure verified problem descriptions into actionable public challenges for university researchers and empanelled experts.
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <h3 className="text-base sm:text-[17px] font-semibold text-gov-navy block">
              3. Multi-Stakeholder Collaboration
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Bridge the gap between academic innovators, domain experts, and industry CSR partners to build practical solutions.
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <h3 className="text-base sm:text-[17px] font-semibold text-gov-navy block">
              4. Transparent Evaluation & Tracking
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Track progress from initial report verification to on-ground pilot deployment and impact measurement.
            </p>
          </div>
        </div>
      </div>

      {/* Stakeholders */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <h2 className="text-xl sm:text-[23px] font-bold text-gov-navy leading-tight">
          {t('Participating Stakeholder Groups', 'भाग लेने वाले हितधारक समूह')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center space-y-1.5">
            <Users className="w-6 h-6 text-slate-700 mx-auto" />
            <span className="font-bold text-slate-900 text-sm sm:text-base block">Citizens</span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Report & Track</span>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center space-y-1.5">
            <GraduationCap className="w-6 h-6 text-gov-blue mx-auto" />
            <span className="font-bold text-slate-900 text-sm sm:text-base block">Universities</span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Research & Ideas</span>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center space-y-1.5">
            <Briefcase className="w-6 h-6 text-emerald-700 mx-auto" />
            <span className="font-bold text-slate-900 text-sm sm:text-base block">Industry</span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Resources & Pilots</span>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center space-y-1.5">
            <Building2 className="w-6 h-6 text-amber-700 mx-auto" />
            <span className="font-bold text-slate-900 text-sm sm:text-base block">Government</span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">Verification & Policy</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-[19px] font-semibold text-gov-navy leading-snug">
            {t('Explore Public Services', 'सार्वजनिक सेवाओं का अन्वेषण करें')}
          </h3>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            {t('Access public services, report issues, or track existing reports.', 'सेवाओं तक पहुंचें, समस्याएं दर्ज करें, या रिपोर्ट स्थिति देखें।')}
          </p>
        </div>
        <button
          onClick={() => navigate('/services')}
          className="px-5 py-2.5 bg-gov-navy hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-lg flex items-center space-x-2 transition flex-shrink-0"
        >
          <span>View Services</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
