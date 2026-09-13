import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { collabxApi } from '../../services/collabxApi';
import { indexedDbService, OfflineReportSummary } from '../../services/indexedDbService';

const emptySummary: OfflineReportSummary = { pending: [], synced: [], failed: [] };

const ReportGroup: React.FC<{ title: string; reports: OfflineReport[]; tone: string }> = ({ title, reports, tone }) => (
  <div className="space-y-2">
    <div className={`gov-group-heading ${tone}`}>
      {title} ({reports.length})
    </div>
    {reports.length > 0 ? reports.slice(0, 5).map(report => (
      <div key={report.id} className="flex flex-wrap items-center justify-between gap-2.5 rounded-md border border-slate-200 bg-white px-3.5 py-2.5 gov-body">
        <span className="font-medium text-slate-800 truncate">{report.title || report.description}</span>
        <span className="shrink-0 gov-id font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
          {report.serverId || report.id}
        </span>
      </div>
    )) : <div className="gov-helper pl-1">None</div>}
    {reports.length > 5 && <div className="gov-helper pl-1">Showing 5 of {reports.length}</div>}
  </div>
);

type OfflineReport = Awaited<ReturnType<typeof indexedDbService.getAllReports>>[number];

export const OfflineReportsStatus: React.FC = () => {
  const [summary, setSummary] = useState<OfflineReportSummary>(emptySummary);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = () => {
    void indexedDbService.getSummary().then(setSummary);
  };

  const sync = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      refresh();
      return;
    }
    setIsSyncing(true);
    await indexedDbService.syncPendingReports(payload => collabxApi.createProblem(payload));
    setIsSyncing(false);
    refresh();
  };

  useEffect(() => {
    refresh();
    const handleUpdated = () => refresh();
    const handleOnline = () => void sync();
    window.addEventListener(indexedDbService.updatedEventName, handleUpdated);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener(indexedDbService.updatedEventName, handleUpdated);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const total = summary.pending.length + summary.synced.length + summary.failed.length;
  if (total === 0) return null;

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4" aria-label="Offline report synchronization">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="gov-h3">Offline Report Storage</h3>
          <p className="gov-helper mt-0.5">Reports stay in this browser until they are safely uploaded.</p>
        </div>
        <button type="button" onClick={() => void sync()} disabled={isSyncing} className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 gov-btn text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-2xs">
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>
      <ReportGroup title="Pending Reports" reports={summary.pending} tone="text-amber-800" />
      <ReportGroup title="Synced Reports" reports={summary.synced} tone="text-emerald-800" />
      <ReportGroup title="Failed Reports" reports={summary.failed} tone="text-red-800" />
    </section>
  );
};
