import React, { useEffect, useState } from 'react';
import { CitizenFeedback } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { collabxApi } from '../../services/collabxApi';
import { Star, CheckCircle2, X, Camera, Send } from 'lucide-react';

interface CitizenFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  projectId?: string;
  locality?: string;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  projectId = 'PROJ-JH-2024-001',
  locality = 'Harmu Bypass, Ward 14, Ranchi',
}) => {
  const { currentUser } = useAuth();
  const { t } = useAccessibility();

  const [solvedStatus, setSolvedStatus] = useState<'YES' | 'PARTIALLY' | 'NO'>('YES');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState(
    'For the first time in 7 years, yesterday heavy downpour cleared out in just 1.5 hours! The road in front of our house and the primary school remained completely passable.'
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncPending = async () => {
      if (!navigator.onLine) return;
      for (const pending of storageService.getPendingFeedback()) {
        try {
          await collabxApi.submitFeedback(pending.projectId, {
            id: pending.id,
            rating: pending.rating,
            comments: pending.comment,
            solved_status: pending.solvedStatus,
            locality: pending.locality,
            photo_proof_url: pending.photoProofUrl || undefined,
          });
          storageService.removePendingFeedback(pending.id);
        } catch {
          return;
        }
      }
    };
    void syncPending();
    window.addEventListener('online', syncPending);
    return () => window.removeEventListener('online', syncPending);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newFeedback: CitizenFeedback = {
      id: `fb-${Date.now()}`,
      projectId,
      citizenName: currentUser.name,
      locality,
      solvedStatus,
      rating,
      comment,
      photoProofUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      submittedAt: new Date().toISOString(),
    };

    try {
      await collabxApi.submitFeedback(projectId, {
        id: newFeedback.id,
        rating,
        comments: comment,
        solved_status: solvedStatus,
        locality,
        photo_proof_url: newFeedback.photoProofUrl,
      });
    } catch {
      storageService.savePendingFeedback(newFeedback);
    }
    storageService.saveFeedback(newFeedback);

    // Audit log
    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Citizen',
      action: 'SUBMIT_PILOT_FEEDBACK',
      targetEntity: projectId,
      details: `Citizen submitted post-pilot rating: ${rating}/5 stars (${solvedStatus}).`,
      ipHash: '10.42.12.8 [Citizen Portal]',
    });

    // Notify government
    storageService.addNotification({
      id: `notif-${Date.now()}`,
      title: 'New Citizen Pilot Feedback Received',
      message: `${currentUser.name} rated the Harmu pilot ${rating}/5 stars: "Cleared in 1.5 hours".`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      targetRole: 'government',
    });

    setIsSuccess(true);
    setIsSubmitting(false);
    setTimeout(() => {
      setIsSuccess(false);
      onSubmitted();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
      <div className="bg-white rounded-lg border border-gov-border shadow-gov-lg max-w-lg w-full p-6 space-y-5">
        <div className="border-b border-gov-border pb-3 flex items-center justify-between">
          <div>
            <span className="text-xs sm:text-sm font-bold text-gov-green uppercase tracking-wider">
              {t('Post-Pilot Community Validation', 'पायलट उपरांत सामुदायिक सत्यापन')}
            </span>
            <h3 className="text-[19px] font-semibold text-gov-navy mt-0.5">
              {t('Did this solve the problem?', 'क्या इस समाधान से समस्या का निवारण हुआ?')}
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">{locality}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-gov-green mx-auto animate-bounce" />
            <div className="text-base font-bold text-slate-900">
              {t('Feedback Recorded in Impact Registry!', 'फीडबैक प्रभाव रजिस्टर में दर्ज किया गया!')}
            </div>
            <div className="text-sm text-slate-600">
              {t('Your ground evaluation helps the Government of Jharkhand decide on statewide replication.', 'आपकी प्रतिक्रिया से राज्यव्यापी प्रतिकृति निर्णय में सहायता मिलती है।')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 3 Main Buttons: YES, PARTIALLY, NO */}
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2">
                {t('Status of Problem Resolution *', 'समस्या निवारण स्थिति *')}
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSolvedStatus('YES')}
                  className={`py-3 px-2 rounded-lg border text-center font-bold text-sm sm:text-base transition ${
                    solvedStatus === 'YES'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ✓ YES (हाँ)
                </button>

                <button
                  type="button"
                  onClick={() => setSolvedStatus('PARTIALLY')}
                  className={`py-3 px-2 rounded-lg border text-center font-bold text-sm sm:text-base transition ${
                    solvedStatus === 'PARTIALLY'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ~ PARTIALLY (आंशिक)
                </button>

                <button
                  type="button"
                  onClick={() => setSolvedStatus('NO')}
                  className={`py-3 px-2 rounded-lg border text-center font-bold text-sm sm:text-base transition ${
                    solvedStatus === 'NO'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ✕ NO (नहीं)
                </button>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-1.5">
                {t('Civic Satisfaction Rating (1 to 5 Stars) *', 'संतुष्टि रेटिंग (1 से 5 स्टार) *')}
              </label>
              <div className="flex items-center space-x-1.5 py-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 font-bold text-slate-700 text-base">{rating} / 5 Stars</span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-1.5">
                {t('Ground Observation & Resident Comments *', 'जमीनी अवलोकन एवं टिप्पणी *')}
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full p-3 text-base text-slate-900 border border-slate-300 rounded-md focus:border-gov-blue focus:ring-1 focus:ring-gov-blue leading-relaxed"
              ></textarea>
            </div>

            {/* Photo Proof Simulation */}
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-slate-700">
                <Camera className="w-4 h-4 text-gov-blue" />
                <span>Photo Proof: <span className="font-semibold">Harmu_dry_road_post_pilot.jpg</span></span>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded">
                Verified Clear
              </span>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 font-medium hover:bg-slate-100 text-sm sm:text-base"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gov-navy hover:bg-gov-navy-dark text-white font-bold rounded-md flex items-center space-x-2 text-sm sm:text-base shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? t('Saving...', 'सहेजा जा रहा है...') : t('Submit Validation', 'सत्यापन जमा करें')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
