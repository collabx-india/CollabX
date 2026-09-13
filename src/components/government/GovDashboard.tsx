import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { storageService } from '../../services/storageService';
import { ProblemReport } from '../../types';
import { RegionalProblemIntelligence } from './RegionalProblemIntelligence';
import { 
  Building2, 
  Layers, 
  Eye, 
  X,
  Award
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

// =========================================================================
// READ-ONLY PROJECT DETAIL MODAL FOR GOVERNMENT (ZERO WORKFLOW BUTTONS)
// =========================================================================
interface GovProjectDetailModalProps {
  problem: ProblemReport | null;
  isOpen: boolean;
  onClose: () => void;
}

const GovProjectDetailModal: React.FC<GovProjectDetailModalProps> = ({ problem, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !problem) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-lg border border-slate-300 shadow-xl my-8 overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gov-modal-title"
      >
        {/* Header */}
        <div className="bg-gov-navy text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm sm:text-[15px] font-bold bg-gov-saffron text-white px-2.5 py-1 rounded">
              {problem.id}
            </span>
            <h3 id="gov-modal-title" className="text-[19px] font-semibold text-white leading-snug line-clamp-1">
              {problem.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Strictly Read-Only) */}
        <div className="p-5 sm:p-6 space-y-5 text-sm sm:text-base max-h-[75vh] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 rounded-md font-bold uppercase text-xs sm:text-sm bg-gov-navy text-white">
                Stage: {problem.status.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-gov-navy font-semibold text-xs sm:text-sm border border-blue-200">
                Progress: {problem.progressPercentage || 50}%
              </span>
            </div>
            <span className="text-xs sm:text-sm text-slate-500 font-mono">
              Reported: {new Date(problem.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-slate-800 text-sm sm:text-[15px] block">
              Citizen Problem Statement:
            </span>
            <p className="text-slate-800 text-sm sm:text-base leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200">
              {problem.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Location & District</span>
              <strong className="text-slate-900 text-sm sm:text-base mt-1 block">{problem.panchayatOrLocality}, {problem.district}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-xs font-semibold uppercase block">Affected Population</span>
              <strong className="text-slate-900 text-sm sm:text-base mt-1 block">
                {problem.affectedPopulation ? `${problem.affectedPopulation.toLocaleString()} Residents` : 'Community'}
              </strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-xs font-semibold uppercase block">AI Match Score</span>
              <strong className="text-gov-navy text-base sm:text-lg font-mono font-bold mt-1 block">{problem.matchingScore || 88}%</strong>
            </div>
          </div>

          {/* Institutional & Team Routing */}
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-blue-900 block">University & Department</span>
              <strong className="text-gov-navy text-sm sm:text-base block mt-1">{problem.matchedUniversity || 'Birla Institute of Technology (BIT) Mesra'}</strong>
              <span className="text-slate-600 text-xs sm:text-sm block mt-0.5">{problem.matchedDepartment || 'Civil Engineering'}</span>
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-blue-900 block">Research Team & Mentor</span>
              <strong className="text-slate-900 text-sm sm:text-base block mt-1">{problem.teamName || 'Engineering Taskforce'}</strong>
              <span className="text-slate-600 text-xs sm:text-sm block mt-0.5">Mentor: {problem.facultyMentorName || 'Faculty Chair'}</span>
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-blue-900 block">Industry Partner</span>
              <strong className="text-slate-900 text-sm sm:text-base block mt-1">{problem.industryPartnerName || 'Tata Steel CSR / Seeking Partner'}</strong>
              <span className="text-slate-600 text-xs sm:text-sm block mt-0.5">CSR & Hardware Collaboration</span>
            </div>
          </div>

          {/* Milestones */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="text-xs uppercase font-bold text-slate-700 block">Project Milestones:</span>
            <div className="text-slate-800 text-sm sm:text-base">
              <span className="font-semibold text-slate-900">Current Milestone:</span> {problem.currentMilestoneTitle || 'Engineering Solution Development'}
            </div>
            {problem.nextMilestoneTitle && (
              <div className="text-slate-600 text-xs sm:text-sm">
                <span className="font-semibold text-slate-800">Next Milestone:</span> {problem.nextMilestoneTitle}
              </div>
            )}
          </div>

          {/* Impact Metrics (if completed or pilot) */}
          {problem.impactMetrics && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-300 space-y-2.5">
              <div className="flex items-center space-x-2 text-emerald-950 font-bold text-sm sm:text-base">
                <Award className="w-5 h-5 text-emerald-700" />
                <span>Verified Community Impact Metrics</span>
              </div>
              <p className="text-emerald-900 text-sm sm:text-base leading-relaxed">
                {problem.impactMetrics.summary || 'Verified reduction in local flooding and enhanced public infrastructure resilience.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs sm:text-sm">
                {problem.impactMetrics.beneficiariesCount && (
                  <div className="bg-white p-2.5 rounded-md border border-emerald-200">
                    <span className="text-slate-500 block">Beneficiaries:</span>
                    <strong className="text-emerald-950 text-sm sm:text-base">{problem.impactMetrics.beneficiariesCount.toLocaleString()} Citizens</strong>
                  </div>
                )}
                {problem.impactMetrics.costSavings && (
                  <div className="bg-white p-2.5 rounded-md border border-emerald-200">
                    <span className="text-slate-500 block">Public Savings:</span>
                    <strong className="text-emerald-950 text-sm sm:text-base">{problem.impactMetrics.costSavings}</strong>
                  </div>
                )}
                {problem.impactMetrics.performanceImprovement && (
                  <div className="bg-white p-2.5 rounded-md border border-emerald-200">
                    <span className="text-slate-500 block">Performance Gain:</span>
                    <strong className="text-emerald-950 text-sm sm:text-base">{problem.impactMetrics.performanceImprovement}</strong>
                  </div>
                )}
                {problem.impactMetrics.villagesCovered && (
                  <div className="bg-white p-2.5 rounded-md border border-emerald-200">
                    <span className="text-slate-500 block">Villages:</span>
                    <strong className="text-emerald-950 text-sm sm:text-base">{problem.impactMetrics.villagesCovered} Localities</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs sm:text-sm italic leading-relaxed">
            * Read-Only Monitoring View: As per State GovTech Governance Standards, Government accounts monitor progress and outcome telemetry without intervening in academic engineering workflows.
          </div>
        </div>

        {/* Read-Only Footer: Single Close Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-sm sm:text-base transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN GOVERNMENT MONITORING COMPONENT (STRICTLY 2 NAVIGATION ITEMS)
// =========================================================================
export const GovDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useAccessibility();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.endsWith('/projects') ? 'projects' : 'monitoring';
  const [problems] = useState<ProblemReport[]>(() => storageService.getProblems());
  const [selectedProblem, setSelectedProblem] = useState<ProblemReport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const handleTabChange = (_tab: string, path: string) => {
    navigate(path);
  };
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xs p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-lg bg-gov-navy text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Building2 className="w-7 h-7 text-gov-saffron-amber" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wide">
                Urban Development & Housing Department
              </span>
              <span className="text-xs text-slate-500 font-mono">STATE MONITORING DESK</span>
            </div>
            <h1 className="gov-h1 mt-1">
              {currentUser.name}
            </h1>
            <p className="gov-body text-slate-600 mt-1">
              Statewide R&D and Public Works Telemetry • Read-Only Analytics Layer
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md gov-label">
            All ULBs & Institutions Connected
          </span>
        </div>
      </div>

      {/* Navigation Tabs (Strictly 2 Items) */}
      <nav className="bg-white rounded-lg border border-slate-200 p-1.5 flex flex-wrap gap-2" aria-label="Government Navigation">
        <button
          onClick={() => handleTabChange('monitoring', '/government')}
          className={`py-2.5 px-5 rounded-md gov-button flex items-center space-x-2 transition ${
            activeTab === 'monitoring'
              ? 'bg-gov-navy text-white font-bold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-gov-saffron-amber" />
          <span>{t('Monitoring', 'निगरानी एवं विश्लेषण')}</span>
        </button>

        <button
          onClick={() => handleTabChange('projects', '/government/projects')}
          className={`py-2.5 px-5 rounded-md gov-button flex items-center space-x-2 transition ${
            activeTab === 'projects'
              ? 'bg-gov-navy text-white font-bold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>{t('Project Monitoring', 'परियोजना निगरानी')}</span>
          <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-gov-navy rounded-full text-xs font-bold">
            {problems.length}
          </span>
        </button>
      </nav>

      {/* ==================================================== */}
      {/* VIEW 1: MONITORING                                  */}
      {/* ==================================================== */}
      {activeTab === 'monitoring' && (
        <RegionalProblemIntelligence problems={problems} />
      )}

      {/* ==================================================== */}
      {/* VIEW 2: PROJECT MONITORING (READ-ONLY TELEMETRY)     */}
      {/* ==================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <h2 className="gov-h2">Statewide Project Monitoring ({problems.length})</h2>
            <p className="gov-body text-slate-600 mt-1">
              Read-only telemetry table for all problems across the 11-stage innovation pipeline. Click any row to view full project telemetry.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800">
                    <th className="p-3.5 sm:p-4 gov-table-th">Problem ID & Title</th>
                    <th className="p-3.5 sm:p-4 gov-table-th">University & Department</th>
                    <th className="p-3.5 sm:p-4 gov-table-th">Research Team</th>
                    <th className="p-3.5 sm:p-4 gov-table-th">Industry Partner</th>
                    <th className="p-3.5 sm:p-4 gov-table-th">Current Stage</th>
                    <th className="p-3.5 sm:p-4 gov-table-th">Progress</th>
                    <th className="p-3.5 sm:p-4 gov-table-th text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {problems.map(prob => (
                    <tr key={prob.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 sm:p-4">
                        <span className="gov-id font-bold text-gov-navy block">{prob.id}</span>
                        <span className="font-semibold text-slate-900 line-clamp-1 mt-0.5">{prob.title}</span>
                        <span className="gov-helper block mt-0.5">{prob.panchayatOrLocality}, {prob.district}</span>
                      </td>

                      <td className="p-3.5 sm:p-4 gov-table-td">
                        <strong className="text-slate-800 block">{prob.matchedUniversity || 'BIT Mesra'}</strong>
                        <span className="gov-helper">{prob.matchedDepartment || 'Civil Eng'}</span>
                      </td>

                      <td className="p-3.5 sm:p-4 gov-table-td">
                        <span className="font-medium text-slate-900 block">{prob.teamName || 'Engineering Team'}</span>
                        <span className="gov-helper">Mentor: {prob.facultyMentorName || 'Prof. Rajiv Sharma'}</span>
                      </td>

                      <td className="p-3.5 sm:p-4 gov-table-td">
                        <span className="font-medium text-slate-900 block">{prob.industryPartnerName || 'Tata Steel CSR'}</span>
                        <span className="gov-helper">Co-Creation Support</span>
                      </td>

                      <td className="p-3.5 sm:p-4">
                        <span className="gov-badge uppercase bg-blue-100 text-gov-navy border border-blue-200 inline-block">
                          {prob.status.replace('_', ' ')}
                        </span>
                        <span className="gov-helper block mt-1 truncate max-w-[170px]">
                          {prob.currentMilestoneTitle || 'Solution Dev'}
                        </span>
                      </td>

                      <td className="p-3.5 sm:p-4 font-mono font-bold text-slate-800 gov-table-td">
                        {prob.progressPercentage || 50}%
                      </td>

                      <td className="p-3.5 sm:p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProblem(prob);
                            setIsDetailOpen(true);
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg gov-button flex items-center space-x-1.5 ml-auto shadow-2xs transition"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Project Detail Modal (Zero Action Buttons) */}
      <GovProjectDetailModal
        problem={selectedProblem}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};
