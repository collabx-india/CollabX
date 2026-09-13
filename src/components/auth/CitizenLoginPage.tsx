import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Phone, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { OtpInput } from './OtpInput';
import { DemoOtpNotice } from './DemoOtpNotice';
import { collabxApi } from '../../services/collabxApi';

export const CitizenLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [authMode, setAuthMode] = useState<'mobile' | 'email'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mobile input handlers - strictly restrict input to digits 0-9
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(digitsOnly);
    if (error) setError('');
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navigation and control keys
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }

    // Block non-numeric key press
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleMobileBeforeInput = (e: React.SyntheticEvent<HTMLInputElement> & { data?: string }) => {
    if (e.data && !/^[0-9]+$/.test(e.data)) {
      e.preventDefault();
    }
  };

  const handleMobilePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(digitsOnly);
    if (error) setError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Standard email characters: letters, numbers, @, ., _, -
    const sanitized = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '');
    setEmail(sanitized);
    if (error) setError('');
  };

  const validateInputs = (): boolean => {
    setError('');

    if (!otpSent) {
      if (authMode === 'mobile') {
        if (!mobileNumber) {
          setError('Please enter your 10-digit mobile number.');
          return false;
        }
        if (mobileNumber.length < 10) {
          setError('Please enter a complete 10-digit mobile number.');
          return false;
        }
        if (!/^[6-9]/.test(mobileNumber)) {
          setError('Indian mobile number must start with 6, 7, 8, or 9.');
          return false;
        }
        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
          setError('Please enter a valid 10-digit Indian mobile number.');
          return false;
        }
      } else {
        if (!email) {
          setError('Please enter your email address.');
          return false;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          setError('Please enter a valid email address.');
          return false;
        }
      }
    } else {
      if (otp.length !== 6) {
        setError('Please enter the complete 6-digit OTP.');
        return false;
      }
    }

    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const identifier = authMode === 'mobile' ? mobileNumber : email;
      const response = await collabxApi.requestOtp(identifier, 'citizen');
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
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const response = await collabxApi.verifyOtp(challengeId, otp);
      await login(response.access_token);
      navigate('/citizen');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify OTP.');
      setIsSubmitting(false);
    }
  };

  const handleEditContact = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center max-w-md mx-auto w-full">
      {/* Clean Portal Header */}
      <div className="text-center space-y-2 mb-6">
        <h1 className="gov-h2 text-slate-900 tracking-tight">
          Citizen Login
        </h1>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white p-6 sm:p-8 shadow-sm rounded-xl border border-slate-200 space-y-6">
        {!otpSent ? (
          <>
            {/* Tab Selector: Mobile vs Email */}
            <div className="flex bg-slate-100 p-1 rounded-lg text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('mobile');
                  setError('');
                }}
                className={`flex-1 py-2 text-center rounded-md transition ${
                  authMode === 'mobile'
                    ? 'bg-white text-gov-navy shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-4 h-4 inline mr-1.5" />
                Mobile Number
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email');
                  setError('');
                }}
                className={`flex-1 py-2 text-center rounded-md transition ${
                  authMode === 'email'
                    ? 'bg-white text-gov-navy shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-1.5" />
                Email
              </button>
            </div>

            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-xs sm:text-sm text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-5">
              {authMode === 'mobile' ? (
                <div>
                  <label htmlFor="mobile-input" className="gov-label text-slate-700 block mb-1">
                    Mobile Number
                  </label>
                  <div className="relative flex rounded-md shadow-xs">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-700 text-sm font-mono font-bold">
                      +91
                    </span>
                    <input
                      id="mobile-input"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="9876543210"
                      value={mobileNumber}
                      onChange={handleMobileChange}
                      onKeyDown={handleMobileKeyDown}
                      onBeforeInput={handleMobileBeforeInput as any}
                      onPaste={handleMobilePaste}
                      required
                      className="flex-1 min-w-0 block w-full px-3 py-2 text-base border border-slate-300 rounded-r-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="email-input" className="gov-label text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <div className="relative rounded-md shadow-xs">
                    <input
                      id="email-input"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={handleEmailChange}
                      required
                      className="block w-full px-3 py-2 text-base border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-md shadow-xs font-bold text-white bg-gov-navy hover:bg-slate-800 gov-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-blue transition disabled:opacity-50"
              >
                {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          /* OTP Screen */
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-slate-700">
                {authMode === 'mobile'
                  ? 'OTP sent to your registered mobile number.'
                  : 'OTP sent to your registered email address.'}
              </p>
              <button
                type="button"
                onClick={handleEditContact}
                className="text-xs sm:text-sm font-semibold text-gov-blue hover:underline"
              >
                Change {authMode === 'mobile' ? 'Mobile Number' : 'Email'}
              </button>
            </div>

            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-xs sm:text-sm text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="gov-label text-slate-700 block text-center mb-2">
                  Enter 6-Digit OTP
                </label>
                <OtpInput
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (error) setError('');
                  }}
                  length={6}
                  disabled={isSubmitting}
                />
              </div>

              <DemoOtpNotice />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-md shadow-xs font-bold text-white bg-gov-navy hover:bg-slate-800 gov-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-blue transition disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </div>
        )}

        {/* Registration Prompt */}
        <div className="pt-2 text-center text-sm text-slate-600">
          New to CollabX?{' '}
          <button
            type="button"
            onClick={() => navigate('/register?role=citizen')}
            className="font-bold text-gov-blue hover:underline focus:outline-none"
          >
            Register
          </button>
        </div>

        {/* Clear, subtle back link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to account type
          </Link>
        </div>
      </div>
    </div>
  );
};

