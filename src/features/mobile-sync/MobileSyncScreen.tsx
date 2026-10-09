import React, { useState } from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function MobileSyncScreen() {
  const { syncJobs, setSyncJobs } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'running' | 'completed' | 'failed'>('all');

  const visibleJobs =
    selectedStatus === 'all'
      ? syncJobs
      : syncJobs.filter((job) => job.status === selectedStatus);

  const handleAdvanceJob = (jobId: string) => {
    setSyncJobs(
      syncJobs.map((job) => {
        if (job.id !== jobId) return job;
        const nextStatus = job.status === 'running' ? 'completed' : 'running';
        return {
          ...job,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mobile sync and device intake</h2>
            <p className="mt-2 text-sm text-slate-600">
              Pairing, queue status, and recovery flows are represented as explicit operational states.
            </p>
          </div>
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as 'all' | 'running' | 'completed' | 'failed')}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="all">All</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleJobs.map((job) => (
          <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{job.type}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium uppercase text-slate-700">
                {job.status}
              </span>
            </div>
            <div className="mt-4 text-lg font-bold text-slate-900">{job.id}</div>
            <div className="mt-2 text-sm text-slate-600">
              Updated {new Date(job.updatedAt).toLocaleString()}
            </div>
            <button
              type="button"
              onClick={() => handleAdvanceJob(job.id)}
              className="mt-4 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              {job.status === 'running' ? 'Complete sync' : 'Start sync'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
