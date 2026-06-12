'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Check,
  X,
  Clock,
  DollarSign,
  Info,
  Pencil,
  Trash2,
  FileDown,
} from 'lucide-react';
import { Procurement } from '../types';
import { exportProcurementsCSV, exportProcurementsPDF } from '../lib/export';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<
  Procurement['status'],
  { label: string; color: string; dot: string }
> = {
  Menunggu: {
    label: 'Menunggu',
    color: 'border-l-amber-400',
    dot: 'bg-amber-400',
  },
  Disetujui: {
    label: 'Disetujui',
    color: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
  },
  Ditolak: {
    label: 'Ditolak',
    color: 'border-l-rose-500',
    dot: 'bg-rose-500',
  },
};

interface ProcurementsViewProps {
  procurements: Procurement[];
  onAddProcurement: () => void;
  onEdit: (proc: Procurement) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function ProcurementsView({
  procurements,
  onAddProcurement,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: ProcurementsViewProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const totalBudget = procurements.reduce((s, p) => s + p.estimated_price * p.quantity, 0);
  const approvedBudget = procurements
    .filter(p => p.status === 'Disetujui')
    .reduce((s, p) => s + p.estimated_price * p.quantity, 0);
  const pendingCount = procurements.filter(p => p.status === 'Menunggu').length;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Pengadaan Barang</h1>
          <p className="text-xs text-slate-500">{procurements.length} permintaan total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddProcurement}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus size={15} />
            Lapor
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 bg-slate-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <FileDown size={15} />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => { exportProcurementsPDF(procurements); setShowExportMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => { exportProcurementsCSV(procurements); setShowExportMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={15} className="text-slate-400" />
            <p className="text-xs text-slate-500">Total Diusulkan</p>
          </div>
          <p className="text-base font-bold text-slate-800">{fmt(totalBudget)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Check size={15} className="text-emerald-500" />
            <p className="text-xs text-slate-500">Disetujui</p>
          </div>
          <p className="text-base font-bold text-emerald-700">{fmt(approvedBudget)}</p>
        </div>
      </div>

      {/* Info: approve auto-inject */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2">
        <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Menyetujui pengadaan akan otomatis menambahkan barang ke inventaris.
        </p>
      </div>

      {/* List */}
      {procurements.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={44} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Belum ada permintaan pengadaan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {procurements.map(proc => {
            const cfg = statusConfig[proc.status] ?? {
              label: proc.status,
              color: 'border-l-slate-400',
              dot: 'bg-slate-400',
            };
            if (!statusConfig[proc.status]) {
              console.warn('Unknown procurement status:', proc.status);
            }
            const total = proc.estimated_price * proc.quantity;
            return (
              <div
                key={proc.id}
                className={`bg-white rounded-2xl border border-slate-100 shadow-sm border-l-4 ${cfg.color} overflow-hidden`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{proc.item_name}</p>
                        <span className="flex items-center gap-1 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {proc.quantity} unit · {fmt(proc.estimated_price)}/unit
                      </p>
                      {proc.reason && (
                        <p className="text-xs text-slate-400 mt-1 italic">"{proc.reason}"</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800">{fmt(total)}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(proc.created_at).toLocaleDateString('id-ID')}
                      </p>
                      {proc.status === 'Menunggu' && (
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => onEdit(proc)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus pengadaan "${proc.item_name}"?`)) onDelete(proc.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {proc.status === 'Menunggu' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => onReject(proc.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-rose-300 text-rose-600 py-2 rounded-xl text-xs font-semibold hover:bg-rose-50 transition-colors"
                      >
                        <X size={13} />
                        Tolak
                      </button>
                      <button
                        onClick={() => onApprove(proc.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        <Check size={13} />
                        Setujui &amp; Sedia
                      </button>
                    </div>
                  )}

                  {proc.status !== 'Menunggu' && (
                    <div className="mt-2 pt-2 border-t border-slate-50">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        {proc.status === 'Disetujui'
                          ? 'Barang telah ditambahkan ke inventaris'
                          : 'Permintaan telah ditolak'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
