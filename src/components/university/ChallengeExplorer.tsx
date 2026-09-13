import React, { useState } from 'react';
import { Challenge, IdeaProposal } from '../../types';
import { storageService } from '../../services/storageService';
import { IdeaSubmissionModal } from './IdeaSubmissionModal';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  Target, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Search, 
  ChevronRight
} from 'lucide-react';

interface ChallengeExplorerProps {
  onIdeaSubmitted?: (idea: IdeaProposal) => void;
  onSelectChallengeForProject?: (challengeId: string) => void;
}

export const ChallengeExplorer: React.FC<ChallengeExplorerProps> = ({
  onIdeaSubmitted,
  onSelectChallengeForProject,
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>(() => storageService.getChallenges());
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useAccessibility();

  const filteredChallenges = challenges.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.district.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === 'ranchi') return matchesSearch && c.district.toLowerCase().includes('ranchi');
    if (activeFilter === 'funding') return matchesSearch && c.supportStatus === 'Confirmed Funding';
    if (activeFilter === 'support') return matchesSearch && c.supportStatus === 'Support Available';
    return matchesSearch;
  });

  const handleOpenSubmit = (c: Challenge) => {
    setSelectedChallenge(c);
    setIsSubmitModalOpen(true);
  };

  const handleIdeaCreated = (newIdea: IdeaProposal) => {
    setChallenges(storageService.getChallenges());
    if (onIdeaSubmitted) onIdeaSubmitted(newIdea);
  };

  const getSupportBadgeStyle = (status: string) => {
    switch (status) {
      case 'Confirmed Funding':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300';
      case 'Support Available':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'Not Allocated':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-md border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-gov-navy" />
              <h2 className="gov-h2 text-gov-navy">
                {t('State Public Challenges Directory', 'राज्य स्तरीय सार्वजनिक चुनौतियां')}
              </h2>
            </div>
            <p className="gov-body text-slate-600 mt-0.5">
              {t(
                'Verified civic problem statements open for university research proposals and technical contributions.',
                'विश्वविद्यालय शोध प्रस्तावों के लिए खुली नागरिक समस्याएं।'
              )}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('Search challenges...', 'चुनौतियाँ खोजें...')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-gov-navy"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 text-xs sm:text-sm rounded border transition ${
              activeFilter === 'all'
                ? 'bg-gov-navy text-white border-gov-navy font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {t('All Challenges', 'सभी चुनौतियाँ')}
          </button>
          <button
            onClick={() => setActiveFilter('ranchi')}
            className={`px-3 py-1 text-xs sm:text-sm rounded border transition ${
              activeFilter === 'ranchi'
                ? 'bg-gov-navy text-white border-gov-navy font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Ranchi District
          </button>
          <button
            onClick={() => setActiveFilter('funding')}
            className={`px-3 py-1 text-xs sm:text-sm rounded border transition ${
              activeFilter === 'funding'
                ? 'bg-gov-navy text-white border-gov-navy font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Confirmed Funding
          </button>
          <button
            onClick={() => setActiveFilter('support')}
            className={`px-3 py-1 text-xs sm:text-sm rounded border transition ${
              activeFilter === 'support'
                ? 'bg-gov-navy text-white border-gov-navy font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Support Available
          </button>
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="space-y-4">
        {filteredChallenges.map(challenge => (
          <div
            key={challenge.id}
            className="bg-white rounded-md border border-slate-200 p-5 space-y-4"
          >
            {/* Top Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <span className="gov-id bg-slate-100 text-gov-navy px-2.5 py-0.5 rounded border border-slate-200">
                  {challenge.id}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-600">
                  Category: {challenge.domain}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`gov-badge px-2 py-0.5 rounded border font-semibold ${getSupportBadgeStyle(challenge.supportStatus)}`}>
                  {challenge.supportStatus}
                </span>

                <span className="text-xs sm:text-sm text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Deadline: {challenge.deadline}</span>
                </span>
              </div>
            </div>

            {/* Title & Summary */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h3 className="gov-h3 text-gov-navy">
                  {challenge.title}
                </h3>
                <span className="gov-id bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex-shrink-0">
                  {challenge.district}
                </span>
              </div>
              <p className="gov-body text-slate-700 leading-relaxed">
                {challenge.summary}
              </p>
            </div>

            {/* Expected Outcomes & Required Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200 text-sm">
              <div>
                <span className="gov-label text-slate-800 uppercase tracking-wider block mb-1">
                  Expected Technical Outcome:
                </span>
                <ul className="space-y-1 text-slate-600">
                  {challenge.expectedOutcomes.slice(0, 2).map((outcome, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="gov-label text-slate-800 uppercase tracking-wider block mb-1">
                  Required Expertise Disciplines:
                </span>
                <div className="flex flex-wrap gap-1">
                  {challenge.skillsRequired.map(s => (
                    <span key={s} className="gov-badge px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pilot Opportunity */}
            <div className="text-xs sm:text-sm text-slate-600 flex items-center space-x-2">
              <span className="font-bold text-gov-navy">Field Testing Scope:</span>
              <span>{challenge.pilotOpportunity}</span>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs sm:text-sm text-slate-500 font-medium">
                Submitted Proposals: <span className="font-bold text-gov-navy">{challenge.proposalsCount} University Teams</span>
              </div>

              <div className="flex items-center space-x-2">
                {challenge.selectedIdeaId && onSelectChallengeForProject && (
                  <button
                    onClick={() => onSelectChallengeForProject(challenge.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gov-navy rounded text-xs sm:text-sm font-semibold flex items-center space-x-1 border border-slate-300"
                  >
                    <span>View Project Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleOpenSubmit(challenge)}
                  className="px-4 py-1.5 bg-gov-navy hover:bg-slate-800 text-white rounded text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('Submit Proposal', 'प्रस्ताव जमा करें')}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Proposal Submission Modal */}
      {selectedChallenge && (
        <IdeaSubmissionModal
          challenge={selectedChallenge}
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSubmitted={handleIdeaCreated}
        />
      )}
    </div>
  );
};
