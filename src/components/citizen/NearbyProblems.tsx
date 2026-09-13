import React, { useState } from 'react';
import { ProblemReport } from '../../types';
import { storageService } from '../../services/storageService';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  MapPin, 
  Users, 
  ThumbsUp, 
  PlusCircle, 
  Eye, 
  CheckCircle2, 
  Search, 
  Check, 
  Camera
} from 'lucide-react';

interface NearbyProblemsProps {
  onViewDetails?: (problem: ProblemReport) => void;
}

export const NearbyProblems: React.FC<NearbyProblemsProps> = ({ onViewDetails }) => {
  const [problems, setProblems] = useState<ProblemReport[]>(() => storageService.getProblems());
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [evidenceModalProblem, setEvidenceModalProblem] = useState<ProblemReport | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useAccessibility();

  // Filter problems by nearby or district
  const nearbyProblems = problems.filter(p => 
    p.district.toLowerCase().includes('ranchi') ||
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.panchayatOrLocality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFaceThisToo = (id: string) => {
    if (confirmedIds.includes(id)) return;

    const target = problems.find(p => p.id === id);
    if (target) {
      target.communityConfirmations += 1;
      storageService.saveProblem(target);
      setConfirmedIds(prev => [...prev, id]);
      setProblems([...storageService.getProblems()]);
    }
  };

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceModalProblem) return;

    evidenceModalProblem.evidenceUrls.push('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80');
    storageService.saveProblem(evidenceModalProblem);
    setEvidenceSubmitted(true);
    setTimeout(() => {
      setEvidenceModalProblem(null);
      setEvidenceSubmitted(false);
      setEvidenceText('');
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="bg-white p-5 rounded-lg border border-gov-border shadow-gov flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[23px] font-bold text-gov-navy flex items-center space-x-2 leading-tight">
            <MapPin className="w-6 h-6 text-gov-saffron" />
            <span>{t('Problems Near Me (Ranchi District)', 'मेरे आस-पास की समस्याएं (राँची जिला)')}</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            {t('Community endorsements increase verification priority for government inspection.', 'सामुदायिक पुष्टि से सत्यापन प्राथमिकता बढ़ती है।')}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t('Filter by ward or street...', 'वार्ड या स्थान खोजें...')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-sm sm:text-base border border-slate-300 rounded-md focus:border-gov-blue focus:ring-1 focus:ring-gov-blue text-slate-900 bg-white"
          />
        </div>
      </div>

      {/* Problems Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nearbyProblems.map((prob, idx) => {
          const isConfirmed = confirmedIds.includes(prob.id);
          const distanceKm = (0.8 + idx * 0.6).toFixed(1);

          return (
            <div
              key={prob.id}
              className="bg-white rounded-lg border border-gov-border hover:border-slate-400 shadow-gov p-5 flex flex-col justify-between space-y-4 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded text-sm sm:text-[15px] font-bold border border-slate-200">
                    {prob.id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm text-slate-500 font-medium">📍 {distanceKm} km away</span>
                    <span
                      className={`text-xs sm:text-sm px-2.5 py-0.5 rounded font-bold uppercase ${
                        prob.aiAnalysis.priority === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {prob.aiAnalysis.priority}
                    </span>
                  </div>
                </div>

                <h3 className="text-[19px] font-semibold text-slate-900 line-clamp-2 leading-snug">{prob.title}</h3>

                <p className="text-base text-slate-600 line-clamp-2 leading-relaxed">
                  {prob.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 pt-1">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{prob.panchayatOrLocality}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>~{prob.affectedPopulation.toLocaleString()} affected</span>
                  </span>
                </div>

                {/* Community Confirmation Bar */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    <span className="font-bold text-gov-navy">{prob.communityConfirmations}</span> residents confirmed this
                  </span>
                  <span className="text-xs sm:text-sm text-gov-green font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confidence High</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleFaceThisToo(prob.id)}
                  disabled={isConfirmed}
                  className={`px-3.5 py-2 rounded text-sm font-semibold flex items-center space-x-1.5 transition ${
                    isConfirmed
                      ? 'bg-emerald-100 text-emerald-800 cursor-default'
                      : 'bg-slate-100 hover:bg-gov-saffron hover:text-white text-slate-700'
                  }`}
                >
                  {isConfirmed ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>{t('Confirmed by you', 'आपने पुष्टि की')}</span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      <span>{t('I face this too', 'मुझे भी यह समस्या है')}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEvidenceModalProblem(prob)}
                    className="px-3 py-2 text-sm text-slate-700 hover:text-gov-navy border border-slate-300 rounded hover:bg-slate-50 flex items-center space-x-1.5 font-medium"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{t('Add Evidence', 'साक्ष्य जोड़ें')}</span>
                  </button>

                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(prob)}
                      className="px-3.5 py-2 text-sm bg-gov-navy hover:bg-gov-navy-dark text-white rounded flex items-center space-x-1.5 font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t('View', 'देखें')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Evidence Modal */}
      {evidenceModalProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="bg-white rounded-lg border border-gov-border shadow-gov-lg max-w-md w-full p-6 space-y-4">
            <div className="border-b border-gov-border pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[19px] font-semibold text-gov-navy">Add Evidence to Grievance</h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  <span className="font-mono font-bold text-slate-700">{evidenceModalProblem.id}</span> • {evidenceModalProblem.panchayatOrLocality}
                </p>
              </div>
              <button
                onClick={() => setEvidenceModalProblem(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {evidenceSubmitted ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-gov-green mx-auto" />
                <div className="text-base font-bold text-slate-900">Evidence Uploaded Successfully!</div>
                <div className="text-sm text-slate-600">Your supplementary proof has been appended to the official grievance dossier.</div>
              </div>
            ) : (
              <form onSubmit={handleAddEvidence} className="space-y-4">
                <div>
                  <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-1.5">
                    Describe Additional Impact / Water Depth
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Water reached 2 feet inside our driveway at 4 PM yesterday during rainfall..."
                    value={evidenceText}
                    onChange={e => setEvidenceText(e.target.value)}
                    className="w-full p-3 text-base text-slate-900 border border-slate-300 rounded-md focus:border-gov-blue focus:ring-1 focus:ring-gov-blue"
                  ></textarea>
                </div>

                <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-md flex items-center justify-center space-x-2 text-sm text-slate-700">
                  <Camera className="w-5 h-5 text-gov-blue" />
                  <span>Photo simulation attached: "Harmu_depth_evidence_aug26.jpg"</span>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEvidenceModalProblem(null)}
                    className="px-4 py-2 text-sm sm:text-base text-slate-700 hover:bg-slate-100 rounded-md font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm sm:text-base bg-gov-navy text-white font-semibold rounded-md hover:bg-gov-navy-dark shadow-sm"
                  >
                    Submit Proof
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
