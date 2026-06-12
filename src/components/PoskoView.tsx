'use client';

import React, { useState } from 'react';
import {
  Home,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Search,
  StickyNote,
} from 'lucide-react';
import { PoskoNeed } from '../types';

interface PoskoViewProps {
  poskoNeeds: PoskoNeed[];
  onAddNeed: () => void;
  onEditNeed: (need: PoskoNeed) => void;
  onToggleStatus: (id: string) => void;
  onDeleteNeed: (id: string) => void;
}

export default function PoskoView({
  poskoNeeds,
  onAddNeed,
  onEditNeed,
  onToggleStatus,
  onDeleteNeed,
}: PoskoViewProps) {
  const [filter, setFilter] = useState<'Semua' | 'Belum Dibeli' | 'Sudah Dibeli'>('Semua');
  const [search, setSearch] = useState('');

  const boughtCount = poskoNeeds.filter(p => p.status === 'Sudah Dibeli').length;
  const unboughtCount = poskoNeeds.filter(p => p.status === 'Belum Dibeli').length;

  const filtered = poskoNeeds.filter(p => {
    const matchFilter = filter === 'Semua' || p.status === filter;
    const matchSearch = p.item_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Kebutuhan Posko</h1>
          <p className="text-xs text-slate-500">{poskoNeeds.length} item terdaftar</p>
        </div>
        <button
          onClick={onAddNeed}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          Tambah
        </button>
      </div>

      {/* Progress summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600">Progress Pembelian</p>
          <p className="text-xs text-slate-500">
            {boughtCount}/{poskoNeeds.length} dibeli
          </p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{
              width: poskoNeeds.length
                ? `${(boughtCount / poskoNeeds.length) * 100}%`
                : '0%',
            }}
          />
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <p className="text-xs text-slate-600">{boughtCount} sudah dibeli</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle size={13} className="text-slate-400" />
            <p className="text-xs text-slate-600">{unboughtCount} belum dibeli</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['Semua', 'Belum Dibeli', 'Sudah Dibeli'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Home size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Tidak ada item ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(need => {
            const done = need.status === 'Sudah Dibeli';
            return (
              <div
                key={need.id}
                className={`bg-white rounded-2xl border shadow-sm flex items-center gap-3 px-4 py-3 transition-colors ${
                  done ? 'border-emerald-100 opacity-75' : 'border-slate-100'
                }`}
              >
                {/* Toggle status */}
                <button
                  onClick={() => onToggleStatus(need.id)}
                  className="flex-shrink-0"
                >
                  {done ? (
                    <CheckCircle2 size={22} className="text-emerald-500" />
                  ) : (
                    <Circle size={22} className="text-slate-300 hover:text-emerald-400 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      done ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {need.item_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {need.quantity} unit
                    {need.notes && (
                      <span className="ml-2 text-slate-400 inline-flex items-center gap-0.5">
                        <StickyNote size={10} />
                        {need.notes}
                      </span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEditNeed(need)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus "${need.item_name}"?`)) onDeleteNeed(need.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
