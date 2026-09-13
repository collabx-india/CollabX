import React, { useState } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Phone, Mail } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const { t } = useAccessibility();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: t('How do I report a civic problem?', 'मैं नागरिक समस्या कैसे दर्ज करूं?'),
      a: t(
        'Go to the "Report a Problem" section, enter the description, district, and locality, attach optional evidence (photo/voice note), verify your contact details with OTP, and click submit.',
        '"समस्या रिपोर्ट करें" अनुभाग पर जाएं, विवरण, जिला और क्षेत्र दर्ज करें, साक्ष्य संलग्न करें, OTP से सत्यापित करें और सबमिट करें।'
      ),
    },
    {
      q: t('How can I track the status of my report?', 'मैं अपनी रिपोर्ट की स्थिति कैसे ट्रैक कर सकता हूं?'),
      a: t(
        'Visit "Track Report", enter your Registration Reference ID (e.g. PR-2026-0881) or your registered mobile number, and click "View Status" to see current progress.',
        '"रिपोर्ट स्थिति देखें" पर जाएं, अपनी पंजीकरण संदर्भ आईडी दर्ज करें और "स्थिति देखें" पर क्लिक करें।'
      ),
    },
    {
      q: t('Who can respond to public challenges?', 'सार्वजनिक चुनौतियों का उत्तर कौन दे सकता है?'),
      a: t(
        'Empanelled university researchers, faculty advisors, student innovators, domain experts, and industry partners can sign in and submit solution proposals.',
        'विश्वविद्यालय शोधकर्ता, संकाय, छात्र, विशेषज्ञ और उद्योग भागीदार साइन इन करके प्रस्ताव जमा कर सकते हैं।'
      ),
    },
    {
      q: t('What accessibility features are available?', 'क्या अभिगम्यता सुविधाएँ उपलब्ध हैं?'),
      a: t(
        'Click the Accessibility button in the header to toggle high contrast mode, adjust font scaling, enable text-to-speech reading mode, screen reader support, or switch languages (English / हिन्दी).',
        'उच्च कंट्रास्ट, फ़ॉन्ट आकार, टेक्स्ट-टू-स्पीच और भाषा बदलने के लिए हेडर में अभिगम्यता बटन पर क्लिक करें।'
      ),
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-gov-blue mb-1.5">
          <HelpCircle className="w-4 h-4 text-gov-saffron" />
          <span>{t('Government of Jharkhand • Portal Support', 'झारखंड सरकार • पोर्टल सहायता')}</span>
        </div>
        <h1 className="text-2xl sm:text-[30px] font-bold text-gov-navy tracking-tight leading-tight">
          {t('Help & Frequently Asked Questions', 'सहायता और अक्सर पूछे जाने वाले प्रश्न')}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 mt-2 leading-relaxed">
          {t(
            'Find answers to common questions regarding problem reporting, report tracking, accessibility, and account access.',
            'समस्या रिपोर्टिंग, स्थिति ट्रैकिंग और अभिगम्यता से संबंधित सामान्य प्रश्नों के उत्तर प्राप्त करें।'
          )}
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <h2 className="text-xl sm:text-[23px] font-bold text-gov-navy leading-tight">
          {t('Frequently Asked Questions', 'अक्सर पूछे जाने वाले प्रश्न')}
        </h2>
        <div className="divide-y divide-slate-200 border-t border-slate-200">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left flex items-center justify-between font-semibold text-[17px] sm:text-[19px] text-gov-navy py-1 hover:text-gov-blue focus:outline-none transition"
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-base text-slate-700 leading-relaxed mt-3 pl-3 border-l-3 border-gov-blue">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact & Support Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-xl sm:text-[23px] font-bold text-gov-navy leading-tight flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-gov-saffron flex-shrink-0" />
          <span>{t('Support & Technical Guidance', 'सहायता एवं तकनीकी सहायता')}</span>
        </h2>
        <p className="text-base text-slate-700 leading-relaxed">
          For technical issues regarding accessibility, portal navigation, or authentication access, please contact your district nodal helpdesk or visit the portal accessibility menu.
        </p>
        <div className="flex flex-wrap gap-5 pt-2 text-sm sm:text-base font-semibold text-slate-700">
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gov-blue flex-shrink-0" />
            <span>Toll Free Helpline: 1800-XXX-XXXX (Proposed)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gov-blue flex-shrink-0" />
            <span>Help Desk: support-collabx@jharkhand.gov.in (Proposed)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
