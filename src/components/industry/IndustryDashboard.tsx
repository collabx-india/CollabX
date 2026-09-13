import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { storageService } from '../../services/storageService';
import { ProblemReport, CollaborationOffer, IndustrySupportOffer } from '../../types';
import {
  Building,
  CheckCircle2,
  Send,
  X,
  Sparkles,
  Briefcase
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const INDUSTRY_SUPPORT_OPTIONS = [
  'Mentorship',
  'Funding / CSR',
  'Hardware',
  'Testing',
  'Pilot Support',
  'Deployment Support'
];

interface OfferSupportModalProps {
  problem: ProblemReport;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const OfferSupportModal: React.FC<OfferSupportModalProps> = ({
  problem,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const { currentUser } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['Funding / CSR', 'Hardware']);
  const [notes, setNotes] = useState('Committed to sponsoring industrial-grade sensor kits and pilot testing facilities under CSR initiative.');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleOption = (opt: string) => {
    if (selectedOptions.includes(opt)) {
      if (selectedOptions.length > 1) {
        setSelectedOptions(selectedOptions.filter(o => o !== opt));
      }
    } else {
      setSelectedOptions([...selectedOptions, opt]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const companyName = currentUser.organization || 'Tata Steel GovTech CSR';

    const offer: CollaborationOffer = {
      id: `collab-${Date.now()}`,
      projectId: problem.id,
      challengeId: problem.id,
      industryId: currentUser.id || 'ind-01',
      industryName: companyName,
      supportTypes: selectedOptions as any,
      description: notes,
      status: 'accepted',
      supportStatus: 'Confirmed Funding',
      requestedAt: new Date().toISOString(),
      respondedAt: new Date().toISOString(),
    };

    storageService.saveCollaboration(offer);

    const supportOffer: IndustrySupportOffer = {
      id: `offer-${Date.now()}`,
      problemId: problem.id,
      industryName: companyName,
      supportTypes: selectedOptions as any,
      description: notes,
      status: 'accepted',
      requestedAt: new Date().toISOString(),
    };

    // Update problem's industry partner and advance to industry_collaboration if in solution development
    const isAdvancing = problem.status === 'solution_development' || problem.status === 'team_formed';
    const updatedProblem: ProblemReport = {
      ...problem,
      industryPartnerName: companyName,
      ...(isAdvancing
        ? {
            status: 'industry_collaboration',
            currentMilestoneTitle: 'Industry Co-Creation & Prototyping',
            nextMilestoneTitle: 'Field Prototype Bench Testing',
            progressPercentage: 62,
          }
        : {}),
      industrySupportOffers: [...(problem.industrySupportOffers || []), supportOffer],
    };
    storageService.saveProblem(updatedProblem);

    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Industry Partner',
      action: 'OFFER_INDUSTRY_SUPPORT',
      targetEntity: problem.id,
      details: `${companyName} offered [${selectedOptions.join(', ')}] for problem #${problem.id}: ${notes}`,
      ipHash: '172.16.8.54 [Industry CSR Gateway]',
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSubmitted();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-300 max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div>
            <span className="text-xs sm:text-sm font-bold text-gov-navy uppercase tracking-wider block">
              Corporate & Industry Partnership
            </span>
            <h3 className="text-[19px] font-semibold text-gov-navy mt-1">
              Offer Support to University Project
            </h3>
            <p className="text-sm text-slate-600 line-clamp-1 mt-0.5">{problem.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="text-base font-bold text-slate-900">Support Offered Successfully</div>
            <p className="text-sm text-slate-600">The university research team has been partnered with your organization.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2">
                Support Options (Select all that apply) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {INDUSTRY_SUPPORT_OPTIONS.map(opt => {
                  const isSelected = selectedOptions.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleOption(opt)}
                      className={`p-3 rounded-md border text-center font-bold text-sm sm:text-base transition ${
                        isSelected
                          ? 'bg-gov-navy text-white border-gov-navy shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-1.5">
                Support Contribution Description *
              </label>
              <textarea
                required
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-md text-base leading-relaxed focus:border-gov-blue text-slate-900 bg-white"
              ></textarea>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 space-y-1">
              <div>• University: <strong>{problem.matchedUniversity}</strong></div>
              <div>• Department: <strong>{problem.matchedDepartment}</strong></div>
              <div>• Research Team: <strong>{problem.teamName || 'University Engineering Team'}</strong></div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 font-semibold text-sm sm:text-base hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gov-navy hover:bg-slate-800 text-white font-bold rounded-md flex items-center space-x-2 text-sm sm:text-base shadow-xs"
              >
                <Send className="w-4 h-4 text-gov-saffron-amber" />
                <span>Confirm Support Commitment</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const IndustryDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useAccessibility();
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    if (location.pathname.endsWith('/collaborations')) return 'collaborations';
    if (location.pathname.endsWith('/projects') || location.pathname.endsWith('/discover')) return 'discover';
    return 'dashboard';
  };

  const activeTab = getTabFromPath();
  const [problems, setProblems] = useState<ProblemReport[]>(() => storageService.getProblems());

  const handleTabChange = (_tab: string, path: string) => {
    navigate(path);
  };

  const [selectedProblemForSupport, setSelectedProblemForSupport] = useState<ProblemReport | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);

  // Discoverable Projects: projects adopted by universities seeking industry partnership
  const discoverableProjects = problems.filter(p => 
    ['university_adopted', 'team_formed', 'solution_development', 'prototype', 'pilot'].includes(p.status)
  );

  // Active Collaborations: problems where this industry is already partnered or collaborations submitted
  const orgName = currentUser.organization || 'Tata Steel GovTech CSR';
  const myCollaborations = problems.filter(p => 
    p.industryPartnerName?.toLowerCase().includes(orgName.toLowerCase()) ||
    (p.industrySupportOffers && p.industrySupportOffers.length > 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-md border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-300 text-gov-navy flex items-center justify-center font-bold shadow-xs">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <span className="gov-label text-gov-navy uppercase tracking-wider block">
                Government of Jharkhand • Corporate & Industry Partnership Portal
              </span>
              <h1 className="gov-h1 mt-0.5">
                {t('Industry & Organisation Portal', 'उद्योग एवं संगठन पोर्टल')}
              </h1>
              <p className="gov-body text-slate-600 mt-1">
                Partner with university research teams: provide mentorship, CSR funding, hardware sensors, and testing support.
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="font-bold text-slate-900 block text-base">{orgName}</span>
            <div className="gov-helper font-mono mt-0.5">CSR ID: CSR-JH-2024 • Active Partner</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Strictly 3 Items) */}
      <nav className="bg-white rounded-md border border-slate-200 p-1.5 flex flex-wrap gap-1.5" aria-label="Industry Navigation">
        <button
          onClick={() => handleTabChange('dashboard', '/industry')}
          className={`py-2.5 px-4 sm:px-5 rounded-md gov-button flex items-center space-x-2 transition ${
            activeTab === 'dashboard'
              ? 'bg-gov-navy text-white font-bold'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{t('Dashboard', 'डैशबोर्ड')}</span>
        </button>

        <button
          onClick={() => handleTabChange('discover', '/industry/projects')}
          className={`py-2.5 px-4 sm:px-5 rounded-md gov-button flex items-center space-x-2 transition ${
            activeTab === 'discover'
              ? 'bg-gov-navy text-white font-bold'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-gov-saffron-amber" />
          <span>{t('Discover Projects', 'सक्रिय अनुसंधान परियोजनाएं')}</span>
          {discoverableProjects.length > 0 && (
            <span className="ml-1.5 px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-300">
              {discoverableProjects.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('collaborations', '/industry/collaborations')}
          className={`py-2.5 px-4 sm:px-5 rounded-md gov-button flex items-center space-x-2 transition ${
            activeTab === 'collaborations'
              ? 'bg-gov-navy text-white font-bold'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <span>{t('My Collaborations', 'मेरे सहयोग')}</span>
          {myCollaborations.length > 0 && (
            <span className="ml-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold border border-emerald-300">
              {myCollaborations.length}
            </span>
          )}
        </button>
      </nav>

      {/* ==================================================== */}
      {/* TAB 1: DASHBOARD                                    */}
      {/* ==================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-md border border-slate-200">
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Projects Seeking Support</div>
              <div className="text-3xl font-bold text-gov-navy mt-1.5">{discoverableProjects.length}</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Active research teams</div>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200">
              <div className="text-xs sm:text-sm font-bold text-emerald-700 uppercase tracking-wider">Active Collaborations</div>
              <div className="text-3xl font-bold text-emerald-800 mt-1.5">{myCollaborations.length}</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Supported by your company</div>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200">
              <div className="text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wider">Contributing Types</div>
              <div className="text-3xl font-bold text-blue-900 mt-1.5">6 Areas</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Hardware, CSR, Mentorship, Testing</div>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200">
              <div className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wider">Live Pilots</div>
              <div className="text-3xl font-bold text-amber-800 mt-1.5">
                {problems.filter(p => p.status === 'pilot' || p.status === 'implementation').length}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">In Jharkhand field trial</div>
            </div>
          </div>

          {/* Quick Discover View */}
          <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="gov-h2">Featured Projects Seeking Industry Support</h2>
                <p className="gov-body text-slate-600 mt-1">University engineering teams ready for testing, hardware, or CSR backing.</p>
              </div>
              <button
                onClick={() => handleTabChange('discover', '/industry/projects')}
                className="gov-button text-gov-navy hover:underline"
              >
                Browse All Projects →
              </button>
            </div>

            <div className="space-y-3.5">
              {discoverableProjects.slice(0, 3).map(proj => (
                <div key={proj.id} className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="gov-id font-bold text-gov-navy bg-white px-2.5 py-1 rounded border border-slate-200">{proj.id}</span>
                    <span className="gov-badge bg-blue-100 text-gov-navy">
                      Stage: {proj.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="gov-h3 leading-snug">{proj.title}</h3>
                  <p className="gov-body text-slate-700 line-clamp-2">{proj.description}</p>
                  <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-slate-600 font-semibold">{proj.matchedUniversity} • {proj.matchedDepartment}</span>
                    <button
                      onClick={() => {
                        setSelectedProblemForSupport(proj);
                        setIsSupportModalOpen(true);
                      }}
                      className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white rounded-md gov-button transition shadow-xs"
                    >
                      Offer Support →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: DISCOVER PROJECTS                             */}
      {/* ==================================================== */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-md border border-slate-200">
            <h2 className="gov-h2">Discover University Projects ({discoverableProjects.length})</h2>
            <p className="gov-body text-slate-600 mt-1">
              Review active technical solutions developed by university teams. Select any project to offer mentorship, hardware, testing facilities, or CSR sponsorship.
            </p>
          </div>

          <div className="space-y-4">
            {discoverableProjects.map(proj => (
              <div key={proj.id} className="bg-white rounded-md border border-slate-200 p-5 sm:p-6 space-y-3.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 text-sm">
                  <div className="flex items-center space-x-2.5">
                    <span className="gov-id font-bold bg-slate-100 text-gov-navy px-2.5 py-1 rounded border border-slate-200">
                      {proj.id}
                    </span>
                    <span className="gov-badge bg-blue-100 text-gov-navy">
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-slate-600 text-xs sm:text-sm">
                    District: <strong className="text-slate-900">{proj.district}</strong>
                  </span>
                </div>

                <div>
                  <h3 className="gov-h3 leading-snug">{proj.title}</h3>
                  <p className="gov-body text-slate-700 mt-1.5">{proj.description}</p>
                </div>

                {/* Team & University Info */}
                <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-bold block">Institution & Dept</span>
                    <strong className="text-slate-900 block mt-0.5 text-sm sm:text-base">{proj.matchedUniversity}</strong>
                    <span className="text-slate-600 text-xs sm:text-sm">{proj.matchedDepartment}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-bold block">Research Team</span>
                    <strong className="text-slate-900 block mt-0.5 text-sm sm:text-base">{proj.teamName || 'Engineering Taskforce'}</strong>
                    <span className="text-slate-600 text-xs sm:text-sm">Mentor: {proj.facultyMentorName || 'Faculty Chair'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-bold block">Current Milestone</span>
                    <strong className="text-slate-900 block mt-0.5 text-sm sm:text-base">{proj.currentMilestoneTitle || 'Solution Development'}</strong>
                    <span className="text-slate-600 text-xs sm:text-sm">Next: {proj.nextMilestoneTitle || 'Testing & Validation'}</span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-600 text-xs sm:text-sm font-medium">
                    {proj.industryPartnerName ? `Current Partner: ${proj.industryPartnerName}` : 'Seeking Co-Creation Partner'}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedProblemForSupport(proj);
                      setIsSupportModalOpen(true);
                    }}
                    className="px-5 py-2 bg-gov-navy hover:bg-slate-800 text-white rounded-md font-bold flex items-center space-x-2 shadow-xs transition text-sm sm:text-[15px]"
                  >
                    <Send className="w-4 h-4 text-gov-saffron-amber" />
                    <span>Offer Support</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: MY COLLABORATIONS                            */}
      {/* ==================================================== */}
      {activeTab === 'collaborations' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-md border border-slate-200">
            <h2 className="gov-h2">My Industry Collaborations ({myCollaborations.length})</h2>
            <p className="gov-body text-slate-600 mt-1">
              Projects actively supported with your organization's CSR resources, equipment, lab testing, or technical mentorship.
            </p>
          </div>

          {myCollaborations.length === 0 ? (
            <div className="bg-white p-12 text-center gov-helper rounded border border-slate-200">
              No active collaborations recorded yet. Go to <strong>Discover Projects</strong> to offer support.
            </div>
          ) : (
            <div className="space-y-4">
              {myCollaborations.map(proj => (
                <div key={proj.id} className="bg-white rounded-md border border-slate-200 p-5 sm:p-6 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm">
                    <span className="gov-id font-bold bg-slate-100 text-gov-navy px-2.5 py-1 rounded border border-slate-200">{proj.id}</span>
                    <span className="gov-badge bg-emerald-100 text-emerald-900 font-bold uppercase">
                      Stage: {proj.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="gov-h3 leading-snug">{proj.title}</h3>
                  <p className="gov-body text-slate-700">{proj.description}</p>

                  <div className="p-3.5 bg-emerald-50 rounded-md border border-emerald-200 text-sm flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-emerald-900 font-bold block text-sm sm:text-base">Support Partnership Active</span>
                      <span className="text-emerald-800 text-xs sm:text-sm">
                        University Team: {proj.matchedUniversity} ({proj.teamName || 'Engineering Team'})
                      </span>
                    </div>
                    <span className="px-3 py-1.5 bg-white text-emerald-900 border border-emerald-300 rounded-md font-semibold text-xs sm:text-sm">
                      Milestone: {proj.currentMilestoneTitle || 'Co-Creation & Prototyping'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offer Support Modal */}
      {selectedProblemForSupport && (
        <OfferSupportModal
          problem={selectedProblemForSupport}
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
          onSubmitted={() => {
            setProblems(storageService.getProblems());
            handleTabChange('collaborations', '/industry/collaborations');
          }}
        />
      )}
    </div>
  );
};
