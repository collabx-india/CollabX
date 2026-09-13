import React, { useState } from 'react';
import { ReplicationCandidate } from '../../types';
import { storageService } from '../../services/storageService';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  Sparkles, 
  MapPin, 
  Users, 
  Copy
} from 'lucide-react';

export const ReplicationEngine: React.FC = () => {
  const { t } = useAccessibility();
  const [candidates, setCandidates] = useState<ReplicationCandidate[]>(() => storageService.getReplications());
  const [dossierCandidate, setDossierCandidate] = useState<ReplicationCandidate | null>(null);

  const handleConsiderReplication = (cand: ReplicationCandidate) => {
    const updatedCand: ReplicationCandidate = { ...cand, status: 'under_consideration' };
    storageService.saveReplication(updatedCand);
    setCandidates([...storageService.getReplications()]);
    setDossierCandidate(updatedCand);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-gov-border shadow-gov space-y-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-gov-saffron" />
          <h2 className="text-lg font-bold text-gov-navy">
            {t('Statewide Solution Replication Engine', 'राज्यव्यापी समाधान प्रतिकृति इंजन')}
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
          {t(
            'Following the successful Harmu pilot (81.25% waterlogging reduction), our GovTech matching engine identified 12 vulnerable flood hotspots across Jharkhand exhibiting identical culvert bottleneck and topographical surge profiles.',
            'हर्मू पायलट की सफलता के उपरांत राज्य के अन्य 12 जलभराव हॉटस्पॉट पर इस समाधान की प्रतिकृति की अनुशंसा की गई है।'
          )}
        </p>
      </div>

      {/* Replication Hotspots Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map(cand => (
          <div
            key={cand.id}
            className="bg-white rounded-lg border-2 border-slate-200 hover:border-gov-navy shadow-gov p-4 flex flex-col justify-between space-y-3 transition"
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                  {cand.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded font-bold uppercase text-xs ${
                    cand.priority === 'Critical'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {cand.priority}
                </span>
              </div>

              <h3 className="text-sm font-bold text-gov-navy">{cand.hotspotName}</h3>

              <div className="flex items-center space-x-1 text-slate-600 text-xs">
                <MapPin className="w-3.5 h-3.5 text-gov-saffron" />
                <span>District: <span className="font-bold text-slate-700">{cand.district}</span></span>
              </div>

              {/* Similarity Bar */}
              <div className="p-2.5 bg-blue-50/70 rounded border border-blue-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-gov-navy text-xs">
                  <span>Hydraulic Problem Match:</span>
                  <span className="font-mono text-xs text-gov-blue">{cand.similarityPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gov-blue h-full rounded-full"
                    style={{ width: `${cand.similarityPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-slate-600">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Potential Beneficiaries: <span className="font-bold font-mono">{cand.estimatedBeneficiaries.toLocaleString()} residents</span></span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => handleConsiderReplication(cand)}
                className={`w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  cand.status === 'under_consideration'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-gov-navy hover:bg-gov-navy-dark text-white shadow-sm'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {cand.status === 'under_consideration'
                    ? 'Under Municipal Consideration ✓'
                    : 'Consider Replication →'}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Replication Dossier Modal */}
      {dossierCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="bg-white rounded-lg border border-gov-border shadow-gov-lg max-w-lg w-full p-6 space-y-4">
            <div className="border-b border-gov-border pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gov-green uppercase tracking-wider block">
                  Automated Replication Blueprint
                </span>
                <h3 className="text-base font-bold text-gov-navy">
                  Replication Dossier Generated
                </h3>
              </div>
              <button onClick={() => setDossierCandidate(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="font-bold text-gov-navy text-sm">{dossierCandidate.hotspotName}</div>
                <div className="text-slate-500">{dossierCandidate.district} Municipal Corporation</div>
              </div>

              <p>
                The certified engineering blueprint from the <span className="font-bold">Harmu Pilot (BIT Mesra + Tata Steel)</span> has been packaged with hydraulic formulas, BOM cost matrices (₹3.85 Lakh target), and LoRaWAN sensor specs.
              </p>

              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 font-medium">
                Recommendation: Transmit blueprint to {dossierCandidate.district} Urban Local Body (ULB) for fast-track adaptation under the State Disaster Resilience Fund.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setDossierCandidate(null)}
                className="px-4 py-2 bg-gov-navy text-white text-xs font-bold rounded hover:bg-gov-navy-dark"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
