import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { storageService } from '../../services/storageService';
import { Challenge } from '../../types';
import { IdeaComparisonMatrix } from './IdeaComparisonMatrix';
import { 
  Shield, 
  Layers, 
  BarChart3, 
  CheckCircle2, 
  History
} from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';

export const ExpertDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useAccessibility();
  const location = useLocation();
  const navigate = useNavigate();

  const [challenges] = useState<Challenge[]>(() => storageService.getChallenges());

  const getTabFromPath = (): 'challenges' | 'compare' | 'audit' => {
    if (location.pathname.endsWith('/reviews')) return 'challenges';
    if (location.pathname.endsWith('/compare')) return 'compare';
    if (location.pathname.endsWith('/decisions')) return 'audit';
    return 'compare';
  };

  const activeTab = getTabFromPath();

  const handleTabChange = (_tab: 'challenges' | 'compare' | 'audit', path: string) => {
    navigate(path);
  };
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(challenges[0]);
  const [auditLogs] = useState(() => storageService.getAuditLogs());

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-lg border-2 border-purple-200 shadow-gov p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="gov-badge px-2.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 uppercase">
                Restricted Portal • Domain Expert
              </span>
              <span className="gov-id text-slate-600">ID: EXP-JH-8812</span>
            </div>
            <h2 className="gov-h2 text-gov-navy mt-0.5">
              {currentUser.name}
            </h2>
            <p className="gov-body text-slate-600">
              {currentUser.title} • {currentUser.organization}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="gov-badge px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Authorized Decision Maker</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-1.5 flex flex-wrap gap-1">
        <button
          onClick={() => handleTabChange('compare', '/expert/compare')}
          className={`py-2 px-3 sm:px-4 rounded text-xs sm:text-sm font-bold flex items-center space-x-2 transition ${
            activeTab === 'compare'
              ? 'bg-purple-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t('Idea Comparison Matrix', 'विचार तुलना मैट्रिक्स')}</span>
        </button>

        <button
          onClick={() => handleTabChange('challenges', '/expert/reviews')}
          className={`py-2 px-3 sm:px-4 rounded text-xs sm:text-sm font-bold flex items-center space-x-2 transition ${
            activeTab === 'challenges'
              ? 'bg-purple-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('Assigned Challenges', 'आवंटित चुनौतियाँ')}</span>
          <span className="ml-1 px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded-full text-xs font-bold">
            {challenges.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('audit', '/expert/decisions')}
          className={`py-2 px-3 sm:px-4 rounded text-xs sm:text-sm font-bold flex items-center space-x-2 transition ${
            activeTab === 'audit'
              ? 'bg-purple-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t('Decision Trail & Logs', 'निर्णय ऑडिट ट्रेल')}</span>
        </button>
      </div>

      {/* Tab 1: Idea Comparison Matrix */}
      {activeTab === 'compare' && (
        <IdeaComparisonMatrix
          initialChallengeId={selectedChallenge?.id}
        />
      )}

      {/* Tab 2: Assigned Challenges */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map(c => (
              <div
                key={c.id}
                className="bg-white rounded-lg border-2 border-slate-200 hover:border-purple-600 shadow-gov p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="gov-id bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {c.id}
                    </span>
                    <span className="gov-badge px-2 py-0.5 rounded bg-blue-100 text-gov-blue">
                      {c.supportStatus}
                    </span>
                  </div>

                  <h4 className="gov-h3 text-gov-navy">{c.title}</h4>
                  <p className="gov-body text-slate-600 line-clamp-2">{c.summary}</p>

                  <div className="text-xs sm:text-sm text-slate-500 flex items-center justify-between pt-1">
                    <span>District: {c.district}</span>
                    <span className="font-bold text-purple-900">{c.proposalsCount} Proposals Submitted</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedChallenge(c);
                      navigate('/expert/compare');
                    }}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition"
                  >
                    <span>Evaluate & Compare Ideas →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Decision Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="gov-h3 text-gov-navy">
              Tamper-Evident Expert & Government Action Trail
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Cryptographically timestamped record of official evaluations, endorsements, and project selections.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="gov-badge font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="font-bold text-gov-navy">{log.actorName}</span>
                    <span className="text-slate-500 text-xs">({log.actorRole})</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700">{log.details}</p>
                <div className="text-xs text-slate-400 font-mono">
                  Network IP / Hash: {log.ipHash} • Entity: {log.targetEntity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
