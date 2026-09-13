import React, { useState } from 'react';
import { IdeaProposal, Project } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  Building, 
  ShieldCheck, 
  Award
} from 'lucide-react';

const createNotificationId = () => `notif-${Date.now()}`;

export const ProfessorMentorView: React.FC = () => {
  const { currentUser } = useAuth();

  const [ideas] = useState<IdeaProposal[]>(() => storageService.getIdeas());
  const [activeProject] = useState<Project>(() => storageService.getProjects()[0]);
  const [adviceText, setAdviceText] = useState('');
  const [endorsedIdeaId, setEndorsedIdeaId] = useState<string | null>('IDEA-BIT-001');

  const handleEndorse = (ideaId: string) => {
    setEndorsedIdeaId(ideaId);
    storageService.addNotification({
      id: createNotificationId(),
      title: 'Professor Endorsement Added',
      message: `${currentUser.name} has endorsed your proposal for state expert review.`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      targetRole: 'student',
    });
    alert('Proposal endorsed by Faculty Advisor. Sent with departmental commendation to State Expert Committee.');
  };

  const handleRequestIndustryLabAccess = () => {
    storageService.addNotification({
      id: createNotificationId(),
      title: 'Industry Lab Access Requested by Faculty',
      message: `${currentUser.name} (BIT Mesra) requested testing flume access from Tata Steel GovTech Division.`,
      type: 'info',
      timestamp: 'Just now',
      read: false,
      targetRole: 'industry',
    });
    alert('Request dispatched to Tata Steel CSR & Testing Division.');
  };

  return (
    <div className="space-y-6">
      {/* Mentor Header */}
      <div className="bg-white p-5 rounded-lg border border-gov-border shadow-gov flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <GraduationCap className="w-6 h-6 text-gov-blue" />
            <h2 className="gov-h2">
              Faculty Mentorship & Academic Supervision Portal
            </h2>
          </div>
          <p className="gov-body text-slate-600 mt-1">
            Supervising: <span className="font-semibold text-slate-800">{currentUser.name}</span> • {currentUser.department}, {currentUser.organization}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRequestIndustryLabAccess}
            className="px-4 py-2.5 bg-gov-blue hover:bg-gov-blue-light text-white rounded-md gov-button flex items-center space-x-2 shadow-sm transition"
          >
            <Building className="w-4 h-4" />
            <span>Request Industry Facility Access</span>
          </button>
        </div>
      </div>

      {/* Student Proposals Pending Faculty Review */}
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 sm:p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="gov-h3">
            Student Departmental Proposals Under Review ({ideas.length})
          </h3>
          <span className="text-xs sm:text-sm text-slate-500 italic">
            * Note: Faculty mentors provide academic guidance. Final selection is made by the State Domain Expert.
          </span>
        </div>

        <div className="space-y-4">
          {ideas.map(idea => {
            const isEndorsed = endorsedIdeaId === idea.id;

            return (
              <div
                key={idea.id}
                className="p-5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="gov-id font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {idea.id}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-gov-navy">{idea.teamName}</span>
                      <span className="text-xs sm:text-sm text-slate-500">({idea.leadStudentName}, Lead)</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{idea.title}</h4>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <span className="gov-badge bg-blue-100 text-gov-blue">
                      Technical Feasibility Evaluation: {idea.aiScores.compositeScore}/100
                    </span>

                    <button
                      onClick={() => handleEndorse(idea.id)}
                      disabled={isEndorsed}
                      className={`px-4 py-2 gov-button rounded-md flex items-center space-x-1.5 transition ${
                        isEndorsed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-gov-navy hover:bg-gov-navy-dark text-white shadow-xs'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isEndorsed ? 'Department Endorsed ✓' : 'Endorse Proposal'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-sm sm:text-base text-slate-700 space-y-1.5 leading-relaxed">
                  <div>
                    <span className="font-semibold text-slate-800">Proposed Hydraulic Architecture:</span>{' '}
                    {idea.proposedSolution}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Budget Estimate:</span>{' '}
                    <span className="font-mono font-bold">₹{idea.estimatedCost.toLocaleString()}</span> (Ceiling ₹4.5 Lakh)
                  </div>
                </div>

                {/* Technical Advising Input */}
                <div className="pt-2.5 border-t border-slate-200 flex items-center space-x-2.5">
                  <input
                    type="text"
                    placeholder="Provide technical mentoring remarks for team..."
                    value={adviceText}
                    onChange={e => setAdviceText(e.target.value)}
                    className="flex-1 p-2.5 text-sm sm:text-base bg-white border border-slate-300 rounded-md focus:border-gov-blue focus:ring-1 focus:ring-gov-blue text-slate-900"
                  />
                  <button
                    onClick={() => {
                      if (!adviceText.trim()) return;
                      alert(`Mentorship feedback dispatched to ${idea.leadStudentName}: "${adviceText}"`);
                      setAdviceText('');
                    }}
                    className="px-4 py-2.5 bg-gov-blue text-white rounded-md text-sm sm:text-[15px] font-semibold hover:bg-gov-blue-light transition shadow-xs"
                  >
                    Send Guidance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Project Milestone Monitoring */}
      {activeProject && (
        <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-[19px] font-semibold text-gov-navy flex items-center space-x-2">
              <Award className="w-5 h-5 text-gov-saffron" />
              <span>Mentored Live Pilot: {activeProject.title}</span>
            </h3>
            <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Phase: {activeProject.milestones[activeProject.currentMilestoneIndex]?.phase || 'Pilot'}
            </span>
          </div>

          <p className="text-base text-slate-600 leading-relaxed">
            Faculty supervision of student lab calibrations and safety clearances before on-ground Ranchi Municipal deployment.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 text-xs uppercase font-bold">Completed Milestones</span>
              <div className="text-base font-bold text-gov-navy mt-1">3 of 5 Delivered</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 text-xs uppercase font-bold">Industry Collaborator</span>
              <div className="text-base font-bold text-slate-800 mt-1">Tata Steel GovTech</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 text-xs uppercase font-bold">Nodal Officer Sync</span>
              <div className="text-base font-bold text-emerald-700 mt-1">Alok Prasad, IAS</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
