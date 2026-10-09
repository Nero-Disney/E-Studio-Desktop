import React from 'react';
import { AppSection, getSectionMeta } from '../routes';

export function WorkspaceHeader({ section }: { section: AppSection }) {
  const meta = getSectionMeta(section);

  return (
    <header className="border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            E-Studio rebuild
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{meta.label}</h1>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          {meta.description}
        </div>
      </div>
    </header>
  );
}
