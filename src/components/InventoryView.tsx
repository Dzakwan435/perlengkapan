'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Pencil,
  Trash2,
  ArrowLeftRight,
  RotateCcw,
  Package,
  MapPin,
  Tag,
} from 'lucide-react';
import { InventoryItem, Borrowing, BorrowingDetail, Program } from '../types';

const CATEGORIES = ['Semua', 'Peralatan', 'Elektronik', 'Furnitur', 'Outdoor', 'Audio', 'Kesehatan', 'Aksesoris', 'Lainnya'];
const CONDITIONS = ['Semua', 'Baik', 'Rusak', 'Hilang'];

const conditionColor: Record<string, string> = {
  Baik: 'bg-emerald-100 text-emerald-700',
  Rusak: 'bg-rose-100 text-rose-700',
  Hilang: 'bg-slate-100 text-slate-600',
};

interface InventoryViewProps {
  inventory: InventoryItem[];
  borrowings: Borrowing[];
  borrowingDetails: BorrowingDetail[];
  programs: Program[];
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenBorrow: () => void;
  onReturnBorrowing: (borrowingId: string) => void;
}

export default function InventoryView({
  inventory,
  borrowings,
  borrowingDetails,
  programs,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenBorrow,
  onReturnBorrowing,
}: InventoryViewProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [activeCondition, setActiveCondition] = useState('Semua');
  const [showBorrowings, setShowBorrowings] = useState(true);

  const activeBorrowings = borrowings.filter(b => b.status === 'Dipinjam');

  const filtered = inventory.filter(item => {
    const matchSearch =
      item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      item.storage_location.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'Semua' || item.category === activeCategory;
    const matchCond = activeCondition === 'Semua' || item.condition === activeCondition;
    return matchSearch && matchCat && matchCond;
  });

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Inventaris</h1>
          <p className="text-xs text-slate-500">{inventory.length} jenis barang terdaftar</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenBorrow}
            className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <ArrowLeftRight size={15} />
            Pinjam
          </button>
          <button
            onClick={onAddItem}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            Tambah
          </button>
        </div>
      </div>

      {/* Active Borrowings */}
      {activeBorrowings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-3 text-sm font-semibold text-amber-800"
            onClick={() => setShowBorrowings(v => !v)}
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-amber-600" />
              Peminjaman Aktif
              <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeBorrowings.length}
              </span>
            </div>
            <span className="text-amber-500 text-xs">{showBorrowings ? '▲' : '▼'}</span>
          </button>
          {showBorrowings && (
            <div className="px-3 pb-3 space-y-2">
              {activeBorrowings.map(b => {
                const details = borrowingDetails.filter(d => d.borrowing_id === b.id);
                const program = programs.find(p => p.id === b.program_id);
                const itemNames = details
                  .map(d => {
                    const inv = inventory.find(i => i.id === d.inventory_id);
                    return inv ? `${inv.item_name} (${d.quantity})` : '';
                  })
                  .filter(Boolean)
                  .join(', ');
                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-xl p-3 flex items-start justify-between gap-3 border border-amber-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {program?.name ?? 'Peminjaman Umum'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{itemNames}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.borrow_date}</p>
                    </div>
                    <button
                      onClick={() => onReturnBorrowing(b.id)}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors flex-shrink-0"
                    >
                      <RotateCcw size={12} />
                      Kembalikan
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari barang atau lokasi..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Condition filter */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-slate-400" />
        <div className="flex gap-2">
          {CONDITIONS.map(cond => (
            <button
              key={cond}
              onClick={() => setActiveCondition(cond)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCondition === cond
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Tidak ada barang ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{item.item_name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      <Tag size={10} />
                      {item.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor[item.condition] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {item.condition}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">
                      <MapPin size={10} />
                      {item.storage_location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEditItem(item)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus "${item.item_name}"?`)) onDeleteItem(item.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                <div>
                  <p className="text-xs text-slate-400">Jumlah Tersedia</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {item.quantity}
                    <span className="text-sm font-normal text-slate-400 ml-1">unit</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
