'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  Info,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileDown,
} from 'lucide-react';
import { Program, ProgramNeed, InventoryItem } from '../types';
import { exportProgramsCSV, exportProgramsPDF } from '../lib/export';

interface ProgramsViewProps {
  programs: Program[];
  programNeeds: ProgramNeed[];
  inventory: InventoryItem[];
  onAddProgram: () => void;
  onDeleteProgram: (id: string) => void;
  onAddNeed: (programId: string) => void;
  onDeleteNeed: (id: string) => void;
}

function getNeedStatus(
  need: ProgramNeed,
  inventory: InventoryItem[]
): 'available' | 'insufficient' | 'not-found' {
  const item = inventory.find(
    i => i.item_name.toLowerCase() === need.item_name.toLowerCase()
  );
  if (!item) return 'not-found';
  if (item.quantity >= need.quantity) return 'available';
  return 'insufficient';
}

const statusIcon = {
  available: <CheckCircle2 size={13} className="text-emerald-500" />,
  insufficient: <AlertCircle size={13} className="text-amber-500" />,
  'not-found': <XCircle size={13} className="text-rose-500" />,
};

const statusColor = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  insufficient: 'bg-amber-50 text-amber-700 border-amber-100',
  'not-found': 'bg-rose-50 text-rose-700 border-rose-100',
};

const statusLabel = {
  available: 'Tersedia',
  insufficient: 'Kurang',
  'not-found': 'Tidak Ada',
};

export default function ProgramsView({
  programs,
  programNeeds,
  inventory,
  onAddProgram,
  onDeleteProgram,
  onAddNeed,
  onDeleteNeed,
}: ProgramsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(programs[0]?.id ?? null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const daysUntil = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Program Kerja</h1>
          <p className="text-xs text-slate-500">{programs.length} program terdaftar</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddProgram}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            Tambah
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
                  onClick={() => { exportProgramsPDF(programs, programNeeds); setShowExportMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => { exportProgramsCSV(programs, programNeeds); setShowExportMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Programs list */}
      {programs.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays size={44} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Belum ada program kerja</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map(prog => {
            const needs = programNeeds.filter(pn => pn.program_id === prog.id);
            const isExpanded = expandedId === prog.id;
            const days = daysUntil(prog.event_date);

            return (
              <div
                key={prog.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                {/* Card header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : prog.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{prog.name}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            days < 0
                              ? 'bg-slate-100 text-slate-500'
                              : days <= 7
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {days < 0
                            ? 'Selesai'
                            : days === 0
                            ? 'Hari ini'
                            : `${days} hari lagi`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                        <CalendarDays size={12} />
                        {formatDate(prog.event_date)}
                      </div>
                      {prog.description && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{prog.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Hapus "${prog.name}"?`)) onDeleteProgram(prog.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded: kebutuhan proker */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 pb-4">
                    <div className="flex items-center justify-between mt-3 mb-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Kebutuhan Barang
                      </p>
                      <button
                        onClick={() => onAddNeed(prog.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700"
                      >
                        <Plus size={12} />
                        Tambah
                      </button>
                    </div>

                    {needs.length === 0 ? (
                      <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                        <Info size={14} className="text-slate-400" />
                        <p className="text-xs text-slate-500">Belum ada kebutuhan barang</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {needs.map(need => {
                          const status = getNeedStatus(need, inventory);
                          return (
                            <div
                              key={need.id}
                              className={`flex items-center justify-between rounded-xl p-2.5 border ${statusColor[status]}`}
                            >
                              <div className="flex items-center gap-2">
                                {statusIcon[status]}
                                <div>
                                  <p className="text-xs font-medium">{need.item_name}</p>
                                  <p className="text-[10px] opacity-75">
                                    Butuh: {need.quantity} unit · {statusLabel[status]}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => onDeleteNeed(need.id)}
                                className="p-1 hover:opacity-70 transition-opacity"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {needs.length > 0 && (
                      <div className="mt-3 bg-slate-50 rounded-xl p-3 flex items-start gap-2">
                        <Package size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-slate-500">
                          Status barang disinkronkan dengan inventaris. Hijau = stok cukup, kuning = stok kurang, merah = tidak ada di inventaris.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
