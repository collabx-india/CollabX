import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  FileText, 
  Search, 
  Target, 
  Lightbulb, 
  MessageSquare,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const PublicServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();

  const services = [
    {
      id: 'report',
      title: t('Report a Problem', 'समस्या रिपोर्ट करें'),
      description: t(
        'Report a public issue using description, category, location, and optional media evidence.',
        'विवरण, श्रेणी, स्थान और साक्ष्यों का उपयोग करके सार्वजनिक समस्या दर्ज करें।'
      ),
      icon: FileText,
      actionText: t('Report Issue', 'रिपोर्ट दर्ज करें'),
      path: '/report',
      badge: 'Public Service',
    },
    {
      id: 'track',
      title: t('Track a Report', 'रिपोर्ट की स्थिति देखें'),
      description: t(
        'Check the current status and resolution stage of a previously submitted public report.',
        'पूर्व में दर्ज की गई समस्या रिपोर्ट की स्थिति और प्रगति चरण देखें।'
      ),
      icon: Search,
      actionText: t('Track Status', 'स्थिति जांचें'),
      path: '/track',
      badge: 'Public Service',
    },
    {
      id: 'challenges',
      title: t('Public Challenges Directory', 'सार्वजनिक चुनौतियाँ निर्देशिका'),
      description: t(
        'Explore verified civic and development challenges identified by government departments.',
        'सरकारी विभागों द्वारा चिह्नित और सत्यापित सार्वजनिक समस्याओं का अन्वेषण करें।'
      ),
      icon: Target,
      actionText: t('View Challenges', 'चुनौतियाँ देखें'),
      path: '/challenges',
      badge: 'Open Repository',
    },
    {
      id: 'contribute',
      title: t('Contribute an Idea', 'विचार / समाधान प्रस्तुत करें'),
      description: t(
        'Submit research-backed solutions or innovative proposals for active challenges.',
        'सक्रिय चुनौतियों के लिए शोध-आधारित समाधान या विचार प्रस्तुत करें।'
      ),
      icon: Lightbulb,
      actionText: t('University / Research Login', 'विश्वविद्यालय लॉगिन'),
      path: '/login/university',
      badge: 'Institutional',
    },
    {
      id: 'feedback',
      title: t('Public Feedback', 'सार्वजनिक प्रतिक्रिया'),
      description: t(
        'Provide constructive feedback on resolved challenges and on-ground pilot implementations.',
        'हल की गई समस्याओं और जमीनी पायलट परियोजनाओं पर अपनी प्रतिक्रिया दें।'
      ),
      icon: MessageSquare,
      actionText: t('Citizen Login', 'नागरिक लॉगिन'),
      path: '/login/citizen',
      badge: 'Citizen Access',
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-gov-blue mb-1.5">
          <ShieldCheck className="w-4 h-4 text-gov-saffron shrink-0" />
          <span>{t('Government of Jharkhand Citizen Portal', 'झारखंड सरकार नागरिक पोर्टल')}</span>
        </div>
        <h1 className="text-[30px] font-bold text-gov-navy leading-tight">
          {t('Public Services Directory', 'सार्वजनिक सेवा निर्देशिका')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
          {t(
            'Official directory of citizen civic services, problem reporting, report tracking, and public challenge repositories.',
            'नागरिक नागरिक सेवाओं, समस्या रिपोर्टिंग, स्थिति ट्रैकिंग और सार्वजनिक चुनौतियों की आधिकारिक निर्देशिका।'
          )}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => {
          const IconComp = service.icon;
          return (
            <div
              key={service.id}
              className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col justify-between hover:border-gov-navy shadow-xs transition"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-gov-navy flex items-center justify-center">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {service.badge}
                  </span>
                </div>
                <h3 className="text-[19px] font-semibold text-gov-navy leading-snug">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => navigate(service.path)}
                  className="px-5 py-2.5 bg-gov-navy hover:bg-slate-800 text-white font-semibold text-sm sm:text-base rounded-lg flex items-center space-x-2 transition focus:ring-2 focus:ring-gov-blue"
                >
                  <span>{service.actionText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prototype Notice Footer */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-md text-xs sm:text-sm text-slate-600 flex items-center justify-between">
        <span>Proposed GovTech Platform Architecture • Prototype Phase</span>
        <button
          onClick={() => navigate('/about')}
          className="font-bold text-gov-blue hover:underline text-xs sm:text-sm"
        >
          {t('Learn about CollabX →', 'CollabX के बारे में जानें →')}
        </button>
      </div>
    </div>
  );
};
