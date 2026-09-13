import {
  ProblemReport,
  Challenge,
  IdeaProposal,
  IndustryPartner,
  CollaborationOffer,
  Project,
  CitizenFeedback,
  ReplicationCandidate,
  LinkCollabPost,
  InAppNotification,
  AuditLogEntry,
  UserPersona,
  UserRole,
  ProblemStatus
} from '../types';
import {
  SEEDED_PERSONAS,
  INITIAL_PROBLEMS,
  INITIAL_CHALLENGES,
  INITIAL_IDEAS,
  INITIAL_INDUSTRY_PARTNERS,
  INITIAL_COLLABORATION_OFFERS,
  INITIAL_PROJECT,
  INITIAL_FEEDBACK,
  INITIAL_REPLICATION_CANDIDATES,
  INITIAL_LINK_COLLAB_POSTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS
} from '../data/initialSeedData';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'collabx_auth_token',
  CURRENT_USER: 'collabx_current_user',
  PROBLEMS: 'collabx_problems',
  CHALLENGES: 'collabx_challenges',
  IDEAS: 'collabx_ideas',
  INDUSTRY_PARTNERS: 'collabx_industry_partners',
  COLLABORATIONS: 'collabx_collaborations',
  PROJECTS: 'collabx_projects',
  FEEDBACK: 'collabx_feedback',
  REPLICATIONS: 'collabx_replications',
  POSTS: 'collabx_posts',
  NOTIFICATIONS: 'collabx_notifications',
  AUDIT_LOGS: 'collabx_audit_logs',
  PENDING_FEEDBACK: 'collabx_pending_feedback',
};

export function normalizeInstitutionName(name: string | undefined | null): string {
  if (!name) return '';
  const cleaned = name
    .toLowerCase()
    .replace(/[(),.\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const isBit = (cleaned.includes('birla') || cleaned.includes('bit')) && cleaned.includes('mesra');
  if (isBit) return 'birla institute of technology bit mesra';

  const isIit = (cleaned.includes('iit') || cleaned.includes('indian institute of technology') || cleaned.includes('ism')) && cleaned.includes('dhanbad');
  if (isIit) return 'iit ism dhanbad';

  const isNit = (cleaned.includes('nit') || cleaned.includes('national institute of technology')) && cleaned.includes('jamshedpur');
  if (isNit) return 'national institute of technology nit jamshedpur';

  const isBau = (cleaned.includes('birsa') || cleaned.includes('bau')) && (cleaned.includes('agricultural') || cleaned.includes('ranchi') || cleaned.includes('kanke'));
  if (isBau) return 'birsa agricultural university bau ranchi';

  return cleaned;
}

export function isSameInstitution(a: string | undefined | null, b: string | undefined | null): boolean {
  const normA = normalizeInstitutionName(a);
  const normB = normalizeInstitutionName(b);
  if (!normA || !normB) return false;
  return normA === normB;
}

class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Error reading ${key} from storage, falling back to default`, e);
    }
    return defaultValue;
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage`, e);
    }
  }

  getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  setAuthToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Current User
  getCurrentUser(): UserPersona {
    return this.getItem<UserPersona>(STORAGE_KEYS.CURRENT_USER, SEEDED_PERSONAS[0]);
  }

  setCurrentUser(user: UserPersona): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  getPersonaByRole(role: UserRole, subRole?: string): UserPersona {
    const found = SEEDED_PERSONAS.find(p => p.role === role && (!subRole || p.subRole === subRole));
    return found || SEEDED_PERSONAS[0];
  }

  getAllPersonas(): UserPersona[] {
    return SEEDED_PERSONAS;
  }

  // Problems
  getProblems(): ProblemReport[] {
    return this.getItem<ProblemReport[]>(STORAGE_KEYS.PROBLEMS, INITIAL_PROBLEMS);
  }

  saveProblem(problem: ProblemReport): void {
    const problems = this.getProblems();

    // Ensure matching fields from AI analysis are persisted directly on the problem record
    if (problem.aiAnalysis) {
      if (!problem.matchedUniversity && problem.aiAnalysis.matchedUniversity) {
        problem.matchedUniversity = problem.aiAnalysis.matchedUniversity;
      }
      if (!problem.matchedUniversityId && problem.aiAnalysis.matchedUniversityId) {
        problem.matchedUniversityId = problem.aiAnalysis.matchedUniversityId;
      }
      if (!problem.matchedDepartment && problem.aiAnalysis.matchedDepartment) {
        problem.matchedDepartment = problem.aiAnalysis.matchedDepartment;
      }
      if (!problem.matchedDepartmentId && problem.aiAnalysis.matchedDepartmentId) {
        problem.matchedDepartmentId = problem.aiAnalysis.matchedDepartmentId;
      }
      if (problem.matchingScore === undefined && problem.aiAnalysis.matchingScore !== undefined) {
        problem.matchingScore = problem.aiAnalysis.matchingScore;
      }
      if (!problem.matchingReason && problem.aiAnalysis.matchingReason) {
        problem.matchingReason = problem.aiAnalysis.matchingReason;
      }
      if (!problem.matchingExplanationBullets && problem.aiAnalysis.matchingExplanationBullets) {
        problem.matchingExplanationBullets = problem.aiAnalysis.matchingExplanationBullets;
      }
      if (!problem.secondaryMatches && problem.aiAnalysis.secondaryMatches) {
        problem.secondaryMatches = problem.aiAnalysis.secondaryMatches;
      }
    }

    const existingIndex = problems.findIndex(p => p.id === problem.id);
    if (existingIndex >= 0) {
      problems[existingIndex] = problem;
    } else {
      if (problem.status === 'submitted' || !problem.status) {
        problem.status = 'university_matched';
      }
      if (problem.matchedUniversity) {
        problem.referredUniversities = [problem.matchedUniversity];
      }
      problems.unshift(problem);
    }
    this.setItem(STORAGE_KEYS.PROBLEMS, problems);
  }

  adoptProblem(problemId: string, universityName: string, departmentName?: string): ProblemReport | null {
    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      problem.status = 'university_adopted';
      if (!problem.matchedUniversity) problem.matchedUniversity = universityName;
      if (departmentName && !problem.matchedDepartment) problem.matchedDepartment = departmentName;
      if (!problem.referredUniversities) problem.referredUniversities = [];
      if (!problem.referredUniversities.some(u => isSameInstitution(u, universityName))) {
        problem.referredUniversities.push(universityName);
      }
      this.saveProblem(problem);

      this.addAuditLog({
        actorName: universityName,
        actorRole: 'University',
        action: 'ADOPT_PROBLEM',
        targetEntity: problem.id,
        details: `${universityName} (${departmentName || problem.matchedDepartment || 'Department'}) adopted problem #${problem.id} to initiate solution development.`,
        ipHash: '10.20.4.1 [University Campus Gateway]',
      });
    }
    return problem || null;
  }

  formTeam(problemId: string, teamName: string, mentorName: string, mentorDepartment?: string): ProblemReport | null {
    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      problem.status = 'team_formed';
      problem.teamName = teamName;
      problem.facultyMentorName = mentorName;
      if (mentorDepartment) problem.facultyMentorDepartment = mentorDepartment;
      problem.currentMilestoneTitle = 'Initial Technical Scoping & Architecture';
      problem.nextMilestoneTitle = 'Engineering Solution Development';
      problem.progressPercentage = 38;
      problem.lastMilestoneUpdate = new Date().toISOString();
      this.saveProblem(problem);

      this.addAuditLog({
        actorName: mentorName || 'Faculty Mentor',
        actorRole: 'University',
        action: 'FORM_TEAM',
        targetEntity: problem.id,
        details: `Formed research team "${teamName}" mentored by ${mentorName} for problem #${problem.id}.`,
        ipHash: '10.20.4.1 [University Campus Gateway]',
      });
    }
    return problem || null;
  }

  updateProblemMilestone(
    problemId: string, 
    stage: ProblemStatus, 
    currentMilestone: string, 
    nextMilestone?: string, 
    progress?: number
  ): ProblemReport | null {
    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      problem.status = stage;
      problem.currentMilestoneTitle = currentMilestone;
      if (nextMilestone) problem.nextMilestoneTitle = nextMilestone;
      if (progress !== undefined) problem.progressPercentage = progress;
      problem.lastMilestoneUpdate = new Date().toISOString();
      this.saveProblem(problem);

      this.addAuditLog({
        actorName: problem.facultyMentorName || 'University Team Lead',
        actorRole: 'University',
        action: 'UPDATE_MILESTONE',
        targetEntity: problem.id,
        details: `Advanced problem #${problem.id} to stage ${stage} ("${currentMilestone}").`,
        ipHash: '10.20.4.1 [University Campus Gateway]',
      });
    }
    return problem || null;
  }

  getMatchedProblemsForDepartment(universityNameOrId: string, departmentNameOrId?: string): ProblemReport[] {
    const problems = this.getProblems();
    return problems.filter(p => {
      const matchUniv = isSameInstitution(p.matchedUniversity, universityNameOrId) ||
        (p.matchedUniversityId && p.matchedUniversityId.toLowerCase() === universityNameOrId.toLowerCase()) ||
        (p.referredUniversities && p.referredUniversities.some(u => isSameInstitution(u, universityNameOrId)));

      if (!matchUniv) return false;

      if (!departmentNameOrId) return true;

      const deptTarget = departmentNameOrId.toLowerCase();
      const pDept = (p.matchedDepartment || '').toLowerCase();
      const pDeptId = (p.matchedDepartmentId || '').toLowerCase();

      return pDept.includes(deptTarget) || pDeptId.includes(deptTarget) || deptTarget.includes(pDept);
    });
  }

  referProblemToUniversities(problemId: string, universityNames: string[]): void {
    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      problem.referredUniversities = universityNames;
      problem.status = 'university_matched';
      this.saveProblem(problem);
    }
  }

  getReferredProblemsForUniversity(universityName: string): ProblemReport[] {
    return this.getMatchedProblemsForDepartment(universityName);
  }

  // Challenges
  getChallenges(): Challenge[] {
    return this.getItem<Challenge[]>(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);
  }

  saveChallenge(challenge: Challenge): void {
    const challenges = this.getChallenges();
    const existingIndex = challenges.findIndex(c => c.id === challenge.id);
    if (existingIndex >= 0) {
      challenges[existingIndex] = challenge;
    } else {
      challenges.unshift(challenge);
    }
    this.setItem(STORAGE_KEYS.CHALLENGES, challenges);
  }

  // Ideas / Solution Proposals
  getIdeas(): IdeaProposal[] {
    return this.getItem<IdeaProposal[]>(STORAGE_KEYS.IDEAS, INITIAL_IDEAS);
  }

  saveIdea(idea: IdeaProposal): void {
    const ideas = this.getIdeas();
    const existingIndex = ideas.findIndex(i => i.id === idea.id);
    if (existingIndex >= 0) {
      ideas[existingIndex] = idea;
    } else {
      ideas.unshift(idea);
    }
    this.setItem(STORAGE_KEYS.IDEAS, ideas);
  }

  submitSolutionForProblem(proposal: IdeaProposal, problemId: string): void {
    proposal.problemId = problemId;
    this.saveIdea(proposal);

    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      problem.status = 'solution_submitted';
      this.saveProblem(problem);
    }
  }

  selectSolutionForProblem(problemId: string, solutionId: string): void {
    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      problem.selectedSolutionId = solutionId;
      problem.status = 'solution_selected';
      this.saveProblem(problem);
    }

    const ideas = this.getIdeas();
    const idea = ideas.find(i => i.id === solutionId);
    if (idea) {
      idea.status = 'selected';
      this.saveIdea(idea);
    }
  }

  submitIndustrySupportOffer(problemId: string, offer: any): void {
    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      problem.status = 'industry_support';
      if (!problem.industrySupportOffers) {
        problem.industrySupportOffers = [];
      }
      problem.industrySupportOffers.unshift(offer);
      this.saveProblem(problem);
    }
  }

  // Industry Partners
  getIndustryPartners(): IndustryPartner[] {
    return this.getItem<IndustryPartner[]>(STORAGE_KEYS.INDUSTRY_PARTNERS, INITIAL_INDUSTRY_PARTNERS);
  }

  // Collaborations
  getCollaborations(): CollaborationOffer[] {
    return this.getItem<CollaborationOffer[]>(STORAGE_KEYS.COLLABORATIONS, INITIAL_COLLABORATION_OFFERS);
  }

  saveCollaboration(collab: CollaborationOffer): void {
    const collabs = this.getCollaborations();
    const existingIndex = collabs.findIndex(c => c.id === collab.id);
    if (existingIndex >= 0) {
      collabs[existingIndex] = collab;
    } else {
      collabs.unshift(collab);
    }
    this.setItem(STORAGE_KEYS.COLLABORATIONS, collabs);
  }

  // Projects
  getProjects(): Project[] {
    return this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, [INITIAL_PROJECT]);
  }

  saveProject(project: Project): void {
    const projects = this.getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.unshift(project);
    }
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
  }

  // Feedback
  getFeedback(): CitizenFeedback[] {
    return this.getItem<CitizenFeedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
  }

  saveFeedback(fb: CitizenFeedback): void {
    const feedbackList = this.getFeedback();
    feedbackList.unshift(fb);
    this.setItem(STORAGE_KEYS.FEEDBACK, feedbackList);
  }

  getPendingFeedback(): CitizenFeedback[] {
    return this.getItem<CitizenFeedback[]>(STORAGE_KEYS.PENDING_FEEDBACK, []);
  }

  savePendingFeedback(fb: CitizenFeedback): void {
    const pending = this.getPendingFeedback().filter(item => item.id !== fb.id);
    pending.unshift(fb);
    this.setItem(STORAGE_KEYS.PENDING_FEEDBACK, pending);
  }

  removePendingFeedback(id: string): void {
    this.setItem(STORAGE_KEYS.PENDING_FEEDBACK, this.getPendingFeedback().filter(item => item.id !== id));
  }

  // Replications
  getReplications(): ReplicationCandidate[] {
    return this.getItem<ReplicationCandidate[]>(STORAGE_KEYS.REPLICATIONS, INITIAL_REPLICATION_CANDIDATES);
  }

  saveReplication(rep: ReplicationCandidate): void {
    const reps = this.getReplications();
    const index = reps.findIndex(r => r.id === rep.id);
    if (index >= 0) {
      reps[index] = rep;
    } else {
      reps.push(rep);
    }
    this.setItem(STORAGE_KEYS.REPLICATIONS, reps);
  }

  // Link Collab Posts
  getPosts(): LinkCollabPost[] {
    return this.getItem<LinkCollabPost[]>(STORAGE_KEYS.POSTS, INITIAL_LINK_COLLAB_POSTS);
  }

  savePost(post: LinkCollabPost): void {
    const posts = this.getPosts();
    const index = posts.findIndex(p => p.id === post.id);
    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.unshift(post);
    }
    this.setItem(STORAGE_KEYS.POSTS, posts);
  }

  // Notifications
  getNotifications(): InAppNotification[] {
    return this.getItem<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  addNotification(notif: InAppNotification): void {
    const notifs = this.getNotifications();
    notifs.unshift(notif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const target = notifs.find(n => n.id === id);
    if (target) {
      target.read = true;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  // Audit Logs
  getAuditLogs(): AuditLogEntry[] {
    return this.getItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(fullEntry);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Complete System Data Reset
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PROBLEMS);
    localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
    localStorage.removeItem(STORAGE_KEYS.IDEAS);
    localStorage.removeItem(STORAGE_KEYS.INDUSTRY_PARTNERS);
    localStorage.removeItem(STORAGE_KEYS.COLLABORATIONS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACK);
    localStorage.removeItem(STORAGE_KEYS.REPLICATIONS);
    localStorage.removeItem(STORAGE_KEYS.POSTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.setCurrentUser(SEEDED_PERSONAS[0]);
  }
}

export const storageService = new StorageService();
