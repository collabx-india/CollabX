import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { OtpInput } from './OtpInput';
import { DemoOtpNotice } from './DemoOtpNotice';
import { collabxApi } from '../../services/collabxApi';

interface InstitutionProfile {
  name: string;
  representative: string;
  email: string;
  phone: string;
}

const INSTITUTIONS: InstitutionProfile[] = [
  {
    name: 'Birla Institute of Technology (BIT) Mesra',
    representative: 'University Representative',
    email: 'demo@bitmesra.ac.in',
    phone: '+91 98765 43210',
  },
  {
    name: 'IIT (ISM) Dhanbad',
    representative: 'University Representative',
    email: 'demo@iitism.ac.in',
    phone: '+91 98765 43210',
  },
  {
    name: 'National Institute of Technology (NIT) Jamshedpur',
    representative: 'University Representative',
    email: 'demo@nitjsr.ac.in',
    phone: '+91 98765 43210',
  },
];

export const UniversityLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [selectedInstitutionName, setSelectedInstitutionName] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [challengeId, setChallengeId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedProfile = INSTITUTIONS.find((inst) => inst.name === selectedInstitutionName);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedInstitutionName || !selectedProfile) {
      setError('Please select your institution to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await collabxApi.requestOtp(
        selectedProfile.email,
        'professor',
        selectedProfile.representative
      );
      setChallengeId(response.challenge_id);
      setIsSubmitting(false);
      setOtpSent(true);
      setOtp('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send OTP.');
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await collabxApi.verifyOtp(challengeId, otp);
      await login(response.access_token);
      navigate('/university');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify OTP.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[75vh] bg-slate-50">
      {/* Header Branding */}
      <div className="text-center space-y-1 mb-6 max-w-md w-full">
        <div className="text-xs font-bold text-gov-navy uppercase tracking-widest">COLLABX</div>
        <div className="text-xs sm:text-sm text-slate-500 font-medium">Collaborative Civic Innovation</div>
        <h1 className="gov-h1 text-slate-900 tracking-tight leading-tight pt-2">
          UNIVERSITY LOGIN
        </h1>
        <p className="gov-body text-slate-600 mt-1">
          Access your institution's civic workspace
        </p>
      </div>

      {/* Main Government Portal Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm w-full max-w-md space-y-5">
        {error && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
          {/* Institution Dropdown */}
          <div>
            <label htmlFor="institution-select" className="gov-label text-slate-800 block mb-1.5">
              Institution
            </label>
            <div className="relative">
              <select
                id="institution-select"
                value={selectedInstitutionName}
                onChange={(e) => {
                  setSelectedInstitutionName(e.target.value);
                  if (error) setError('');
                }}
                disabled={otpSent || isSubmitting}
                className="w-full p-3 text-base border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-blue focus:border-gov-blue disabled:bg-slate-100 font-medium cursor-pointer transition"
              >
                <option value="">🎓 Select your institution</option>
                {INSTITUTIONS.map((inst) => (
                  <option key={inst.name} value={inst.name}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Representative Name (Read-only / Disabled) */}
          <div>
            <label htmlFor="representative-name" className="gov-label text-slate-800 block mb-1.5">
              Representative Name
            </label>
            <input
              id="representative-name"
              type="text"
              readOnly
              disabled
              value={selectedProfile ? selectedProfile.representative : ''}
              placeholder="University Representative"
              className="w-full p-3 text-base border border-slate-300 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed font-medium"
            />
          </div>

          {/* Email (Read-only / Disabled) */}
          <div>
            <label htmlFor="university-email" className="gov-label text-slate-800 block mb-1.5">
              Email
            </label>
            <input
              id="university-email"
              type="email"
              readOnly
              disabled
              value={selectedProfile ? selectedProfile.email : ''}
              placeholder="demo@iitism.ac.in"
              className="w-full p-3 text-base border border-slate-300 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed font-mono"
            />
          </div>

          {/* Phone Number (Read-only / Disabled) */}
          <div>
            <label htmlFor="university-phone" className="gov-label text-slate-800 block mb-1.5">
              Phone Number
            </label>
            <input
              id="university-phone"
              type="text"
              readOnly
              disabled
              value={selectedProfile ? selectedProfile.phone : ''}
              placeholder="+91 98765 43210"
              className="w-full p-3 text-base border border-slate-300 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed font-mono"
            />
          </div>

          {/* OTP Input Step */}
          {otpSent && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <p className="text-sm text-center font-semibold text-slate-800">
                OTP sent to {selectedProfile?.email}
              </p>
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (error) setError('');
                }}
                length={6}
                disabled={isSubmitting}
              />
              <DemoOtpNotice />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!otpSent && !selectedInstitutionName)}
            className="w-full py-3 px-4 rounded-lg gov-btn font-bold text-white bg-gov-navy hover:bg-slate-800 focus:outline-none transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              'Processing...'
            ) : otpSent ? (
              'Verify OTP →'
            ) : (
              'Continue →'
            )}
          </button>
        </form>

        {/* Demo Access Note */}
        <div className="pt-2 text-center text-xs sm:text-sm text-slate-500 font-medium flex items-center justify-center gap-1.5">
          <Lock className="w-4 h-4 text-slate-400" />
          <span>Demo access • OTP verification</span>
        </div>
      </div>

      {/* Back Link */}
      <div className="mt-5 text-center">
        <Link
          to="/login"
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-gov-navy transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Login
        </Link>
      </div>
    </div>
  );
};
