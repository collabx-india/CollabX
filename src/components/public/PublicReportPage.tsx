import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProblemReportForm } from '../citizen/ProblemReportForm';
import { ProblemReport } from '../../types';
import { useAccessibility } from '../../context/AccessibilityContext';
import { CheckCircle2, FileText, Search } from 'lucide-react';

export const PublicReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();
  const [submittedReport, setSubmittedReport] = useState<ProblemReport | null>(null);

  const handleSuccess = (report: ProblemReport) => {
    setSubmittedReport(report);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-gov-blue mb-1.5">
          <FileText className="w-4 h-4 text-gov-saffron shrink-0" />
          <span>{t('Government of Jharkhand • Citizen Service Desk', 'झारखंड सरकार • नागरिक सेवा डेस्क')}</span>
        </div>
        <h1 className="text-[30px] font-bold text-gov-navy leading-tight">
          {t('Report a Public Problem', 'सार्वजनिक समस्या दर्ज करें')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          {t(
            'Submit details, location, and optional media evidence regarding civic issues in your district.',
            'अपने जिले में नागरिक समस्याओं से संबंधित विवरण, स्थान और साक्ष्य जमा करें।'
          )}
        </p>
      </div>

      {!submittedReport ? (
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-xs">
          <ProblemReportForm
            onSuccess={handleSuccess}
            onCancel={() => navigate('/services')}
          />
        </div>
      ) : (
        /* Success Screen */
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-[23px] font-bold text-gov-navy leading-tight">
              {t('Problem Report Successfully Submitted', 'समस्या रिपोर्ट सफलतापूर्वक दर्ज की गई')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('Proposed GovTech Platform Architecture • Prototype Entry', 'प्रस्तावित GovTech प्लेटफॉर्म • प्रोटोटाइप प्रविष्टि')}
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 max-w-md mx-auto space-y-2.5 text-left text-sm sm:text-base">
            <div className="flex justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-medium">Reference ID:</span>
              <span className="font-mono text-sm sm:text-[15px] font-bold text-gov-navy">{submittedReport.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-medium">Title:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">{submittedReport.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">District / Locality:</span>
              <span className="text-slate-800">{submittedReport.district} ({submittedReport.panchayatOrLocality})</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/track?id=${submittedReport.id}`)}
              className="px-5 py-3 bg-gov-navy hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-lg flex items-center space-x-2 shadow-xs transition focus:ring-2 focus:ring-gov-blue"
            >
              <Search className="w-4 h-4" />
              <span>{t('Track This Report', 'रिपोर्ट की स्थिति ट्रैक करें')}</span>
            </button>
            <button
              onClick={() => setSubmittedReport(null)}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm sm:text-base rounded-lg border border-slate-300 transition"
            >
              {t('Submit Another Report', 'एक और रिपोर्ट दर्ज करें')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
