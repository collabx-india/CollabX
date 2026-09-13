import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collabxApi } from '../../services/collabxApi';
import { DemoOtpNotice } from './DemoOtpNotice';
import { Shield, Building2, Lock, AlertCircle, Key, Award } from 'lucide-react';

export const RestrictedAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [restrictedRole, setRestrictedRole] = useState<'government' | 'expert'>('government');
  const [govId, setGovId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState('');

  const handleVerifyAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!govId.trim()) {
      setError('Please enter your Official Govt Service ID / Expert Verification PIN.');
      return;
    }

    if (!otpSent && passcode) {
      setError('Leave the passcode blank until the OTP is sent.');
      return;
    }
    if (otpSent && !/^\d{6}$/.test(passcode)) {
      setError('Please enter the 6-digit verification OTP.');
      return;
    }

    setIsVerifying(true);
    const role = restrictedRole;
    try {
      if (!otpSent) {
        void collabxApi.requestOtp(govId.trim(), role).then(response => {
          setChallengeId(response.challenge_id);
          setOtpSent(true);
          setPasscode('');
          setIsVerifying(false);
        }).catch(requestError => {
          setError(requestError instanceof Error ? requestError.message : 'Unable to send OTP.');
          setIsVerifying(false);
        });
        return;
      }

      void collabxApi.verifyOtp(challengeId, passcode).then(async response => {
        await login(response.access_token);
        navigate(role === 'government' ? '/government' : '/expert');
      }).catch(verifyError => {
        setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify OTP.');
        setIsVerifying(false);
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 flex flex-col justify-center max-w-md mx-auto w-full">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-3 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gov-navy flex items-center justify-center text-white border-2 border-amber-400 shadow-md">
          <Shield className="w-9 h-9 text-amber-300" />
        </div>

        <span className="gov-badge inline-block px-3.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-full uppercase tracking-wider">
          RESTRICTED ACCESS • VERIFICATION REQUIRED
        </span>

        <h1 className="gov-h1 text-gov-navy tracking-tight leading-tight">
          Government Official Login
        </h1>
        <p className="gov-helper font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 max-w-sm mx-auto">
          Access restricted to authorized government personnel.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-gov rounded-xl border border-slate-300 space-y-6">
          {/* Role Choice */}
          <div className="space-y-1.5">
            <label className="gov-label text-slate-800 block mb-1">Select Statutory Role *</label>
            <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm font-semibold">
              <button
                type="button"
                onClick={() => setRestrictedRole('government')}
                className={`p-3.5 rounded-lg border flex flex-col items-center space-y-1.5 transition ${
                  restrictedRole === 'government'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-6 h-6 text-amber-700" />
                <span className="text-sm font-bold">Government Officer</span>
                <span className="text-xs font-normal text-slate-500">NOC & Challenge Desk</span>
              </button>

              <button
                type="button"
                onClick={() => setRestrictedRole('expert')}
                className={`p-3.5 rounded-lg border flex flex-col items-center space-y-1.5 transition ${
                  restrictedRole === 'expert'
                    ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award className="w-6 h-6 text-purple-700" />
                <span className="text-sm font-bold">Domain Expert</span>
                <span className="text-xs font-normal text-slate-500">Proposal Scoring & Decision</span>
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifyAndLogin} className="space-y-4">
            <div>
              <label htmlFor="gov-service-id" className="gov-label text-slate-800 block mb-1.5">
                {restrictedRole === 'government' ? 'Government Service ID / Employee Code *' : 'Empanelled Expert ID / National PIN *'}
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="gov-service-id"
                  type="text"
                  placeholder={restrictedRole === 'government' ? 'JH-IAS-2014-882' : 'EXP-HYD-9912'}
                  value={govId}
                  onChange={e => setGovId(e.target.value)}
                  disabled={otpSent}
                  className="w-full pl-10 pr-3 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-gov-blue font-mono transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="security-passcode" className="gov-label text-slate-800 block mb-1.5">
                Security Token / Passcode *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="security-passcode"
                  type="password"
                  placeholder={otpSent ? '123456' : 'OTP will be requested next'}
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  inputMode={otpSent ? 'numeric' : undefined}
                  maxLength={otpSent ? 6 : undefined}
                  disabled={!otpSent}
                  className="w-full pl-10 pr-3 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-gov-blue transition"
                />
              </div>
            </div>

            {otpSent && <DemoOtpNotice />}

            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-sm gov-btn font-bold text-white transition flex items-center justify-center space-x-2 ${
                restrictedRole === 'government' ? 'bg-amber-800 hover:bg-amber-900' : 'bg-purple-800 hover:bg-purple-900'
              }`}
            >
              <span>{isVerifying ? 'Authenticating Credentials...' : otpSent ? 'Verify OTP & Enter' : 'Send OTP'}</span>
            </button>
          </form>

          {/* Registration Prompt */}
          <div className="pt-2 text-center text-sm sm:text-base text-slate-600">
            New to CollabX?{' '}
            <button
              type="button"
              onClick={() => navigate('/register?role=government')}
              className="font-bold text-gov-blue hover:underline focus:outline-none"
            >
              Register
            </button>
          </div>

          {/* Back link */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center">
            <Link to="/login" className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center">
              ← Back to account type
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
