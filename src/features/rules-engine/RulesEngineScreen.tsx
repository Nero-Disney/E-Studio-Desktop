import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function RulesEngineScreen() {
  const { products } = useAppStore();
  const [promoOnly, setPromoOnly] = useState(false);

  const rulesSummary = useMemo(() => {
    const validProducts = products.filter((product) => product.PRODUCT_SCAN && product.PROMOPRICE);
    return {
      total: products.length,
      promoEligible: validProducts.length,
    };
  }, [products]);

  const visibleCount = promoOnly ? rulesSummary.promoEligible : rulesSummary.total;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Rules engine</h2>
            <p className="mt-2 text-sm text-slate-600">
              Deterministic display logic for prices, promotions, and product qualification rules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPromoOnly((value) => !value)}
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            {promoOnly ? 'Show all products' : 'Promo-only view'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Eligible</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{rulesSummary.promoEligible}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{rulesSummary.total}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visible</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{visibleCount}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-800">Rule scenario</h3>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Show promo price only when a promotion is active and the product has a valid barcode. The current rule set qualifies {rulesSummary.promoEligible} items for promotional display.
        </div>
      </div>
    </section>
  );
}
