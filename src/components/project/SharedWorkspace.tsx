import React, { useState } from 'react';
import { Project, ProjectTask, ProjectMilestone } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { collabxApi } from '../../services/collabxApi';
import { 
  CheckCircle2, 
  FileText, 
  Plus, 
  Check, 
  Download, 
  Droplets
} from 'lucide-react';

export const SharedWorkspace: React.FC = () => {
  const { currentUser } = useAuth();

  const [project, setProject] = useState<Project>(() => storageService.getProjects()[0]);
  const [activeSection, setActiveSection] = useState<'overview' | 'milestones' | 'tasks' | 'testing' | 'docs'>('overview');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [pilotSyncState, setPilotSyncState] = useState<'idle' | 'saved' | 'failed'>('idle');

  React.useEffect(() => {
    void collabxApi.getProject(project.id).then(backendProject => {
      const metrics = backendProject.pilot_metrics_json ? JSON.parse(backendProject.pilot_metrics_json) : {};
      setProject(current => ({ ...current, status: (backendProject.status as Project['status']) || current.status, pilotMetrics: { ...current.pilotMetrics, ...metrics } }));
    }).catch(() => {
      // Local project remains available while offline.
    });
  }, [project.id]);

  // Toggle task status
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = project.tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: (t.status === 'done' ? 'todo' : 'done') as 'todo' | 'done',
        };
      }
      return t;
    });

    const updatedProject = { ...project, tasks: updatedTasks };
    storageService.saveProject(updatedProject);
    setProject(updatedProject);
  };

  const handleMilestoneStatus = async (milestone: ProjectMilestone) => {
    const nextStatus: ProjectMilestone['status'] = milestone.status === 'completed' ? 'pending' : 'completed';
    try {
      await collabxApi.updateMilestone(milestone.id, nextStatus);
      const updatedProject = { ...project, milestones: project.milestones.map(item => item.id === milestone.id ? { ...item, status: nextStatus } : item) };
      setProject(updatedProject);
      storageService.saveProject(updatedProject);
    } catch {
      // Keep the local workspace usable when the API is unavailable.
    }
  };

  const handleSyncPilotMetrics = async () => {
    try {
      await collabxApi.updatePilot(project.id, project.status, project.pilotMetrics as unknown as Record<string, unknown>);
      setPilotSyncState('saved');
    } catch {
      setPilotSyncState('failed');
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `t-${Date.now()}`,
      title: newTaskTitle,
      assignee: currentUser.name,
      role: currentUser.subRole || currentUser.role,
      status: 'in_progress',
      priority: 'high',
    };

    const updatedProject = {
      ...project,
      tasks: [...project.tasks, newTask],
    };
    storageService.saveProject(updatedProject);
    setProject(updatedProject);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white rounded-md border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold bg-gov-navy text-white px-2 py-0.5 rounded">
                {project.id}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold">
                Phase: Active Field Pilot
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gov-navy mt-1">{project.title}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2.5 py-1 bg-amber-100 text-amber-950 font-bold border border-amber-300 rounded text-xs">
                Co-Creators: {project.university} + {project.industryPartnerName || 'Industry Partner'}
              </span>
            </div>
          </div>
        </div>

        {/* Tri-Partite Stakeholder Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="gov-label uppercase text-gov-navy block">University Partner</span>
            <div className="font-bold text-slate-900 mt-0.5">{project.teamName}</div>
            <div className="text-xs text-slate-600">{project.university}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="gov-label uppercase text-gov-navy block">Industry Sponsor</span>
            <div className="font-bold text-slate-900 mt-0.5">{project.industryPartnerName}</div>
            <div className="text-xs text-slate-600">Sensors & Equipment Support</div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="gov-label uppercase text-gov-navy block">Govt Nodal Officer</span>
            <div className="font-bold text-slate-900 mt-0.5">{project.nodalOfficerName}</div>
            <div className="text-xs text-slate-600">Ranchi Municipal Corporation</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-md border border-slate-200 p-1 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveSection('overview')}
          className={`py-2 px-4 rounded text-xs sm:text-sm font-semibold transition ${
            activeSection === 'overview' ? 'bg-gov-navy text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveSection('milestones')}
          className={`py-2 px-4 rounded text-xs sm:text-sm font-semibold transition ${
            activeSection === 'milestones' ? 'bg-gov-navy text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Milestones & Stage Gate
        </button>
        <button
          onClick={() => setActiveSection('tasks')}
          className={`py-2 px-4 rounded text-xs sm:text-sm font-semibold transition ${
            activeSection === 'tasks' ? 'bg-gov-navy text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Action Items & Tasks
        </button>
        <button
          onClick={() => setActiveSection('testing')}
          className={`py-2 px-4 rounded text-xs sm:text-sm font-semibold transition ${
            activeSection === 'testing' ? 'bg-gov-navy text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          On-Site Telemetry & Tests
        </button>
        <button
          onClick={() => setActiveSection('docs')}
          className={`py-2 px-4 rounded text-xs sm:text-sm font-semibold transition ${
            activeSection === 'docs' ? 'bg-gov-navy text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Technical Dossiers & NOCs
        </button>
      </div>

      {/* SECTION 1: OVERVIEW & IMPACT */}
      {activeSection === 'overview' && (
        <div className="space-y-5">
          {/* Key Pilot Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gov-border shadow-gov">
              <span className="gov-label uppercase text-slate-500 block">Waterlogging Duration</span>
              <div className="text-xl font-bold text-gov-navy mt-1">
                8.0h <span className="text-slate-400 font-normal">→</span>{' '}
                <span className="text-gov-green font-black">1.5 Hours</span>
              </div>
              <span className="text-xs font-bold text-gov-green mt-0.5 block">
                ↓ 81.25% Inundation Reduction
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gov-border shadow-gov">
              <span className="gov-label uppercase text-slate-500 block">Peak Water Depth</span>
              <div className="text-xl font-bold text-gov-navy mt-1">
                65cm <span className="text-slate-400 font-normal">→</span>{' '}
                <span className="text-gov-green font-black">12 cm</span>
              </div>
              <span className="text-xs font-bold text-gov-green mt-0.5 block">
                ↓ 81.5% Depth Reduction
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gov-border shadow-gov">
              <span className="gov-label uppercase text-slate-500 block">Ranchi Beneficiaries</span>
              <div className="text-xl font-bold text-gov-navy mt-1 font-mono">45,200+</div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Harmu Ward 14 residents + school transit
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gov-border shadow-gov">
              <span className="gov-label uppercase text-slate-500 block">Field Prototype Status</span>
              <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center space-x-1">
                <CheckCircle2 className="w-5 h-5 text-gov-green" />
                <span>Operational</span>
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                4 Siphon check valves primed
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            {pilotSyncState === 'saved' && <span className="text-xs font-semibold text-emerald-700">Pilot metrics saved</span>}
            {pilotSyncState === 'failed' && <span className="text-xs font-semibold text-amber-700">Pilot metrics remain local until connected</span>}
            <button type="button" onClick={() => void handleSyncPilotMetrics()} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100">
              Save pilot metrics
            </button>
          </div>

          {/* Siphon Architecture Diagram / Explanation */}
          <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-3">
            <h3 className="text-sm font-bold text-gov-navy flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-gov-blue" />
              <span>Hydraulic Siphon Architecture & Sensor Placement</span>
            </h3>

            <div className="p-4 bg-slate-50 rounded border border-slate-200 text-xs leading-relaxed space-y-2 text-slate-700">
              <p>
                <span className="font-bold text-gov-navy">1. Passive Priming:</span> High-velocity storm surge creates hydraulic head differential in the dual-chamber retention basin, automatically siphoning excess crest water without requiring grid electrical power.
              </p>
              <p>
                <span className="font-bold text-gov-navy">2. Ultrasonic Silt Monitoring:</span> IP68 ultrasonic depth transducers positioned at inlet sleeves transmit telemetry via LoRaWAN every 90 seconds to the Ranchi Municipal Control Room.
              </p>
              <p>
                <span className="font-bold text-gov-navy">3. Resident Feedback Alignment:</span> Ground validation confirms road passable even during peak monsoon downpours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MILESTONES */}
      {activeSection === 'milestones' && (
        <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-4">
          <h3 className="text-sm font-bold text-gov-navy">
            Project Phasing & Milestone Delivery Tracking
          </h3>

          <div className="space-y-3">
            {project.milestones.map((m, idx) => (
              <div
                key={m.id}
                className={`p-4 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-3 ${
                  m.status === 'completed'
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : m.status === 'in_progress'
                    ? 'bg-blue-50/50 border-gov-blue shadow-sm ring-1 ring-gov-blue'
                    : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-slate-500 uppercase px-1.5 py-0.5 bg-white rounded border">
                      Phase {idx + 1}: {m.phase}
                    </span>
                    <span
                      className={`gov-badge px-2 py-0.5 rounded uppercase ${
                        m.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'in_progress'
                          ? 'bg-blue-100 text-gov-blue'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                  <p className="text-slate-600">{m.description}</p>
                  <div className="text-xs text-slate-500">
                    Deliverable: <span className="font-semibold text-slate-700">{m.deliverable}</span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-500 block">Due Date: {m.dueDate}</span>
                  <button
                    type="button"
                    onClick={() => void handleMilestoneStatus(m)}
                    className="mt-2 px-2.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    {m.status === 'completed' ? 'Reopen milestone' : 'Mark complete'}
                  </button>
                  {m.completedAt && (
                    <span className="text-emerald-700 font-bold block">✓ Completed {m.completedAt}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: TASKS */}
      {activeSection === 'tasks' && (
        <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-gov-navy">Collaborative Execution Tasks</h3>
            <button
              onClick={() => setIsAddingTask(prev => !prev)}
              className="px-3 py-1.5 bg-gov-navy hover:bg-gov-navy-dark text-white rounded text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingTask ? 'Cancel' : 'Add Task'}</span>
            </button>
          </div>

          {isAddingTask && (
            <form onSubmit={handleAddTask} className="p-3 bg-slate-50 rounded border border-slate-200 flex gap-2">
              <input
                type="text"
                required
                placeholder="Task description..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="flex-1 p-2 text-xs sm:text-sm border border-slate-300 rounded"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gov-navy text-white text-xs sm:text-sm font-bold rounded hover:bg-gov-navy-dark"
              >
                Save Task
              </button>
            </form>
          )}

          <div className="divide-y divide-slate-100 text-xs">
            {project.tasks.map(task => (
              <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                      task.status === 'done'
                        ? 'bg-gov-green border-gov-green text-white'
                        : 'border-slate-300 bg-white hover:border-gov-blue'
                    }`}
                  >
                    {task.status === 'done' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div>
                    <div className={`font-bold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      Assigned to: <span className="font-semibold text-slate-700">{task.assignee}</span> ({task.role})
                    </div>
                  </div>
                </div>

                <span
                  className={`gov-badge px-2 py-0.5 rounded uppercase ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {task.priority} Priority
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: TESTING & TELEMETRY */}
      {activeSection === 'testing' && (
        <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-gov-navy">Live On-Site Telemetry & Municipal Sensor Feeds</h3>
            <p className="text-slate-500 text-xs">Streamed from Harmu Bypass Siphon Sleeve #4 LoRa Node</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="gov-label text-slate-500 uppercase block">Culvert Water Level</span>
              <div className="text-lg font-bold text-gov-navy mt-1">11.4 cm</div>
              <span className="text-xs text-emerald-700 font-semibold">Normal (Baseline 65 cm)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="gov-label text-slate-500 uppercase block">Siphon Flow Velocity</span>
              <div className="text-lg font-bold text-gov-navy mt-1">1,240 L/sec</div>
              <span className="text-xs text-emerald-700 font-semibold">Active Gravitational Evacuation</span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="gov-label text-slate-500 uppercase block">Telemetry Health</span>
              <div className="text-lg font-bold text-gov-green mt-1">99.8% Uptime</div>
              <span className="text-xs text-slate-500">Solar Battery 13.8V</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: BLUEPRINTS & DOCS */}
      {activeSection === 'docs' && (
        <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gov-navy">Technical Dossiers & Municipal NOCs</h3>
            <span className="text-xs text-slate-500">{project.documents.length} Files</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {project.documents.map(doc => (
              <div key={doc.id} className="py-3 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gov-blue" />
                  <div>
                    <div className="font-bold text-slate-800">{doc.name}</div>
                    <div className="text-xs text-slate-500">
                      {doc.type} • {doc.size} • Uploaded by {doc.uploadedBy} on {doc.date}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Simulating secure GovTech download of ${doc.name}`)}
                  className="px-3 py-1 text-xs border border-slate-300 rounded text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
