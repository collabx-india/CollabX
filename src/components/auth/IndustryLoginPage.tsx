import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, AlertCircle, ArrowLeft } from 'lucide-react';
import { OtpInput } from './OtpInput';
import { DemoOtpNotice } from './DemoOtpNotice';
import { collabxApi } from '../../services/collabxApi';

export const IndustryLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [workEmail, setWorkEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isProfessionalEmail = (emailStr: string): boolean => {
    const lower = emailStr.toLowerCase().trim();
    if (/@(gmail|yahoo|hotmail|outlook|live|icloud|rediffmail)\./i.test(lower)) {
      return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(digitsOnly);
    if (error) setError('');
  };

  const validateInputs = (): boolean => {
    setError('');

    if (!workEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (!isProfessionalEmail(workEmail)) {
      setError('Corporate Email Required: Please enter your professional company email address.');
      return false;
    }

    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return false;
    }

    if (!companyName.trim()) {
      setError('Please enter your Company / Organization Name.');
      return false;
    }

    if (!designation.trim()) {
      setError('Please enter your Designation.');
      return false;
    }

    if (otpSent && otp.length !== 6) {
      setError('Please enter the complete 6-digit verification OTP.');
      return false;
    }

    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const response = await collabxApi.requestOtp(workEmail, 'industry', companyName);
      setChallengeId(response.challenge_id);
      setIsSubmitting(false);
      setOtpSent(true);
      setOtp('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send OTP.');
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const response = await collabxApi.verifyOtp(challengeId, otp);
      await login(response.access_token);
      navigate('/industry');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify OTP.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center max-w-md mx-auto w-full">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-2 text-center mb-6">
        <h1 className="gov-h1 text-slate-900 tracking-tight leading-tight flex items-center justify-center gap-2">
          <Briefcase className="w-7 h-7 text-gov-navy shrink-0" />
          <span>Industry Login</span>
        </h1>
        <p className="gov-body text-slate-600">
          Sign in to collaborate, mentor, and sponsor university civic innovations
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 shadow-sm rounded-xl border border-slate-200 space-y-6">
        {error && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={otpSent ? handleLogin : handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="corporate-email" className="gov-label text-slate-800 block mb-1.5">
              Corporate Work Email
            </label>
            <input
              id="corporate-email"
              type="email"
              placeholder="name@company.com"
              value={workEmail}
              onChange={e => {
                setWorkEmail(e.target.value);
                if (error) setError('');
              }}
              disabled={otpSent}
              className="w-full p-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-gov-blue transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="company-name" className="gov-label text-slate-800 block mb-1.5">
                Company Name
              </label>
              <input
                id="company-name"
                type="text"
                placeholder="Company Name"
                value={companyName}
                onChange={e => {
                  setCompanyName(e.target.value);
                  if (error) setError('');
                }}
                disabled={otpSent}
                className="w-full p-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-gov-blue transition"
              />
            </div>

            <div>
              <label htmlFor="designation" className="gov-label text-slate-800 block mb-1.5">
                Designation
              </label>
              <input
                id="designation"
                type="text"
                placeholder="Designation"
                value={designation}
                onChange={e => {
                  setDesignation(e.target.value);
                  if (error) setError('');
                }}
                disabled={otpSent}
                className="w-full p-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-gov-blue transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="industry-mobile" className="gov-label text-slate-800 block mb-1.5">
              Mobile Number
            </label>
            <div className="relative flex rounded-lg shadow-xs">
              <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-700 text-sm font-mono font-bold">
                +91
              </span>
              <input
                id="industry-mobile"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="9876543210"
                value={mobileNumber}
                onChange={handleMobileChange}
                disabled={otpSent}
                className="flex-1 min-w-0 block w-full p-3 text-base border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-gov-blue focus:border-gov-blue font-mono transition"
              />
            </div>
          </div>

          {otpSent && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <p className="text-sm text-center font-medium text-slate-700">
                OTP sent to your registered work email.
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-lg shadow-xs gov-btn font-bold text-white bg-gov-navy hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-blue transition disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Processing...' : otpSent ? 'Verify OTP' : 'Send OTP'}
          </button>
        </form>

        <div className="pt-2 text-center text-sm sm:text-base text-slate-600">
          New to CollabX?{' '}
          <button
            type="button"
            onClick={() => navigate('/register?role=industry')}
            className="font-bold text-gov-blue hover:underline focus:outline-none"
          >
            Register
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to account type
          </Link>
        </div>
      </div>
    </div>
  );
};

