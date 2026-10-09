import React from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function DashboardScreen() {
  const { templates, products, syncJobs } = useAppStore();

  const cards = [
    { label: 'Templates', value: String(templates.length), tone: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Products', value: String(products.length), tone: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sync Jobs', value: String(syncJobs.length), tone: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
            <div className={`mt-3 text-3xl font-extrabold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Rebuild focus</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>• Domain-driven architecture with explicit module ownership.</li>
          <li>• Local-first persistence and explicit sync queue handling.</li>
          <li>• Workflow-led UI with predictable empty, loading, warning, and retry states.</li>
          <li>• Secure backend foundations and production-ready operations model.</li>
        </ul>
      </div>
    </section>
  );
}
