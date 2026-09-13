import React, { useState } from 'react';
import { ProblemReport, IdeaProposal } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  CheckCircle2,
  ArrowLeft,
  Building,
  Check
} from 'lucide-react';

const createNotificationId = () => `notif-${Date.now()}`;

interface SolutionEvaluationViewProps {
  problem: ProblemReport;
  onBack: () => void;
  onUpdated?: () => void;
}

export const SolutionEvaluationView: React.FC<SolutionEvaluationViewProps> = ({
  problem,
  onBack,
  onUpdated
}) => {
  const { currentUser } = useAuth();

  const [ideas, setIdeas] = useState<IdeaProposal[]>(() => storageService.getIdeas());
  const [currentProblem, setCurrentProblem] = useState<ProblemReport>(problem);

  // Proposals submitted for this specific problem (or matching challengeId)
  const problemProposals = ideas.filter(i =>
    i.problemId === currentProblem.id || i.challengeId === currentProblem.challengeId || i.challengeId === `CH-${currentProblem.id}`
  );

  const selectedSolution = problemProposals.find(i =>
    i.id === currentProblem.selectedSolutionId || i.status === 'selected'
  );

  const handleSelectSolution = (solution: IdeaProposal) => {
    storageService.selectSolutionForProblem(currentProblem.id, solution.id);

    // Audit log
    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Government Officer',
      action: 'SELECT_BEST_SOLUTION',
      targetEntity: currentProblem.id,
      details: `Selected solution "${solution.title}" by ${solution.university} (${solution.teamName}).`,
      ipHash: '10.24.18.99 [GovNet Jharkhand]',
    });

    // Notify University team
    storageService.addNotification({
      id: createNotificationId(),
      title: 'Your Solution Proposal Was Selected by State Expert!',
      message: `State Nodal Officer ${currentUser.name} has selected Team ${solution.teamName}'s proposal (${solution.university}).`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      targetRole: 'professor',
    });

    const updatedProblems = storageService.getProblems();
    const updated = updatedProblems.find(p => p.id === currentProblem.id) || currentProblem;
    setCurrentProblem(updated);
    setIdeas(storageService.getIdeas());
    if (onUpdated) onUpdated();
  };

  const handleRequestIndustrySupport = () => {
    if (!selectedSolution) {
      alert('Please select a solution first before requesting industry support.');
      return;
    }

    const updated = { ...currentProblem, status: 'industry_support' as const };
    storageService.saveProblem(updated);
    setCurrentProblem(updated);

    // Audit log
    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Government Officer',
      action: 'REQUEST_INDUSTRY_SUPPORT',
      targetEntity: currentProblem.id,
      details: `Requested industry CSR & technical support for selected solution "${selectedSolution.title}".`,
      ipHash: '10.24.18.99 [GovNet Jharkhand]',
    });

    // Notify Industry Partners
    storageService.addNotification({
      id: createNotificationId(),
      title: 'New Government-Selected Solution Seeking Industry Support',
      message: `Urban Development Dept is seeking CSR and technical support for ${selectedSolution.university}'s selected solution for ${currentProblem.id}.`,
      type: 'gov',
      timestamp: 'Just now',
      read: false,
      targetRole: 'industry',
    });

    alert('Selected solution successfully exposed to Industry Portal for support offers!');
    if (onUpdated) onUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-lg border border-gov-border shadow-gov">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm sm:text-base font-semibold text-slate-700 hover:text-gov-navy bg-slate-100 px-4 py-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification Queue</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <span className="gov-id bg-gov-blue-50 text-gov-blue px-2.5 py-1 rounded">
            {currentProblem.id}
          </span>
          <span className="gov-badge uppercase text-gov-navy bg-blue-100 px-3 py-1 rounded-md border border-blue-300">
            {currentProblem.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Problem & Selection Status Card */}
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 sm:p-6 space-y-4">
        <h2 className="gov-h2 text-gov-navy leading-tight">{currentProblem.title}</h2>
        <p className="gov-body text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">
          {currentProblem.description}
        </p>

        {selectedSolution ? (
          <div className="p-4 sm:p-5 bg-emerald-50 rounded-lg border border-emerald-300 space-y-2.5 text-sm sm:text-base">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-base sm:text-lg flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>SOLUTION SELECTED: {selectedSolution.title}</span>
              </span>
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-md font-bold text-xs uppercase">
                SOLUTION_SELECTED
              </span>
            </div>
            <div className="text-slate-700">
              Submitting Institution: <strong className="text-slate-900">{selectedSolution.university}</strong> | Team: <strong className="text-slate-900">{selectedSolution.teamName}</strong> (Mentor: {selectedSolution.mentorProfessorName})
            </div>
            <div className="pt-3 flex items-center justify-between border-t border-emerald-200">
              <span className="text-emerald-800 text-xs sm:text-sm">
                {currentProblem.status === 'industry_support'
                  ? 'Exposed to Industry Portal — Awaiting Support Offers'
                  : 'Ready to request industry CSR & technical support'}
              </span>
              {currentProblem.status !== 'industry_support' && (
                <button
                  onClick={handleRequestIndustrySupport}
                  className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white rounded-lg font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition"
                >
                  <Building className="w-4 h-4 text-gov-saffron-amber" />
                  <span>Request Industry Support →</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 text-sm sm:text-base">
            <strong>Evaluation Pending:</strong> Review submitted university proposals below and click <strong>[ Select Best Solution ]</strong>.
          </div>
        )}
      </div>

      {/* Submitted University Proposals List */}
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 sm:p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="gov-h3 text-gov-navy leading-snug flex items-center space-x-2.5">
              <FileText className="w-5 h-5 text-gov-blue shrink-0" />
              <span>Submitted University Proposals ({problemProposals.length})</span>
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Review technical proposals with full institution and team identification.
            </p>
          </div>
        </div>

        {problemProposals.length === 0 ? (
          <div className="py-8 text-center text-sm sm:text-base text-slate-500">
            No solution proposals submitted for this problem yet. Referred universities are currently reviewing.
          </div>
        ) : (
          <div className="space-y-4">
            {problemProposals.map(idea => {
              const isSelected = currentProblem.selectedSolutionId === idea.id || idea.status === 'selected';

              return (
                <div
                  key={idea.id}
                  className={`p-5 sm:p-6 rounded-lg border space-y-3.5 transition text-sm sm:text-base ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="gov-id text-slate-600">{idea.id}</span>
                      <strong className="text-gov-navy text-sm sm:text-base font-bold">{idea.university}</strong>
                      <span className="text-slate-500 text-xs sm:text-sm">({idea.teamName})</span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md gov-badge uppercase ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-100 text-gov-blue'
                      }`}
                    >
                      {isSelected ? 'SELECTED SOLUTION' : 'UNDER EVALUATION'}
                    </span>
                  </div>

                  <h4 className="gov-h3 text-slate-900">{idea.title}</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <span className="gov-label text-slate-700 block uppercase">Lead Researcher & Email:</span>
                      <span className="text-slate-900 text-sm sm:text-base">{idea.leadStudentName} ({idea.leadStudentEmail})</span>
                    </div>
                    <div>
                      <span className="gov-label text-slate-700 block uppercase">Mentor Faculty:</span>
                      <span className="text-slate-900 text-sm sm:text-base">{idea.mentorProfessorName} ({idea.mentorProfessorDepartment})</span>
                    </div>
                  </div>

                  <div>
                    <span className="gov-label text-slate-700 block uppercase mb-1">Proposed Technical Solution:</span>
                    <p className="text-slate-800 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200 text-sm sm:text-base">
                      {idea.proposedSolution}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-5 text-slate-600 text-xs sm:text-sm">
                    <span>Estimated Budget: <strong className="text-slate-900 font-mono text-sm sm:text-base">₹{idea.estimatedCost.toLocaleString()}</strong></span>
                    <span>AI Suitability Score: <strong className="text-gov-navy font-mono text-sm sm:text-base">{idea.aiScores.compositeScore} / 100</strong></span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    {isSelected ? (
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-lg text-xs sm:text-sm flex items-center space-x-1.5">
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Solution Selected</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSelectSolution(idea)}
                        className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-sm transition"
                      >
                        <Check className="w-4 h-4 text-gov-saffron-amber" />
                        <span>Select Best Solution</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
