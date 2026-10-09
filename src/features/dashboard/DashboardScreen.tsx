import React from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function DashboardScreen() {
  const { templates, products } = useAppStore();

  const cards = [
    { label: 'Gabarits', value: String(templates.length), tone: 'text-blue-500', bg: 'bg-blue-950/20' },
    { label: 'Articles en catalogue', value: String(products.length), tone: 'text-emerald-500', bg: 'bg-emerald-950/20' },
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
            <div className={`mt-3 text-3xl font-extrabold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <h2 className="text-base font-bold text-white">E-Studio Desktop — Architecture Locale</h2>
        <ul className="mt-4 space-y-2 text-xs text-slate-400">
          <li>• Conception vectorielle d'étiquettes en millimètres réels.</li>
          <li>• Résolution locale de catalogue Excel/CSV déterministe avec rapports d'import.</li>
          <li>• Génération de codes-barres GS1 et QR Codes conformes ISO/IEC 18004.</li>
          <li>• Spouleur d'impression local avec exécution physique réelle.</li>
        </ul>
      </div>
    </section>
  );
}
