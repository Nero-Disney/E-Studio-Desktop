import React from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function TemplateEditorScreen() {
  const { templates, updateTemplate } = useAppStore();
  const activeTemplate = templates[0];

  const handleCycleStatus = () => {
    if (!activeTemplate) return;

    const nextStatus = activeTemplate.status === 'valid' ? 'warning' : 'valid';
    updateTemplate({
      ...activeTemplate,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Template editor</h2>
            <p className="mt-1 text-sm text-slate-600">
              Live layout context and validation state for the canonical editor model.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCycleStatus}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Toggle validation
            </button>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {activeTemplate?.status ?? 'draft'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Canvas overview</h3>
            <span className="text-xs text-slate-500">{activeTemplate?.name}</span>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="relative mx-auto h-64 w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] bg-[size:24px_24px]" />
              {activeTemplate?.items.map((item, index) => (
                <div
                  key={item.id}
                  className="absolute border border-blue-400 bg-blue-100/70 shadow-sm"
                  style={{
                    left: `${12 + index * 18}%`,
                    top: `${18 + (index % 3) * 18}%`,
                    width: `${Math.min(110, item.widthMm * 0.8)}px`,
                    height: `${Math.min(52, item.heightMm * 0.7)}px`,
                  }}
                >
                  <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {item.type}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">Size: {activeTemplate?.widthMm ?? 0}×{activeTemplate?.heightMm ?? 0} mm</div>
            <div className="rounded-xl bg-slate-50 p-3">Objects: {activeTemplate?.items.length ?? 0}</div>
            <div className="rounded-xl bg-slate-50 p-3">Version: {activeTemplate?.version ?? 0}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-800">Object list</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {activeTemplate?.items.slice(0, 4).map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{item.name}</span>
                  <span className="text-xs uppercase tracking-[0.15em] text-slate-500">{item.type}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-800">Editor services</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• transform engine and snapping</li>
              <li>• ruler and alignment constraints</li>
              <li>• field binding and validation</li>
              <li>• save and audit trail integration</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
