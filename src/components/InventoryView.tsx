'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowLeftRight,
  RotateCcw,
  Package,
  MapPin,
  Tag,
  FileDown,
  Settings2,
} from 'lucide-react';
import {
  InventoryItem,
  InventoryCategory,
  Borrowing,
  BorrowingDetail,
  Program,
} from '../types';
import { resolveCategoryName } from '../lib/supabase';
import { exportInventoryCSV, exportInventoryPDF } from '../lib/export';

const CONDITIONS = ['Semua', 'Baik', 'Rusak', 'Hilang'];

const conditionColor: Record<string, string> = {
  Baik: 'bg-emerald-100 text-emerald-700',
  Rusak: 'bg-rose-100 text-rose-700',
  Hilang: 'bg-slate-100 text-slate-600',
};

interface InventoryViewProps {
  inventory: InventoryItem[];
  categories: InventoryCategory[];
  borrowings: Borrowing[];
  borrowingDetails: BorrowingDetail[];
  programs: Program[];
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenBorrow: () => void;
  onReturnBorrowing: (borrowingId: string) => void;
  onManageCategories: () => void;
}

export default function InventoryView({
  inventory,
  categories,
  borrowings,
  borrowingDetails,
  programs,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenBorrow,
  onReturnBorrowing,
  onManageCategories,
}: InventoryViewProps) {
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | 'ALL'>('ALL');
  const [activeCondition, setActiveCondition] = useState('Semua');
  const [showBorrowings, setShowBorrowings] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const activeBorrowings = borrowings.filter(b => b.status === 'Dipinjam');

  // Hitung jumlah item per kategori (berdasarkan category_id, fallback ke kategori tanpa id)
  const countsByCategoryId = useMemo(() => {
    const map: Record<string, number> = {};
    let uncategorized = 0;
    inventory.forEach(item => {
      if (item.category_id) {
        map[item.category_id] = (map[item.category_id] ?? 0) + 1;
      } else {
        uncategorized += 1;
      }
    });
    return { map, uncategorized };
  }, [inventory]);

  // Resolve nama kategori per item untuk filter & tampilan
  const itemsWithCategory = useMemo(
    () =>
      inventory.map(item => ({
        item,
        category_name: resolveCategoryName(item),
      })),
    [inventory]
  );

  const filtered = itemsWithCategory.filter(({ item, category_name }) => {
    const matchSearch =
      item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      item.storage_location.toLowerCase().includes(search.toLowerCase()) ||
      category_name.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategoryId === 'ALL' || item.category_id === activeCategoryId;
    const matchCond = activeCondition === 'Semua' || item.condition === activeCondition;
    return matchSearch && matchCat && matchCond;
  }).map(x => x.item);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-800">Inventaris</h1>
          <p className="text-xs text-slate-500">
            {inventory.length} jenis barang · {categories.length} kategori
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 flex-shrink-0">
          <button
            onClick={onOpenBorrow}
            className="flex items-center justify-center gap-1 bg-amber-500 text-white px-2.5 py-2 rounded-xl text-xs font-medium hover:bg-amber-600 transition-colors"
            title="Pinjam barang"
          >
            <ArrowLeftRight size={14} />
            Pinjam
          </button>
          <button
            onClick={onAddItem}
            className="flex items-center justify-center gap-1 bg-blue-600 text-white px-2.5 py-2 rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors"
            title="Tambah barang"
          >
            <Plus size={14} />
            Tambah
          </button>
          <button
            onClick={onManageCategories}
            className="flex items-center justify-center gap-1 bg-white border border-slate-200 text-slate-600 px-2.5 py-2 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors"
            title="Kelola kategori"
          >
            <Settings2 size={14} />
            Kategori
          </button>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="relative flex items-center justify-center gap-1 bg-slate-600 text-white px-2.5 py-2 rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors"
            title="Export data"
          >
            <FileDown size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Export menu (floating) */}
      {showExportMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowExportMenu(false)}
          />
          <div className="relative z-20 -mt-2">
            <div className="absolute right-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
              <button
                onClick={() => {
                  const activeCatName =
                    activeCategoryId === 'ALL'
                      ? null
                      : activeCategoryId === '__none__'
                      ? 'Tanpa Kategori'
                      : categories.find(c => c.id === activeCategoryId)?.name ?? null;
                  const titleParts = ['Data Inventaris'];
                  if (activeCatName) titleParts.push(`Kategori ${activeCatName}`);
                  if (activeCondition !== 'Semua') titleParts.push(`Kondisi ${activeCondition}`);
                  if (search.trim()) titleParts.push(`"${search.trim()}"`);
                  const title = titleParts.join(' — ');
                  exportInventoryPDF(filtered, categories, title);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Export PDF
              </button>
              <button
                onClick={() => {
                  const activeCatName =
                    activeCategoryId === 'ALL'
                      ? null
                      : activeCategoryId === '__none__'
                      ? 'Tanpa Kategori'
                      : categories.find(c => c.id === activeCategoryId)?.name ?? null;
                  const titleParts = ['inventaris'];
                  if (activeCatName) titleParts.push(activeCatName.toLowerCase());
                  if (activeCondition !== 'Semua') titleParts.push(activeCondition.toLowerCase());
                  const title = titleParts.join('-');
                  exportInventoryCSV(filtered, categories, title);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Export CSV
              </button>
            </div>
          </div>
        </>
      )}

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
          placeholder="Cari barang, lokasi, atau kategori..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          onClick={() => setActiveCategoryId('ALL')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
            activeCategoryId === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Semua
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeCategoryId === 'ALL'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {inventory.length}
          </span>
        </button>
        {categories.map(c => {
          const count = countsByCategoryId.map[c.id] ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategoryId(c.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                activeCategoryId === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {c.name}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeCategoryId === c.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        {countsByCategoryId.uncategorized > 0 && (
          <button
            onClick={() => setActiveCategoryId('__none__')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
              activeCategoryId === '__none__'
                ? 'bg-slate-700 text-white'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            Tanpa Kategori
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {countsByCategoryId.uncategorized}
            </span>
          </button>
        )}
      </div>

      {/* Condition filter */}
      <div className="flex gap-2">
        {CONDITIONS.map(cond => (
          <button
            key={cond}
            onClick={() => setActiveCondition(cond)}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCondition === cond
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {cond}
          </button>
        ))}
      </div>

      {/* Inventory list (2-column grid for visual balance) */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Tidak ada barang ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(item => {
            const catName = resolveCategoryName(item);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col"
              >
                {/* Top: name + action icons */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800 text-sm leading-snug flex-1 min-w-0">
                    {item.item_name}
                  </p>
                  <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1 -mt-1">
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus "${item.item_name}"?`)) onDeleteItem(item.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Badges: category + condition + location */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    <Tag size={10} />
                    {catName}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      conditionColor[item.condition] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.condition}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">
                    <MapPin size={10} />
                    {item.storage_location}
                  </span>
                </div>

                {/* Quantity block (symmetric footer) */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                      Jumlah Tersedia
                    </p>
                    <p className="text-2xl font-bold text-slate-800 leading-tight">
                      {item.quantity}
                      <span className="text-xs font-normal text-slate-400 ml-1">unit</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 pb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.condition === 'Baik'
                          ? 'bg-emerald-500'
                          : item.condition === 'Rusak'
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.condition}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
