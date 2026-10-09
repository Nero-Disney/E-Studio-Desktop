import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../app/providers/AppProviders';

export function CatalogScreen() {
  const { products, setProducts } = useAppStore();
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.ITEMNAME, product.PARTNO, product.BRAND_INFO, product.CATEGORY_NAME]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [products, query]);

  const handleMarkReview = (productId: string) => {
    setProducts(
      products.map((product) =>
        product.id === productId
          ? { ...product, raw: { ...(product.raw ?? {}), status: 'needs_review' }, updatedAt: new Date().toISOString() }
          : product
      )
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Catalog and product management</h2>
            <p className="mt-2 text-sm text-slate-600">
              Canonical product records, quality checks, and review status for downstream generation flows.
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">SKU</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Price</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 text-slate-600">{product.PARTNO ?? product.id}</td>
                <td className="px-4 py-3 text-slate-600">{product.ITEMNAME}</td>
                <td className="px-4 py-3 text-slate-600">${product.SELLING_PRICE ?? 0}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {String((product.raw as Record<string, unknown> | undefined)?.status ?? 'valid')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleMarkReview(product.id)}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    mark review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
