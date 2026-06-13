'use client';

import React, { useState, useMemo } from 'react';
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
  Search,
  Settings2,
  Tag,
  Warehouse,
  ShoppingBag,
} from 'lucide-react';
import { Procurement, Division, ProcurementType } from '../types';
import { resolveDivisionName, resolveProcurementCategoryName } from '../lib/supabase';
import { exportProcurementsCSV, exportProcurementsPDF } from '../lib/export';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const typeConfig: Record<
  ProcurementType,
  { label: string; icon: typeof Warehouse; color: string }
> = {
  inventaris: {
    label: 'Inventaris',
    icon: Warehouse,
    color: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  posko: {
    label: 'Habis Pakai',
    icon: ShoppingBag,
    color: 'bg-rose-50 text-rose-700 border-rose-100',
  },
};

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
  divisions: Division[];
  onAddProcurement: () => void;
  onEdit: (proc: Procurement) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onManageDivisions: () => void;
}

export default function ProcurementsView({
  procurements,
  divisions,
  onAddProcurement,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onManageDivisions,
}: ProcurementsViewProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDivisionId, setActiveDivisionId] = useState<string | 'ALL'>('ALL');
  const [activeType, setActiveType] = useState<'ALL' | ProcurementType>('ALL');

  const filteredProcurements = useMemo(() => {
    return procurements.filter(p => {
      const q = searchQuery.toLowerCase();
      const divName = resolveDivisionName(p) ?? '';
      const matchSearch =
        p.item_name.toLowerCase().includes(q) ||
        p.reason?.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        divName.toLowerCase().includes(q);
      const matchDiv =
        activeDivisionId === 'ALL' || p.division_id === activeDivisionId;
      const matchType =
        activeType === 'ALL' || p.procurement_type === activeType;
      return matchSearch && matchDiv && matchType;
    });
  }, [procurements, searchQuery, activeDivisionId, activeType]);

  // Statistik ringkasan mengikuti filter aktif (divisi + pencarian)
  const { totalBudget, approvedBudget, pendingCount } = useMemo(() => {
    let total = 0;
    let approved = 0;
    let pending = 0;
    filteredProcurements.forEach(p => {
      const cost = p.estimated_price * p.quantity;
      total += cost;
      if (p.status === 'Disetujui') approved += cost;
      if (p.status === 'Menunggu') pending += 1;
    });
    return { totalBudget: total, approvedBudget: approved, pendingCount: pending };
  }, [filteredProcurements]);

  const isFiltered =
    activeDivisionId !== 'ALL' || activeType !== 'ALL' || searchQuery.trim().length > 0;

  // Statistik per divisi: jumlah pengadaan dan total nominal
  const perDivisionStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    let noDivCount = 0;
    let noDivTotal = 0;
    procurements.forEach(p => {
      if (p.division_id) {
        const cur = map[p.division_id] ?? { count: 0, total: 0 };
        cur.count += 1;
        cur.total += p.estimated_price * p.quantity;
        map[p.division_id] = cur;
      } else {
        noDivCount += 1;
        noDivTotal += p.estimated_price * p.quantity;
      }
    });
    return { map, noDivCount, noDivTotal };
  }, [procurements]);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Pengadaan Barang</h1>
          <p className="text-xs text-slate-500">
            {procurements.length} permintaan · {divisions.length} divisi
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddProcurement}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus size={15} />
            Lapor
          </button>
          <button
            onClick={onManageDivisions}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            title="Kelola divisi"
          >
            <Settings2 size={15} />
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
              <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-10 min-w-[160px]">
                <button
                  onClick={() => {
                    const activeDivName =
                      activeDivisionId === 'ALL'
                        ? null
                        : activeDivisionId === '__none__'
                        ? 'Tanpa Divisi'
                        : divisions.find(d => d.id === activeDivisionId)?.name ?? null;
                    const titleParts = ['Data Pengadaan Barang'];
                    if (activeDivName) titleParts.push(`Divisi ${activeDivName}`);
                    if (searchQuery.trim()) titleParts.push(`"${searchQuery.trim()}"`);
                    const title = titleParts.join(' — ');
                    exportProcurementsPDF(filteredProcurements, divisions, title);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export PDF (per Divisi)
                </button>
                <button
                  onClick={() => {
                    const activeDivName =
                      activeDivisionId === 'ALL'
                        ? null
                        : activeDivisionId === '__none__'
                        ? 'Tanpa Divisi'
                        : divisions.find(d => d.id === activeDivisionId)?.name ?? null;
                    const titleParts = ['pengadaan'];
                    if (activeDivName) titleParts.push(activeDivName.toLowerCase());
                    const title = titleParts.join('-');
                    exportProcurementsCSV(filteredProcurements, divisions, title);
                    setShowExportMenu(false);
                  }}
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
            <p className="text-xs text-slate-500">
              Total Diusulkan
              {isFiltered && (
                <span className="ml-1 text-[10px] text-blue-600 font-medium">(terfilter)</span>
              )}
            </p>
          </div>
          <p className="text-base font-bold text-slate-800">{fmt(totalBudget)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Check size={15} className="text-emerald-500" />
            <p className="text-xs text-slate-500">
              Disetujui
              {isFiltered && (
                <span className="ml-1 text-[10px] text-blue-600 font-medium">(terfilter)</span>
              )}
            </p>
          </div>
          <p className="text-base font-bold text-emerald-700">{fmt(approvedBudget)}</p>
        </div>
      </div>

      {/* Per-division stats */}
      {divisions.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Statistik per Divisi
          </p>
          <div className="space-y-1.5">
            {divisions.map(d => {
              const s = perDivisionStats.map[d.id] ?? { count: 0, total: 0 };
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0"
                >
                  <span className="text-slate-600 font-medium">{d.name}</span>
                  <span className="text-slate-500">
                    {s.count} pengadaan · <span className="font-semibold text-slate-700">{fmt(s.total)}</span>
                  </span>
                </div>
              );
            })}
            {perDivisionStats.noDivCount > 0 && (
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-500 italic">Tanpa Divisi</span>
                <span className="text-slate-500">
                  {perDivisionStats.noDivCount} pengadaan · <span className="font-semibold text-slate-700">{fmt(perDivisionStats.noDivTotal)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info: approve auto-inject */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2">
        <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Menyetujui pengadaan akan otomatis menambahkan barang ke <b>Inventaris</b> (tipe
          berulang) atau <b>Kebutuhan Posko</b> (tipe habis pakai).
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama barang, divisi, alasan, atau status..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Division tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          onClick={() => setActiveDivisionId('ALL')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
            activeDivisionId === 'ALL'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Semua
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeDivisionId === 'ALL'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {procurements.length}
          </span>
        </button>
        {divisions.map(d => {
          const count = perDivisionStats.map[d.id]?.count ?? 0;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDivisionId(d.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                activeDivisionId === d.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {d.name}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeDivisionId === d.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        {perDivisionStats.noDivCount > 0 && (
          <button
            onClick={() => setActiveDivisionId('__none__')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
              activeDivisionId === '__none__'
                ? 'bg-slate-700 text-white'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            Tanpa Divisi
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {perDivisionStats.noDivCount}
            </span>
          </button>
        )}
      </div>

      {/* Type tabs: Inventaris vs Habis Pakai */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { id: 'ALL' as const, label: 'Semua Tipe', icon: ShoppingCart, accent: 'slate' },
          { id: 'inventaris' as const, label: 'Inventaris', icon: Warehouse, accent: 'blue' },
          { id: 'posko' as const, label: 'Habis Pakai', icon: ShoppingBag, accent: 'rose' },
        ]).map(t => {
          const count =
            t.id === 'ALL'
              ? procurements.length
              : procurements.filter(p => p.procurement_type === t.id).length;
          const Icon = t.icon;
          const active = activeType === t.id;
          const activeCls =
            t.accent === 'blue'
              ? 'bg-blue-600 text-white border-blue-600'
              : t.accent === 'rose'
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-slate-800 text-white border-slate-800';
          const idleCls = 'bg-white text-slate-600 border-slate-200';
          return (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                active ? activeCls : idleCls
              }`}
            >
              <Icon size={13} />
              {t.label}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pending count hint */}
      {pendingCount > 0 && activeDivisionId === 'ALL' && activeType === 'ALL' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
          <Clock size={13} />
          {pendingCount} permintaan menunggu persetujuan
        </div>
      )}

      {/* List */}
      {filteredProcurements.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={44} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {searchQuery || activeDivisionId !== 'ALL' || activeType !== 'ALL'
              ? 'Tidak ada pengadaan yang cocok'
              : 'Belum ada permintaan pengadaan'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProcurements.map(proc => {
            const cfg = statusConfig[proc.status] ?? {
              label: proc.status,
              color: 'border-l-slate-400',
              dot: 'bg-slate-400',
            };
            if (!statusConfig[proc.status]) {
              console.warn('Unknown procurement status:', proc.status);
            }
            const total = proc.estimated_price * proc.quantity;
            const divName = resolveDivisionName(proc);
            const catName = resolveProcurementCategoryName(proc);
            const tcfg = typeConfig[proc.procurement_type ?? 'inventaris'];
            const TypeIcon = tcfg.icon;
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
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tcfg.color}`}
                        >
                          <TypeIcon size={10} />
                          {tcfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {proc.quantity} unit · {fmt(proc.estimated_price)}/unit
                      </p>
                      {(divName || catName) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {divName && (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-100">
                              Divisi {divName}
                            </span>
                          )}
                          {catName && (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full border border-blue-100">
                              <Tag size={10} />
                              Masuk ke {catName}
                            </span>
                          )}
                        </div>
                      )}
                      {proc.reason && (
                        <p className="text-xs text-slate-400 mt-1.5 italic">"{proc.reason}"</p>
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
                          ? proc.procurement_type === 'posko'
                            ? 'Telah ditambahkan ke Kebutuhan Posko'
                            : 'Barang telah ditambahkan ke inventaris'
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
