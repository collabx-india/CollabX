import React, { useState } from 'react';
import { Challenge, SupportType, SupportStatus, CollaborationOffer } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  CheckCircle2, 
  Send
} from 'lucide-react';

interface OfferSupportModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (offer: CollaborationOffer) => void;
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

export const OfferSupportModal: React.FC<OfferSupportModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { currentUser } = useAuth();

  const [selectedTypes, setSelectedTypes] = useState<SupportType[]>(['Hardware', 'Mentorship', 'Testing Facility']);
  const [supportStatus, setSupportStatus] = useState<SupportStatus>('Confirmed Funding');
  const [description, setDescription] = useState(
    'Providing 15 Industrial IP68 Ultrasonic Depth Sensors, 4 Solar LoRaWAN Telemetry Gateways, and ₹1,50,000 prototype fabrication materials with lab flume testing in Jamshedpur.'
  );
  const [isSuccess, setIsSuccess] = useState(false);

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

    const newOffer: CollaborationOffer = {
      id: `collab-${Date.now()}`,
      projectId: 'PROJ-JH-2024-001',
      challengeId: challenge.id,
      industryId: 'ind-tata-01',
      industryName: currentUser.organization || 'Tata Steel GovTech CSR Division',
      supportTypes: selectedTypes,
      description,
      status: 'accepted',
      supportStatus,
      requestedAt: new Date().toISOString(),
      respondedAt: new Date().toISOString(),
    };

    storageService.saveCollaboration(newOffer);

    const projects = storageService.getProjects();
    if (projects[0]) {
      const updatedProject = {
        ...projects[0],
        industryPartnerName: newOffer.industryName,
        industrySupportStatus: supportStatus,
      };
      storageService.saveProject(updatedProject);
    }

    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Industry Partner',
      action: 'OFFER_INDUSTRY_SUPPORT',
      targetEntity: challenge.id,
      details: `Offered ${selectedTypes.join(', ')} with status "${supportStatus}". Description: ${description}`,
      ipHash: '172.16.8.54 [Tata Steel Intranet]',
    });

    storageService.addNotification({
      id: `notif-${Date.now()}`,
      title: 'Industry Support Offered',
      message: `${currentUser.organization} committed ${selectedTypes.join(', ')} for the Harmu Drainage pilot.`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      targetRole: 'student',
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSubmitted(newOffer);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" role="dialog" aria-labelledby="modal-title">
      <div className="bg-white rounded-md border border-slate-300 max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-md">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div>
            <span className="text-xs sm:text-sm font-bold text-gov-navy uppercase tracking-wider block">
              Corporate / Organisation Support Form
            </span>
            <h3 id="modal-title" className="text-[19px] font-semibold text-gov-navy mt-1">
              Offer Support
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mt-0.5">Challenge: <span className="font-semibold text-slate-800">{challenge.title}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <div className="text-base font-bold text-slate-900">
              Support Package Committed Successfully
            </div>
            <div className="text-sm text-slate-600">
              The research team and nodal officer have been notified of your allocated support.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Support Type Selection */}
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2">
                1. Support Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SUPPORT_TYPES.map(type => {
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`p-2.5 rounded-md border text-center text-sm font-semibold transition ${
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

            {/* Support Status Allocation */}
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2">
                2. Allocation Commitment Status *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Confirmed Funding', 'Support Available', 'Not Allocated'] as SupportStatus[]).map(status => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setSupportStatus(status)}
                    className={`py-2.5 px-2 rounded-md border text-center font-bold text-sm transition ${
                      supportStatus === status
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Resources specification */}
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-1.5">
                3. Proposed Contribution & Resource Specifications *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-3 text-base border border-slate-300 rounded-md leading-relaxed text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-gov-navy"
              ></textarea>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gov-navy hover:bg-slate-800 text-white font-bold rounded-md flex items-center space-x-2 text-sm sm:text-base shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                <span>Confirm Support Contribution</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
