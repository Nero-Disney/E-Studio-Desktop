import React, { useState, useMemo } from 'react';
import { ProductRecord, LabelTemplate, BatchSpoolConfig } from '../types';
import { createSpoolBatches, SpoolBatch } from '../utils/batchSpooler';
import { Printer, CheckCircle2, Server } from 'lucide-react';

interface BatchSpoolerModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: LabelTemplate;
  products: ProductRecord[];
}

export const BatchSpoolerModal: React.FC<BatchSpoolerModalProps> = ({
  isOpen,
  onClose,
  template,
  products,
}) => {
  const [printerQueue, setPrinterQueue] = useState('PRINTER_LASER_01 (Rayon Frais)');
  const [batchSize, setBatchSize] = useState(25);
  const [groupBy, setGroupBy] = useState<'DEPT_NAME' | 'CATEGORY_NAME' | 'STORE_NAME' | 'VENDOR_NAME' | 'none'>('DEPT_NAME');
  const [sortOrder, setSortOrder] = useState<'aisle_order' | 'alphabetical' | 'sku_order'>('aisle_order');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedBatches, setProcessedBatches] = useState(0);

  const batches = useMemo<SpoolBatch[]>(() => {
    return createSpoolBatches(products, {
      batch_size: batchSize,
      group_by_field: groupBy,
      sort_order: sortOrder,
    });
  }, [products, batchSize, groupBy, sortOrder]);

  if (!isOpen) return null;

  const handleStartBatchJob = () => {
    setIsProcessing(true);
    setProcessedBatches(0);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setProcessedBatches(current);

      if (current >= batches.length) {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Spooler d'Impression Industrielle & Lots</h2>
              <p className="text-[11px] text-slate-500">Découpage automatique en sous-lots et routage d'imprimantes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Configuration Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">File d'Impression / Terminal :</label>
              <select
                value={printerQueue}
                onChange={(e) => setPrinterQueue(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="PRINTER_LASER_01 (Rayon Frais)">Imprimante Laser #1 (Rayon Frais)</option>
                <option value="PRINTER_ZEBRA_02 (Entrepôt)">Zebra ZT411 300DPI (Entrepôt)</option>
                <option value="PRINTER_TOSHIBA_03 (Balisage)">Toshiba B-FV4D (Balisage Rayon)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Taille max par sous-lot :</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                disabled={isProcessing}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value={10}>10 étiquettes / lot</option>
                <option value={25}>25 étiquettes / lot (Recommandé)</option>
                <option value={50}>50 étiquettes / lot</option>
                <option value={100}>100 étiquettes / lot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Regroupement :</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                disabled={isProcessing}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="DEPT_NAME">Par Département / Rayon</option>
                <option value="CATEGORY_NAME">Par Catégorie</option>
                <option value="STORE_NAME">Par Magasin</option>
                <option value="none">Aucun regroupement</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Ordre de tri :</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                disabled={isProcessing}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="aisle_order">Ordre d'allée (Implantation)</option>
                <option value="alphabetical">Alphabétique (Nom produit)</option>
                <option value="sku_order">Par référence (PartNo)</option>
              </select>
            </div>
          </div>

          {/* Job Overview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Volume total à imprimer :</span>
              <span className="font-bold text-slate-900">{products.length} étiquettes ({template.name})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Découpage en lots calculé :</span>
              <span className="font-bold text-blue-700">{batches.length} sous-lots</span>
            </div>
          </div>

          {/* Active Job Progress */}
          {processedBatches > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Printer className={`w-4 h-4 ${isProcessing ? 'text-blue-600 animate-pulse' : 'text-emerald-600'}`} />
                  <span className="font-bold text-slate-900">
                    {processedBatches >= batches.length ? 'Impression des lots terminée !' : 'Spooling en cours...'}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-blue-800">
                  {processedBatches} / {batches.length} lots
                </span>
              </div>

              <div className="w-full bg-blue-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${Math.round((processedBatches / Math.max(1, batches.length)) * 100)}%`,
                  }}
                />
              </div>

              {processedBatches >= batches.length && (
                <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tous les paquets de données ont été envoyés avec succès à la file d'impression.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium text-xs"
          >
            Fermer
          </button>

          <button
            onClick={handleStartBatchJob}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Lancer la Production Spoolée</span>
          </button>
        </div>
      </div>
    </div>
  );
};
