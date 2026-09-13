import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ProblemReport } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  MapPin, 
  Building2, 
  Users, 
  Briefcase, 
  Layers, 
  Calendar,
  AlertCircle,
  ArrowLeft,
  Tag,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface MyReportsTimelineProps {
  problems: ProblemReport[];
  onOpenFeedbackModal?: (problemId: string) => void;
}

const COLLABX_STAGES = [
  { id: 'submitted', label: '1. Submitted', desc: 'Reported by citizen' },
  { id: 'ai_analyzed', label: '2. AI Analyzed', desc: 'Categorized & prioritized' },
  { id: 'university_matched', label: '3. University Matched', desc: 'Matched to varsity department' },
  { id: 'university_adopted', label: '4. University Adopted', desc: 'Adopted by department' },
  { id: 'team_formed', label: '5. Team Formed', desc: 'Students & faculty mentor' },
  { id: 'solution_development', label: '6. Solution Dev', desc: 'Engineering solution' },
  { id: 'industry_collaboration', label: '7. Industry Partner', desc: 'Industry co-creation & CSR' },
  { id: 'prototype', label: '8. Prototype', desc: 'Model & bench test' },
  { id: 'pilot', label: '9. Pilot Trial', desc: 'On-ground field testing' },
  { id: 'implementation', label: '10. Implementation', desc: 'Full scale deployment' },
  { id: 'completed', label: '11. Completed', desc: 'Measured community impact' },
];

export const MyReportsTimeline: React.FC<MyReportsTimelineProps> = ({
  problems,
  onOpenFeedbackModal,
}) => {
  const { t } = useAccessibility();
  const { reportId: routeReportId } = useParams<{ reportId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reportId = routeReportId || searchParams.get('reportId') || searchParams.get('id');
  const isSingleReportView = Boolean(reportId);

  const selectedReport = isSingleReportView
    ? problems.find(p => p.id.toLowerCase() === reportId!.trim().toLowerCase()) ||
      storageService.getProblems().find(p => p.id.toLowerCase() === reportId!.trim().toLowerCase())
    : null;

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'submitted': return 0;
      case 'ai_analyzed': return 1;
      case 'university_matched': return 2;
      case 'university_adopted': return 3;
      case 'team_formed': return 4;
      case 'solution_development': return 5;
      case 'industry_collaboration': return 6;
      case 'prototype': return 7;
      case 'pilot': return 8;
      case 'implementation': return 9;
      case 'completed': return 10;
      default: return 2;
    }
  };

  const getStageProgress = (status: string) => {
    const idx = getStageIndex(status);
    return Math.round(((idx + 1) / 11) * 100);
  };

  // 1. Single Report View: Not Found State
  if (isSingleReportView && !selectedReport) {
    return (
      <div className="space-y-5">
        <div className="bg-white p-4 rounded-md border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gov-navy flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gov-navy" />
              <span>{t('Grievance Progress Tracking', 'दर्ज समस्याओं की आधिकारिक प्रगति')}</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {t('Official verification and innovation lifecycle tracker.', 'आधिकारिक सत्यापन एवं नवाचार जीवनचक्र ट्रैकर।')}
            </p>
          </div>
          <button
            onClick={() => navigate('/citizen')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gov-navy text-xs font-semibold rounded border border-slate-300 transition flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('Back to Dashboard', 'डैशबोर्ड पर वापस जाएं')}</span>
          </button>
        </div>

        <div className="bg-white rounded-md border border-slate-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {t('Report Not Found', 'रिपोर्ट नहीं मिली')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t(
              `The requested grievance submission "${reportId}" could not be found in official records.`,
              `आईडी "${reportId}" वाली शिकायत आधिकारिक रिकॉर्ड में नहीं मिली।`
            )}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/citizen')}
              className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white rounded text-xs font-bold transition shadow-xs"
            >
              {t('Return to Citizen Portal', 'नागरिक पोर्टल पर वापस जाएं')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderReportCard = (problem: ProblemReport, isSingle: boolean) => {
    const currentStageIdx = getStageIndex(problem.status);
    const progressPercent = problem.progressPercentage ?? getStageProgress(problem.status);
    const currentStage = COLLABX_STAGES[currentStageIdx];
    const matchedUni = problem.matchedUniversity || problem.referredUniversities?.[0] || 'Birla Institute of Technology (BIT) Mesra';
    const matchedDept = problem.matchedDepartment || 'Department of Civil Engineering';
    const score = problem.matchingScore || 88;
    const categoryName = problem.aiAnalysis?.category || 'Civic Infrastructure';

    return (
      <div
        key={problem.id}
        className="bg-white rounded-md border border-slate-200 p-5 space-y-4 shadow-2xs"
      >
        {/* Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="gov-id font-bold bg-slate-100 text-gov-navy px-2.5 py-1 rounded border border-slate-300">
                {problem.id}
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded gov-badge bg-indigo-50 text-indigo-900 border border-indigo-200">
                <Tag className="w-3.5 h-3.5 text-indigo-700" />
                <span>{categoryName}</span>
              </span>
              <span className="gov-helper">
                Reported on {new Date(problem.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h3 className="gov-h3 leading-snug">{problem.title}</h3>
            <div className="flex items-center space-x-1.5 text-sm text-slate-700">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>{problem.panchayatOrLocality}, {problem.district}</span>
              {problem.coordinates && (
                <span className="text-slate-500 font-mono text-xs ml-1">
                  ({problem.coordinates.lat.toFixed(4)}, {problem.coordinates.lng.toFixed(4)})
                </span>
              )}
            </div>
          </div>

          {/* Status Badge, Single View Link & Feedback Trigger */}
          <div className="flex items-center space-x-2.5">
            <span className="px-3.5 py-1.5 rounded gov-badge bg-gov-navy text-white shadow-2xs">
              Current Stage: {currentStage?.label || problem.status}
            </span>

            {!isSingle && (
              <button
                onClick={() => navigate(`/citizen/reports/${problem.id}`)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-gov-navy rounded gov-button border border-slate-300 transition"
              >
                View Details
              </button>
            )}

            {(problem.status === 'pilot' || problem.status === 'completed') && onOpenFeedbackModal && (
              <button
                onClick={() => onOpenFeedbackModal(problem.id)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded gov-button transition shadow-2xs"
              >
                <span>{t('Provide Feedback', 'फीडबैक दें')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Problem Description */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5">
          <span className="text-xs uppercase font-bold text-slate-600 flex items-center space-x-1.5 tracking-wider">
            <FileText className="w-3.5 h-3.5 text-gov-navy" />
            <span>{t('Problem Description', 'समस्या का विवरण')}</span>
          </span>
          <p className="gov-body text-slate-800">{problem.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-slate-700">Workflow Progress:</span>
            <span className="font-mono font-bold text-gov-navy text-base">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-gov-navy h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Visual 11-Stage Progress Tracker */}
        <div>
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            {t('Innovation Lifecycle Timeline:', 'नवाचार जीवनचक्र समयरेखा:')}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {COLLABX_STAGES.map((stage, idx) => {
              const isCompleted = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const isPending = idx > currentStageIdx;

              return (
                <div
                  key={stage.id}
                  className={`p-2.5 rounded border text-center transition ${
                    isCurrent
                      ? 'bg-gov-navy text-white border-gov-navy font-bold shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-50 text-slate-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                    {isCurrent && <Clock className="w-4 h-4 text-amber-300" />}
                    {isPending && <span className="text-xs font-mono text-slate-400">{idx + 1}</span>}
                  </div>

                  <div className="text-xs sm:text-sm font-semibold leading-tight">{stage.label}</div>
                  <div className="text-xs mt-0.5 opacity-80 truncate">{stage.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Analysis & Matching Event Box */}
        <div className="p-4 bg-blue-50/70 rounded-lg border border-blue-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 font-bold text-gov-navy text-sm sm:text-base">
              <Sparkles className="w-4 h-4 text-gov-saffron" />
              <span>Matched by AI:</span>
              <span className="text-blue-950 font-bold">{matchedUni}</span>
              <span className="text-slate-600 font-normal">({matchedDept})</span>
            </div>
            <span className="px-2.5 py-1 bg-white text-blue-900 border border-blue-300 rounded font-mono font-bold text-sm">
              Dynamic Match Score: {score}%
            </span>
          </div>

          {problem.aiAnalysis && (
            <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-blue-100 text-sm">
              <span className="font-semibold text-slate-700">AI Analysis:</span>
              {problem.aiAnalysis.priority && (
                <span className="px-2 py-0.5 rounded bg-blue-100/90 text-blue-900 font-semibold text-xs sm:text-sm">
                  Priority: {problem.aiAnalysis.priority}
                </span>
              )}
              {problem.aiAnalysis.severity !== undefined && (
                <span className="px-2 py-0.5 rounded bg-blue-100/90 text-blue-900 font-semibold text-xs sm:text-sm">
                  Severity: {problem.aiAnalysis.severity}/100
                </span>
              )}
              {problem.aiAnalysis.confidence !== undefined && (
                <span className="px-2 py-0.5 rounded bg-blue-100/90 text-blue-900 font-semibold text-xs sm:text-sm">
                  Confidence: {Math.round(problem.aiAnalysis.confidence * 100)}%
                </span>
              )}
              {problem.aiAnalysis.affectedGroups && problem.aiAnalysis.affectedGroups.length > 0 && (
                <span className="text-slate-700 text-xs sm:text-sm">
                  • Affected Groups: {problem.aiAnalysis.affectedGroups.join(', ')}
                </span>
              )}
            </div>
          )}

          <div className="text-slate-800 space-y-1.5 text-sm">
            <p className="italic">
              {problem.matchingReason || problem.aiAnalysis?.rationale || 'Direct institutional capability match based on domain expertise and local technical infrastructure.'}
            </p>
            {problem.matchingExplanationBullets && problem.matchingExplanationBullets.length > 0 && (
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                {problem.matchingExplanationBullets.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Execution Details Grid: University, Team, Industry Partner & Milestones */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-slate-600 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-gov-navy" />
              <span>Matched Institution & Department</span>
            </span>
            <div className="font-bold text-slate-900 text-sm sm:text-base">{matchedUni}</div>
            <div className="text-slate-600 text-xs sm:text-sm">{matchedDept}</div>
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-slate-600 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-gov-navy" />
              <span>Student / Faculty Research Team</span>
            </span>
            <div className="font-bold text-slate-900 text-sm sm:text-base">
              {problem.teamName || (currentStageIdx >= 3 ? 'Engineering Taskforce Alpha' : 'Forming after adoption')}
            </div>
            <div className="text-slate-600 text-xs sm:text-sm">
              Mentor: {problem.facultyMentorName || (currentStageIdx >= 3 ? 'Prof. Rajiv Sharma, Ph.D.' : 'Department Chair')}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-slate-600 flex items-center space-x-1.5">
              <Briefcase className="w-3.5 h-3.5 text-gov-navy" />
              <span>Industry Partner</span>
            </span>
            <div className="font-bold text-slate-900 text-sm sm:text-base">
              {problem.industryPartnerName || (currentStageIdx >= 6 ? 'Tata Steel CSR / L&T Tech' : 'Seeking partner')}
            </div>
            <div className="text-slate-600 text-xs sm:text-sm">
              {currentStageIdx >= 6 ? 'Hardware & Pilot CSR Support' : 'Available in Stage 7'}
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <span className="text-xs uppercase font-bold text-slate-600 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-gov-navy" />
              <span>Milestones</span>
            </span>
            <div className="text-slate-800 text-sm sm:text-base">
              <span className="font-semibold">Current:</span>{' '}
              {problem.currentMilestoneTitle || currentStage.desc}
            </div>
            {problem.nextMilestoneTitle && (
              <div className="text-slate-600 text-xs sm:text-sm">
                <span className="font-semibold">Next:</span> {problem.nextMilestoneTitle}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-slate-600 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-gov-navy" />
              <span>Last Activity</span>
            </span>
            <div className="text-slate-800 font-mono text-xs sm:text-sm">
              {problem.lastMilestoneUpdate ? new Date(problem.lastMilestoneUpdate).toLocaleString() : 'Recent workflow sync'}
            </div>
          </div>
        </div>

        {/* Evidence & Attachments */}
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-sm">
          <span className="text-xs uppercase font-bold text-slate-600 flex items-center space-x-1 tracking-wider">
            <ImageIcon className="w-3.5 h-3.5 text-gov-navy" />
            <span>{t('Evidence & Attachments', 'साक्ष्य एवं संलग्नक')}</span>
          </span>

          {problem.evidenceUrls && problem.evidenceUrls.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {problem.evidenceUrls.map((url, idx) => (
                <div key={idx} className="space-y-1">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative rounded border border-slate-200 overflow-hidden w-28 h-20 bg-slate-100 hover:border-gov-navy transition"
                  >
                    <img
                      src={url}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                  </a>
                  <span className="gov-helper block">Attachment #{idx + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="gov-helper italic">No photographic evidence attached with submission.</p>
          )}

          {problem.audioTranscript && (
            <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600 text-sm">
              <span className="font-semibold text-slate-700">Audio Note Transcript: </span>
              <span className="italic">"{problem.audioTranscript}"</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. Single Report Details View: Renders EXACTLY ONE report
  if (isSingleReportView && selectedReport) {
    return (
      <div className="space-y-5">
        <div className="bg-white p-4 rounded-md border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/citizen')}
                className="gov-button text-gov-navy hover:underline flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('Back to Dashboard', 'डैशबोर्ड पर वापस जाएं')}</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => navigate('/citizen/reports')}
                className="gov-button text-gov-navy hover:underline"
              >
                {t('All Submissions', 'सभी शिकायतें')}
              </button>
            </div>
            <h2 className="gov-h2 flex items-center space-x-2 mt-2">
              <Clock className="w-5 h-5 text-gov-navy" />
              <span>{t('Grievance Submission Details', 'शिकायत विवरण')}</span>
            </h2>
            <p className="gov-body text-slate-600 mt-0.5">
              {t('Official innovation workflow and status tracking for Registration ID: ', 'पंजीकरण आईडी के लिए आधिकारिक स्थिति: ')}
              <span className="gov-id font-bold text-gov-navy">{selectedReport.id}</span>
            </p>
          </div>
        </div>

        {/* Strictly render ONLY the selected report */}
        {renderReportCard(selectedReport, true)}
      </div>
    );
  }

  // 3. Multi-Report List View (when navigating directly to /citizen/reports)
  return (
    <div className="space-y-5">
      <div className="bg-white p-4 rounded-md border border-slate-200">
        <h2 className="gov-h2 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gov-navy" />
          <span>{t('Grievance Progress Tracking', 'दर्ज समस्याओं की आधिकारिक प्रगति')}</span>
        </h2>
        <p className="gov-body text-slate-600 mt-0.5">
          {t('Real-time 11-stage innovation workflow: from citizen submission to university research, industry collaboration, and on-ground impact.', 'नागरिक रिपोर्टिंग से लेकर विश्वविद्यालय अनुसंधान, उद्योग सहयोग एवं पूर्ण समाधान तक।')}
        </p>
      </div>

      {problems.length === 0 ? (
        <div className="bg-white p-8 rounded-md border border-slate-200 text-center text-xs text-slate-500">
          No reports submitted yet.
        </div>
      ) : (
        problems.map(problem => renderReportCard(problem, false))
      )}
    </div>
  );
};
