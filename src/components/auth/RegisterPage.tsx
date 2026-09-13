import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { collabxApi } from '../../services/collabxApi';
import { UserRole } from '../../types';
import { Users, GraduationCap, Briefcase, Shield, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

type AccountTypeCategory = 'citizen' | 'university' | 'industry' | 'government';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read initial role category from query param if provided
  const queryRole = searchParams.get('role');
  const initialCategory: AccountTypeCategory =
    queryRole === 'university' ? 'university' :
    queryRole === 'industry' ? 'industry' :
    queryRole === 'government' ? 'government' : 'citizen';

  const [category, setCategory] = useState<AccountTypeCategory>(initialCategory);

  // Sub-roles
  const [academicRole, setAcademicRole] = useState<'student' | 'professor'>('student');
  const [restrictedRole, setRestrictedRole] = useState<'government' | 'expert'>('government');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [district, setDistrict] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredData, setRegisteredData] = useState<{ name: string; identifier: string; role: UserRole } | null>(null);

  const selectCategory = (cat: AccountTypeCategory) => {
    setCategory(cat);
    if (error) setError('');
  };

  const selectAcademicRole = (role: 'student' | 'professor') => {
    setAcademicRole(role);
    if (error) setError('');
  };

  const selectRestrictedRole = (role: 'government' | 'expert') => {
    setRestrictedRole(role);
    if (error) setError('');
  };

  // Mobile number input handler - digits only, max 10
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(digitsOnly);
    if (error) setError('');
  };

  const getEffectiveRole = (): UserRole => {
    if (category === 'citizen') return 'citizen';
    if (category === 'university') return academicRole;
    if (category === 'industry') return 'industry';
    return restrictedRole;
  };

  const getLoginRoute = (targetCategory: AccountTypeCategory): string => {
    switch (targetCategory) {
      case 'citizen': return '/login/citizen';
      case 'university': return '/login/university';
      case 'industry': return '/login/industry';
      case 'government': return '/login/government';
    }
  };

  const validateForm = (): boolean => {
    setError('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return false;
    }

    if (category === 'citizen') {
      if (!mobileNumber) {
        setError('Please enter your 10-digit mobile number.');
        return false;
      }
      if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
        setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
        return false;
      }
    } else if (category === 'university') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
      const lowerEmail = email.toLowerCase().trim();
      const isInst = lowerEmail.endsWith('.ac.in') || lowerEmail.endsWith('.edu') || lowerEmail.endsWith('.edu.in') || /@[a-z0-9-]+\.(ac|edu)\.[a-z]{2,3}$/i.test(lowerEmail);
      if (!isInst) {
        setError('Please use an official institutional email ending in .ac.in or .edu.');
        return false;
      }
      if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
        setError('Please enter a valid 10-digit mobile number.');
        return false;
      }
    } else if (category === 'industry') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (/@(gmail|yahoo|hotmail|outlook|live|icloud|rediffmail)\./i.test(email.trim())) {
        setError('Please enter your official corporate/work email address.');
        return false;
      }
      if (!organization.trim()) {
        setError('Please enter your Company / Organisation Name.');
        return false;
      }
      if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
        setError('Please enter a valid 10-digit mobile number.');
        return false;
      }
    } else if (category === 'government') {
      if (!email.trim()) {
        setError('Please enter your official Government ID or work email address.');
        return false;
      }
      if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
        setError('Please enter a valid 10-digit mobile number.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const role = getEffectiveRole();

    // For Citizen, identifier MUST be mobile number so login via OTP matches User.email
    // For other roles, identifier is email (or Govt ID string)
    const primaryIdentifier = category === 'citizen' ? mobileNumber.trim() : email.trim();

    // Construct name with optional organization info if provided
    let displayName = fullName.trim();
    if (organization.trim()) {
      displayName += ` (${organization.trim()})`;
    }

    try {
      await collabxApi.registerUser(displayName, primaryIdentifier, role);
      setIsSubmitting(false);
      setIsRegistered(true);
      setRegisteredData({
        name: displayName,
        identifier: primaryIdentifier,
        role: role,
      });
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to complete registration. Please try again.');
      }
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans">
          Create your CollabX account
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Official Government of Jharkhand Collaboration Portal
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 shadow-sm rounded-xl border border-slate-200 space-y-6">
        {isRegistered && registeredData ? (
          /* Successful Registration State */
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Registration Successful</h2>
              <p className="text-xs text-slate-600">
                Your account has been created and saved in the database.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Name:</span>
                <span className="font-bold text-slate-900">{registeredData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Login Identifier:</span>
                <span className="font-mono font-bold text-slate-900">{registeredData.identifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Account Role:</span>
                <span className="font-bold text-gov-navy uppercase tracking-wider text-[11px]">{registeredData.role}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate(getLoginRoute(category))}
                className="w-full py-3 px-4 rounded-md shadow-xs text-xs font-bold text-white bg-gov-navy hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-blue transition"
              >
                Continue to Login →
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <>
            {/* Account Type Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Account Type *
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => selectCategory('citizen')}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 transition ${
                    category === 'citizen'
                      ? 'bg-blue-50/80 border-gov-blue text-gov-navy font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4 text-gov-blue flex-shrink-0" />
                  <span>Citizen</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectCategory('university')}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 transition ${
                    category === 'university'
                      ? 'bg-blue-50/80 border-gov-blue text-gov-navy font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-gov-blue flex-shrink-0" />
                  <span className="truncate">University / Research</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectCategory('industry')}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 transition ${
                    category === 'industry'
                      ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="truncate">Industry / Organisation</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectCategory('government')}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 transition ${
                    category === 'government'
                      ? 'bg-amber-50/80 border-amber-500 text-amber-950 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span className="truncate">Government / Expert</span>
                </button>
              </div>
            </div>

            {/* Sub-Role Selector for University */}
            {category === 'university' && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Academic Role *
                </label>
                <div className="flex space-x-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => selectAcademicRole('student')}
                    className={`flex-1 py-1.5 rounded text-center transition ${
                      academicRole === 'student'
                        ? 'bg-white text-gov-navy shadow-xs border border-slate-300 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Student Innovator (`student`)
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAcademicRole('professor')}
                    className={`flex-1 py-1.5 rounded text-center transition ${
                      academicRole === 'professor'
                        ? 'bg-white text-gov-navy shadow-xs border border-slate-300 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Faculty Advisor (`professor`)
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Role Selector for Government / Expert */}
            {category === 'government' && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Statutory Role *
                </label>
                <div className="flex space-x-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => selectRestrictedRole('government')}
                    className={`flex-1 py-1.5 rounded text-center transition ${
                      restrictedRole === 'government'
                        ? 'bg-amber-100 text-amber-950 shadow-xs border border-amber-300 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Government Officer (`government`)
                  </button>
                  <button
                    type="button"
                    onClick={() => selectRestrictedRole('expert')}
                    className={`flex-1 py-1.5 rounded text-center transition ${
                      restrictedRole === 'expert'
                        ? 'bg-purple-100 text-purple-950 shadow-xs border border-purple-300 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Domain Expert (`expert`)
                  </button>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue"
                />
              </div>

              {/* Citizen specific inputs */}
              {category === 'citizen' && (
                <>
                  <div>
                    <label htmlFor="reg-mobile" className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number (OTP Login Identifier) *
                    </label>
                    <div className="relative flex rounded-md shadow-xs">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-mono font-medium">
                        +91
                      </span>
                      <input
                        id="reg-mobile"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="9876543210"
                        value={mobileNumber}
                        onChange={handleMobileChange}
                        required
                        className="flex-1 min-w-0 block w-full px-3 py-2 text-sm border border-slate-300 rounded-r-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-district" className="block text-xs font-semibold text-slate-700 mb-1">
                      District / Location (Optional)
                    </label>
                    <input
                      id="reg-district"
                      type="text"
                      placeholder="e.g. Ranchi, Jharkhand"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue"
                    />
                  </div>
                </>
              )}

              {/* University specific inputs */}
              {category === 'university' && (
                <>
                  <div>
                    <label htmlFor="reg-inst-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      Institutional Email (.ac.in / .edu) *
                    </label>
                    <input
                      id="reg-inst-email"
                      type="email"
                      placeholder={academicRole === 'student' ? 'student@bitmesra.ac.in' : 'faculty@bitmesra.ac.in'}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-uni-mobile" className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative flex rounded-md shadow-xs">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-mono font-medium">
                        +91
                      </span>
                      <input
                        id="reg-uni-mobile"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="9876543210"
                        value={mobileNumber}
                        onChange={handleMobileChange}
                        required
                        className="flex-1 min-w-0 block w-full px-3 py-2 text-sm border border-slate-300 rounded-r-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-org" className="block text-xs font-semibold text-slate-700 mb-1">
                      University / Institution Name (Optional)
                    </label>
                    <input
                      id="reg-org"
                      type="text"
                      placeholder="e.g. BIT Mesra"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue"
                    />
                  </div>
                </>
              )}

              {/* Industry specific inputs */}
              {category === 'industry' && (
                <>
                  <div>
                    <label htmlFor="reg-work-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      Corporate Work Email *
                    </label>
                    <input
                      id="reg-work-email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-company" className="block text-xs font-semibold text-slate-700 mb-1">
                        Company Name *
                      </label>
                      <input
                        id="reg-company"
                        type="text"
                        placeholder="Company Name"
                        value={organization}
                        onChange={(e) => {
                          setOrganization(e.target.value);
                          if (error) setError('');
                        }}
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-desig" className="block text-xs font-semibold text-slate-700 mb-1">
                        Designation (Optional)
                      </label>
                      <input
                        id="reg-desig"
                        type="text"
                        placeholder="Designation"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-ind-mobile" className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative flex rounded-md shadow-xs">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-mono font-medium">
                        +91
                      </span>
                      <input
                        id="reg-ind-mobile"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="9876543210"
                        value={mobileNumber}
                        onChange={handleMobileChange}
                        required
                        className="flex-1 min-w-0 block w-full px-3 py-2 text-sm border border-slate-300 rounded-r-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Government / Expert specific inputs */}
              {category === 'government' && (
                <>
                  <div>
                    <label htmlFor="reg-gov-id" className="block text-xs font-semibold text-slate-700 mb-1">
                      {restrictedRole === 'government' ? 'Official Govt Service ID / Work Email *' : 'Empanelled Expert ID / Work Email *'}
                    </label>
                    <input
                      id="reg-gov-id"
                      type="text"
                      placeholder={restrictedRole === 'government' ? 'JH-IAS-2014-882' : 'EXP-HYD-9912'}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-gov-mobile" className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative flex rounded-md shadow-xs">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-mono font-medium">
                        +91
                      </span>
                      <input
                        id="reg-gov-mobile"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="9876543210"
                        value={mobileNumber}
                        onChange={handleMobileChange}
                        required
                        className="flex-1 min-w-0 block w-full px-3 py-2 text-sm border border-slate-300 rounded-r-md focus:ring-2 focus:ring-gov-blue focus:border-gov-blue font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-md shadow-xs text-xs font-bold text-white bg-gov-navy hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-blue transition disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          </>
        )}

        {/* Login Prompt */}
        <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
          Already have an account?{' '}
          <Link
            to={getLoginRoute(category)}
            className="font-bold text-gov-blue hover:underline focus:outline-none"
          >
            Login
          </Link>
        </div>

        {/* Back Link */}
        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to account selection
          </Link>
        </div>
      </div>
    </div>
  );
};
