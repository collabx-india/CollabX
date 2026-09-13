import React, { useState } from 'react';
import { ProblemReport, IdeaProposal, SupportType, IndustrySupportOffer } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Send,
  Building
} from 'lucide-react';

interface SubmitSupportOfferModalProps {
  problem: ProblemReport;
  selectedSolution: IdeaProposal;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (offer: IndustrySupportOffer) => void;
}

const SUPPORT_TYPES: SupportType[] = [
  'Mentorship',
  'Hardware',
  'Software / APIs',
  'Cloud',
  'Testing Facility',
  'Funding / CSR Support',
  'Pilot Support',
  'Deployment Support'
];

export const SubmitSupportOfferModal: React.FC<SubmitSupportOfferModalProps> = ({
  problem,
  selectedSolution,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const { currentUser } = useAuth();

  const [selectedTypes, setSelectedTypes] = useState<SupportType[]>(['Hardware', 'Mentorship', 'Funding / CSR Support']);
  const [description, setDescription] = useState(
    `Providing 15 Industrial IP68 Ultrasonic Depth Sensors, 4 Solar LoRaWAN Telemetry Gateways, and ₹1,50,000 CSR material sponsorship for Team ${selectedSolution.teamName} (${selectedSolution.university}).`
  );

  if (!isOpen) return null;

  const toggleType = (type: SupportType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const offer: IndustrySupportOffer = {
      id: `SUP-${Date.now().toString().slice(-6)}`,
      problemId: problem.id,
      selectedSolutionId: selectedSolution.id,
      industryName: currentUser.organization || 'Tata Steel GovTech CSR Division',
      contactPerson: `${currentUser.name} (${currentUser.title})`,
      supportTypes: selectedTypes,
      description,
      status: 'Support Offer Submitted',
      requestedAt: new Date().toISOString(),
    };

    storageService.submitIndustrySupportOffer(problem.id, offer);

    // Audit log
    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Industry Partner',
      action: 'SUBMIT_INDUSTRY_SUPPORT_OFFER',
      targetEntity: problem.id,
      details: `Support offer submitted for selected solution "${selectedSolution.title}" (${selectedSolution.university}).`,
      ipHash: '172.16.8.54 [Tata Steel Net]',
    });

    // Notify Gov & University
    storageService.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Industry Support Offer Submitted',
      message: `${offer.industryName} submitted a support offer (${selectedTypes.join(', ')}) for ${selectedSolution.university}'s solution.`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      targetRole: 'government',
    });

    if (onSubmitted) onSubmitted(offer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-lg border border-gov-border shadow-xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gov-navy text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building className="w-6 h-6 text-gov-saffron-amber shrink-0" />
            <div>
              <h3 className="text-[19px] font-semibold text-white leading-snug">Submit Industry Support Offer</h3>
              <p className="text-sm text-slate-200 mt-0.5">
                Selected Solution: <span className="font-bold text-amber-300">{selectedSolution.title}</span> ({selectedSolution.university})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1.5 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-sm sm:text-base">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="text-[15px] font-semibold text-gov-navy">
              Target Problem: <span className="font-mono font-bold text-gov-blue">#{problem.id}</span> — {problem.title}
            </div>
            <div className="text-sm sm:text-[15px] text-slate-600">
              Selected University Team: <strong className="text-slate-900">{selectedSolution.teamName}</strong> ({selectedSolution.university})
            </div>
          </div>

          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2">
              1. Select Support Categories *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SUPPORT_TYPES.map(type => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`p-2.5 rounded-lg border text-center text-xs sm:text-sm font-semibold transition ${
                      isSelected
                        ? 'bg-gov-navy text-white border-gov-navy shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-1.5">
              2. Support Offer Description & Resource Commitments *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy transition"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-sm sm:text-base transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gov-navy hover:bg-slate-800 text-white rounded-lg font-bold text-sm sm:text-base flex items-center space-x-2 shadow-sm transition"
            >
              <Send className="w-4 h-4 text-gov-saffron-amber" />
              <span>Submit Support Offer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
