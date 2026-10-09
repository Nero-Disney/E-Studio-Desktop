import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function GenerationScreen() {
  const { templates, products, syncJobs, updateTemplate } = useAppStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');
  const [selectedProductCount, setSelectedProductCount] = useState(Math.min(products.length, 10));

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? templates[0],
    [templates, selectedTemplateId]
  );

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const nextTemplate = templates.find((template) => template.id === templateId);
    if (!nextTemplate) return;
    updateTemplate({
      ...nextTemplate,
      status: 'valid',
      updatedAt: new Date().toISOString(),
    });
  };

  const previewItems = selectedTemplate?.items.slice(0, 4) ?? [];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Generation and print preparation</h2>
            <p className="mt-2 text-sm text-slate-600">
              Imports, mapping, preview, and export orchestration for the selected production batch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedProductCount((count) => Math.min(products.length, count + 5))}
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            Add 5 records
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Template</div>
          <select
            value={selectedTemplate?.id ?? ''}
            onChange={(event) => handleTemplateChange(event.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <div className="mt-3 text-sm text-slate-600">{selectedTemplate?.widthMm ?? 0} × {selectedTemplate?.heightMm ?? 0} mm</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Target batch</div>
          <div className="mt-3 text-lg font-bold text-slate-900">{selectedProductCount}</div>
          <div className="mt-2 text-sm text-slate-600">Records mapped to the current generation pass.</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sync jobs</div>
          <div className="mt-3 text-lg font-bold text-slate-900">{syncJobs.length}</div>
          <div className="mt-2 text-sm text-slate-600">Operational queue ready for review.</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Preview</h3>
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="relative mx-auto h-52 w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
              {previewItems.map((item, index) => (
                <div
                  key={item.id}
                  className="absolute border border-emerald-400 bg-emerald-100/70"
                  style={{
                    left: `${12 + index * 18}%`,
                    top: `${18 + (index % 3) * 18}%`,
                    width: `${Math.min(110, item.widthMm * 0.8)}px`,
                    height: `${Math.min(42, item.heightMm * 0.7)}px`,
                  }}
                >
                  <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    {item.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Export checkpoints</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>• map product fields to template bindings</li>
            <li>• verify layout and DPI constraints</li>
            <li>• generate PDF or print package</li>
            <li>• archive output and sync metadata</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
