import React, { useState } from 'react';
import { Challenge, IdeaProposal } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  AlertCircle, 
  BarChart3
} from 'lucide-react';

interface IdeaComparisonMatrixProps {
  challenge?: Challenge;
  initialChallengeId?: string;
  onDecisionMade?: (selectedIdeaId: string) => void;
}

export const IdeaComparisonMatrix: React.FC<IdeaComparisonMatrixProps> = ({
  challenge,
  initialChallengeId: _initialChallengeId,
  onDecisionMade,
}) => {
  const { currentUser } = useAuth();

  const [ideas] = useState<IdeaProposal[]>(() => storageService.getIdeas());
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>(ideas[0]?.id || 'IDEA-BIT-001');
  const [expertScores, setExpertScores] = useState<{ [ideaId: string]: number }>({
    'IDEA-BIT-001': 91,
    'IDEA-NIT-002': 79,
    'IDEA-IIT-003': 76,
  });
  const [expertRemarks, setExpertRemarks] = useState(
    'The BIT Mesra proposal demonstrates superior hydraulic feasibility through a passive gravitational siphon. Eliminates reliance on grid electricity during monsoon storm power outages. Recommended for Ranchi Municipal pilot deployment.'
  );
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const [decisionSubmitted, setDecisionSubmitted] = useState(false);

  // Take up to 3 ideas for comparison
  const comparisonIdeas = ideas.slice(0, 3);

  // Prepare chart dataset comparing all 6 GovTech criteria
  const chartData = [
    {
      metric: 'Feasibility',
      [comparisonIdeas[0]?.teamName || 'Team 1']: comparisonIdeas[0]?.aiScores.feasibility || 88,
      [comparisonIdeas[1]?.teamName || 'Team 2']: comparisonIdeas[1]?.aiScores.feasibility || 82,
      [comparisonIdeas[2]?.teamName || 'Team 3']: comparisonIdeas[2]?.aiScores.feasibility || 74,
    },
    {
      metric: 'Social Impact',
      [comparisonIdeas[0]?.teamName || 'Team 1']: comparisonIdeas[0]?.aiScores.socialImpact || 94,
      [comparisonIdeas[1]?.teamName || 'Team 2']: comparisonIdeas[1]?.aiScores.socialImpact || 85,
      [comparisonIdeas[2]?.teamName || 'Team 3']: comparisonIdeas[2]?.aiScores.socialImpact || 80,
    },
    {
      metric: 'Cost Efficiency',
      [comparisonIdeas[0]?.teamName || 'Team 1']: comparisonIdeas[0]?.aiScores.costEfficiency || 82,
      [comparisonIdeas[1]?.teamName || 'Team 2']: comparisonIdeas[1]?.aiScores.costEfficiency || 90,
      [comparisonIdeas[2]?.teamName || 'Team 3']: comparisonIdeas[2]?.aiScores.costEfficiency || 68,
    },
    {
      metric: 'Scalability',
      [comparisonIdeas[0]?.teamName || 'Team 1']: comparisonIdeas[0]?.aiScores.scalability || 90,
      [comparisonIdeas[1]?.teamName || 'Team 2']: comparisonIdeas[1]?.aiScores.scalability || 76,
      [comparisonIdeas[2]?.teamName || 'Team 3']: comparisonIdeas[2]?.aiScores.scalability || 84,
    },
    {
      metric: 'Sustainability',
      [comparisonIdeas[0]?.teamName || 'Team 1']: comparisonIdeas[0]?.aiScores.sustainability || 85,
      [comparisonIdeas[1]?.teamName || 'Team 2']: comparisonIdeas[1]?.aiScores.sustainability || 88,
      [comparisonIdeas[2]?.teamName || 'Team 3']: comparisonIdeas[2]?.aiScores.sustainability || 91,
    },
    {
      metric: 'Tech Suitability',
      [comparisonIdeas[0]?.teamName || 'Team 1']: comparisonIdeas[0]?.aiScores.technicalSuitability || 89,
      [comparisonIdeas[1]?.teamName || 'Team 2']: comparisonIdeas[1]?.aiScores.technicalSuitability || 79,
      [comparisonIdeas[2]?.teamName || 'Team 3']: comparisonIdeas[2]?.aiScores.technicalSuitability || 86,
    },
  ];

  const handleExecuteFinalDecision = () => {
    // 1. Update winning idea
    const winningIdea = ideas.find(i => i.id === selectedWinnerId);
    if (winningIdea) {
      const updatedWinningIdea = {
        ...winningIdea,
        status: 'selected' as const,
        expertScoreTotal: expertScores[selectedWinnerId] || 91,
        expertRemarks,
        expertEvaluatorName: `${currentUser.name} (Chief Technical Advisor)`,
      };
      storageService.saveIdea(updatedWinningIdea);
    }

    // 2. Mark other ideas as shortlisted
    ideas.forEach(i => {
      if (i.id !== selectedWinnerId) {
        const updatedIdea = {
          ...i,
          status: 'shortlisted' as const,
          expertScoreTotal: expertScores[i.id] || 78,
        };
        storageService.saveIdea(updatedIdea);
      }
    });

    // 3. Update Challenge
    if (challenge) {
      const updatedChallenge = {
        ...challenge,
        status: 'pilot_active' as const,
        selectedIdeaId: selectedWinnerId,
      };
      storageService.saveChallenge(updatedChallenge);
    }

    // 4. Audit Log
    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Domain Expert',
      action: 'SELECT_FINAL_IDEA',
      targetEntity: selectedWinnerId,
      details: `Official selection rendered. ${winningIdea?.teamName} chosen for pilot deployment with expert score ${expertScores[selectedWinnerId]}/100.`,
      ipHash: '10.24.44.12 [Expert Directorate]',
    });

    // 5. In-app notifications
    storageService.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Domain Expert Selection Finalized!',
      message: `${winningIdea?.teamName} (${winningIdea?.university}) has been selected by ${currentUser.name} for the Ranchi Live Pilot.`,
      type: 'gov',
      timestamp: 'Just now',
      read: false,
    });

    setDecisionSubmitted(true);
    if (onDecisionMade) onDecisionMade(selectedWinnerId);
  };

  return (
    <div className="space-y-6">
      {/* Official Expert Banner */}
      <div className="bg-white p-5 rounded-lg border-2 border-purple-200 shadow-gov space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-purple-700" />
            <div>
              <span className="gov-badge font-bold text-purple-800 uppercase tracking-wider">
                Restricted Domain Expert Review Matrix
              </span>
              <h2 className="gov-h2 text-gov-navy">
                Comparative Idea Evaluation & Final Award Selection
              </h2>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="font-bold text-purple-900 block">{currentUser.name}</span>
            <span className="text-xs text-slate-500">Chief Urban Hydrology & Infrastructure Advisor</span>
          </div>
        </div>

        {/* Human vs AI Safeguard Notice */}
        <div className="p-3 bg-amber-50 rounded border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">GovTech Governance Rule:</span> AI models provide deterministic decision support metrics only. The final selection, technical caveats, and project endorsement must be explicitly validated by the authorized Domain Expert.
          </div>
        </div>
      </div>

      {/* Visual Analytics Chart: Bar vs Radar */}
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <h3 className="gov-h3 text-gov-navy flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gov-blue" />
              <span>Multi-Criteria GovTech Evaluation Matrix (Side-by-Side Comparison)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Comparing top 3 university engineering proposals across 6 GovTech parameters
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded text-xs">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded font-semibold transition ${
                chartType === 'bar' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('radar')}
              className={`px-3 py-1 rounded font-semibold transition ${
                chartType === 'radar' ? 'bg-white text-gov-navy shadow-xs' : 'text-slate-600'
              }`}
            >
              Radar Map
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey={comparisonIdeas[0]?.teamName || 'Team 1'} fill="#0A2540" radius={[2, 2, 0, 0]} />
                <Bar dataKey={comparisonIdeas[1]?.teamName || 'Team 2'} fill="#E65100" radius={[2, 2, 0, 0]} />
                <Bar dataKey={comparisonIdeas[2]?.teamName || 'Team 3'} fill="#138808" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
                <Radar name={comparisonIdeas[0]?.teamName} dataKey={comparisonIdeas[0]?.teamName} stroke="#0A2540" fill="#0A2540" fillOpacity={0.4} />
                <Radar name={comparisonIdeas[1]?.teamName} dataKey={comparisonIdeas[1]?.teamName} stroke="#E65100" fill="#E65100" fillOpacity={0.3} />
                <Radar name={comparisonIdeas[2]?.teamName} dataKey={comparisonIdeas[2]?.teamName} stroke="#138808" fill="#138808" fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Side-by-Side 3 Ideas Cards with AI vs Expert Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {comparisonIdeas.map((idea, idx) => {
          const isSelected = selectedWinnerId === idea.id;

          return (
            <div
              key={idea.id}
              className={`p-5 rounded-lg border-2 transition flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/40 shadow-md ring-2 ring-purple-600/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between text-xs">
                  <span className="gov-id bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {idea.id}
                  </span>
                  <span className="text-xs font-bold text-slate-600">Option #{idx + 1}</span>
                </div>

                <div>
                  <h4 className="gov-h3 text-gov-navy">{idea.title}</h4>
                  <div className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                    {idea.university} • <span className="text-slate-700 font-bold">{idea.teamName}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {idea.proposedSolution}
                </p>

                {/* Estimated Cost */}
                <div className="text-xs sm:text-sm flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 font-mono">
                  <span className="text-slate-500">Estimated Cost:</span>
                  <span className="font-bold text-slate-900">₹{idea.estimatedCost.toLocaleString()}</span>
                </div>

                {/* AI Recommendation Score (Distinct from Expert) */}
                <div className="p-2.5 bg-blue-50/70 rounded border border-blue-200 text-xs sm:text-sm space-y-1">
                  <div className="flex items-center justify-between text-gov-navy font-bold">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-gov-saffron" />
                      <span>AI Recommendation Score:</span>
                    </span>
                    <span className="text-sm font-bold">{idea.aiScores.compositeScore} / 100</span>
                  </div>
                  <div className="text-xs text-slate-500 italic leading-tight">
                    {idea.aiScores.aiRemarks}
                  </div>
                </div>

                {/* Human Expert Scoring Field */}
                <div className="space-y-1">
                  <label className="gov-label text-purple-950 block uppercase tracking-wider">
                    Expert Score (1 to 100):
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={expertScores[idea.id] || 80}
                    onChange={e =>
                      setExpertScores({ ...expertScores, [idea.id]: Number(e.target.value) })
                    }
                    className="w-full p-2 text-sm border border-purple-300 rounded font-bold font-mono focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Selection Radio / Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedWinnerId(idea.id)}
                  className={`w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                    isSelected
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-900 border border-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selected for Pilot Award</span>
                    </>
                  ) : (
                    <span>Choose as Winner</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expert Formal Remarks & Decision Execution */}
      <div className="bg-white rounded-lg border-2 border-purple-300 shadow-gov p-5 space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-purple-700" />
          <h3 className="text-base font-bold text-gov-navy">
            Final Expert Technical Sanction & Award Decision
          </h3>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Technical Remarks & Statutory Caveats for Ranchi Municipal Implementation *
          </label>
          <textarea
            required
            rows={3}
            value={expertRemarks}
            onChange={e => setExpertRemarks(e.target.value)}
            className="w-full p-2.5 text-xs border border-slate-300 rounded focus:border-purple-600 leading-relaxed font-sans"
          ></textarea>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Selected Proposal: <span className="font-bold text-gov-navy">{ideas.find(i => i.id === selectedWinnerId)?.title}</span>
          </div>

          <button
            onClick={handleExecuteFinalDecision}
            disabled={decisionSubmitted}
            className={`px-6 py-2.5 rounded text-xs font-bold flex items-center space-x-2 shadow-sm transition ${
              decisionSubmitted
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-purple-700 hover:bg-purple-800 text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {decisionSubmitted
                ? 'Decision Officially Executed & Published ✓'
                : 'Sign & Execute Final Expert Decision →'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
