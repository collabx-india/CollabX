import React, { useState } from 'react';
import { ProblemReport, UniversityMatch } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  CheckCircle2,
  Send,
  ArrowLeft,
  Info
} from 'lucide-react';

interface UniversityMatchingViewProps {
  problem: ProblemReport;
  onBack: () => void;
  onSuccess?: () => void;
}

// Prototype / Demo matching data based on existing project institutions
const PROTOTYPE_UNIVERSITY_MATCHES: UniversityMatch[] = [
  {
    universityId: 'uni-bit-mesra',
    name: 'Birla Institute of Technology (BIT) Mesra',
    domain: 'Urban Hydrology & Civil Infrastructure',
    department: 'Civil & Environmental Engineering',
    matchScoreLabel: 'Strong Match',
    relevanceReason: 'Direct domain specialization in storm runoff mitigation, gravity siphon hydraulics, and local catchment flume testing.',
  },
  {
    universityId: 'uni-iit-dhanbad',
    name: 'IIT (ISM) Dhanbad',
    domain: 'Environmental Sensing & Robotics',
    department: 'Department of Environmental Engineering',
    matchScoreLabel: 'Relevant Expertise',
    relevanceReason: 'Active research in subterranean culvert inspection, sensor telemetry, and automated silt clearing.',
  },
  {
    universityId: 'uni-nit-jamshedpur',
    name: 'National Institute of Technology (NIT) Jamshedpur',
    domain: 'Water Resources & Soil Mechanics',
    department: 'Department of Civil Engineering',
    matchScoreLabel: 'Potential Match',
    relevanceReason: 'Specialized in bio-geotextile infiltration beds and watershed channel stabilization.',
  },
];

export const UniversityMatchingView: React.FC<UniversityMatchingViewProps> = ({
  problem,
  onBack,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>(
    () => problem.referredUniversities && problem.referredUniversities.length > 0 ? problem.referredUniversities : []
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const toggleUniversity = (name: string) => {
    if (selectedUniversities.includes(name)) {
      setSelectedUniversities(selectedUniversities.filter(u => u !== name));
    } else {
      setSelectedUniversities([...selectedUniversities, name]);
    }
  };

  const handleSendToUniversities = () => {
    if (selectedUniversities.length === 0) {
      alert('Please select at least one university institution.');
      return;
    }

    storageService.referProblemToUniversities(problem.id, selectedUniversities);

    // Add Audit Log
    storageService.addAuditLog({
      actorName: currentUser.name,
      actorRole: 'Government Officer',
      action: 'MATCH_AND_REFER_UNIVERSITIES',
      targetEntity: problem.id,
      details: `Problem officially referred to ${selectedUniversities.join(', ')}.`,
      ipHash: '10.24.18.99 [GovNet Jharkhand]',
    });

    // Add In-App Notification for University Portal
    storageService.addNotification({
      id: `notif-${Date.now()}`,
      title: 'New Civic Problem Referred to Your Institution',
      message: `Urban Development Dept has referred verified grievance ${problem.id} to your research department for solution design.`,
      type: 'gov',
      timestamp: 'Just now',
      read: false,
      targetRole: 'professor',
    });

    setIsSubmitted(true);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-lg border border-gov-border shadow-gov">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm sm:text-base font-semibold text-slate-700 hover:text-gov-navy bg-slate-100 px-4 py-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Grievances Queue</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <span className="font-mono text-sm sm:text-[15px] font-bold bg-gov-blue-50 text-gov-blue px-2.5 py-1 rounded">
            {problem.id}
          </span>
          <span className="text-xs sm:text-sm font-bold uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-md border border-emerald-300">
            Verified Problem
          </span>
        </div>
      </div>

      {/* Problem Summary Card */}
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-[23px] font-bold text-gov-navy leading-tight">{problem.title}</h2>
          <span className="text-xs sm:text-sm px-3 py-1 rounded-md bg-blue-50 text-gov-blue font-semibold border border-blue-200">
            Category: {problem.aiAnalysis.category}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
          {problem.description}
        </p>

        <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 pt-1">
          <span>District: <strong className="text-slate-900 text-sm sm:text-base">{problem.district}</strong></span>
          <span>Locality: <strong className="text-slate-900 text-sm sm:text-base">{problem.panchayatOrLocality}</strong></span>
          <span>Severity: <strong className="text-gov-saffron text-sm sm:text-base font-mono font-bold">{problem.aiAnalysis.severity} / 100</strong></span>
        </div>
      </div>

      {/* Prototype Disclaimer Banner */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 flex items-center space-x-2.5 text-sm sm:text-base">
        <Info className="w-5 h-5 text-amber-700 shrink-0" />
        <div>
          <span className="font-bold">Prototype / Demo University Match Engine:</span> Qualitative relevance labels are generated based on institutional research department specializations.
        </div>
      </div>

      {/* Matching Results List */}
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 sm:p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-[19px] font-semibold text-gov-navy leading-snug flex items-center space-x-2.5">
              <GraduationCap className="w-5 h-5 text-gov-blue shrink-0" />
              <span>Matched Academic Institutions ({PROTOTYPE_UNIVERSITY_MATCHES.length})</span>
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Select which university research teams should receive access to this problem statement.
            </p>
          </div>
          <span className="text-sm text-slate-600 font-semibold">
            {selectedUniversities.length} Selected
          </span>
        </div>

        {isSubmitted ? (
          <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-300 text-emerald-950 space-y-3.5 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-[19px] font-semibold text-emerald-950">Problem Successfully Referred to Universities!</h4>
            <p className="text-sm sm:text-base text-emerald-800 max-w-lg mx-auto leading-relaxed">
              This verified problem statement has been referred to: <strong className="text-emerald-950">{selectedUniversities.join(', ')}</strong>.
              Submitting research teams from these institutions can now view the problem and prepare solution proposals.
            </p>
            <div className="pt-2">
              <button
                onClick={onBack}
                className="px-5 py-2.5 bg-gov-navy text-white text-sm sm:text-base font-bold rounded-lg shadow-sm hover:bg-slate-800 transition"
              >
                Return to Verification Queue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {PROTOTYPE_UNIVERSITY_MATCHES.map((uni) => {
              const isSelected = selectedUniversities.includes(uni.name);

              return (
                <div
                  key={uni.universityId}
                  onClick={() => toggleUniversity(uni.name)}
                  className={`p-4 sm:p-5 rounded-lg border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    isSelected
                      ? 'bg-blue-50/80 border-gov-blue ring-1 ring-gov-blue shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUniversity(uni.name)}
                      className="mt-1 w-5 h-5 text-gov-blue rounded border-slate-300 focus:ring-gov-blue shrink-0"
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base sm:text-lg font-semibold text-slate-900">{uni.name}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                            uni.matchScoreLabel === 'Strong Match'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : uni.matchScoreLabel === 'Relevant Expertise'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {uni.matchScoreLabel}
                        </span>
                      </div>
                      <div className="text-sm sm:text-[15px] text-slate-700 font-semibold">
                        {uni.department} • Specialty: {uni.domain}
                      </div>
                      <p className="text-sm text-slate-600 italic">
                        "{uni.relevanceReason}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={handleSendToUniversities}
                disabled={selectedUniversities.length === 0}
                className="px-6 py-2.5 bg-gov-navy hover:bg-slate-800 text-white rounded-lg font-bold text-sm sm:text-base flex items-center space-x-2 shadow-sm transition disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-gov-saffron-amber" />
                <span>Send Problem to Selected Universities ({selectedUniversities.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
