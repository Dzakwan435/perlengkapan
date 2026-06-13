'use client';

import React, { useMemo } from 'react';
import {
  Package,
  ArrowLeftRight,
  ShoppingCart,
  CalendarDays,
  Home,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Tags,
  Users,
  DollarSign,
} from 'lucide-react';
import {
  InventoryItem,
  InventoryCategory,
  Borrowing,
  BorrowingDetail,
  Program,
  PoskoNeed,
  Procurement,
  Division,
  TabType,
} from '../types';
import { resolveCategoryName, resolveDivisionName } from '../lib/supabase';

interface DashboardViewProps {
  inventory: InventoryItem[];
  categories: InventoryCategory[];
  borrowings: Borrowing[];
  borrowingDetails: BorrowingDetail[];
  programs: Program[];
  poskoNeeds: PoskoNeed[];
  procurements: Procurement[];
  divisions: Division[];
  onNavigate: (tab: TabType) => void;
  onOpenBorrow: () => void;
  onOpenProcurement: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function DashboardView({
  inventory,
  categories,
  borrowings,
  borrowingDetails,
  programs,
  poskoNeeds,
  procurements,
  divisions,
  onNavigate,
  onOpenBorrow,
  onOpenProcurement,
}: DashboardViewProps) {
  const totalItems = inventory.reduce((s, i) => s + i.quantity, 0);
  const activeBorrowings = borrowings.filter(b => b.status === 'Dipinjam').length;
  const pendingProcurements = procurements.filter(p => p.status === 'Menunggu').length;
  const poskoUnbought = poskoNeeds.filter(p => p.status === 'Belum Dibeli').length;
  const poskoBought = poskoNeeds.filter(p => p.status === 'Sudah Dibeli').length;
  const totalProcurementCost = procurements.reduce(
    (s, p) => s + p.estimated_price * p.quantity,
    0
  );

  const upcomingPrograms = [...programs]
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Statistik inventaris per kategori
  const perCategory = useMemo(() => {
    const map: Record<string, { count: number; qty: number }> = {};
    categories.forEach(c => {
      map[c.id] = { count: 0, qty: 0 };
    });
    let uncategorized = { count: 0, qty: 0 };
    inventory.forEach(item => {
      if (item.category_id && map[item.category_id]) {
        map[item.category_id].count += 1;
        map[item.category_id].qty += item.quantity;
      } else {
        uncategorized.count += 1;
        uncategorized.qty += item.quantity;
      }
    });
    return { map, uncategorized };
  }, [inventory, categories]);

  // Statistik pengadaan per divisi
  const perDivision = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    divisions.forEach(d => {
      map[d.id] = { count: 0, total: 0 };
    });
    let noDiv = { count: 0, total: 0 };
    procurements.forEach(p => {
      const cost = p.estimated_price * p.quantity;
      if (p.division_id && map[p.division_id]) {
        map[p.division_id].count += 1;
        map[p.division_id].total += cost;
      } else {
        noDiv.count += 1;
        noDiv.total += cost;
      }
    });
    return { map, noDiv };
  }, [procurements, divisions]);

  const stats = [
    {
      label: 'Total Barang',
      value: totalItems,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      tab: 'inventory' as TabType,
    },
    {
      label: 'Dipinjam',
      value: activeBorrowings,
      icon: ArrowLeftRight,
      color: 'bg-amber-50 text-amber-600',
      tab: 'inventory' as TabType,
    },
    {
      label: 'Pengadaan',
      value: pendingProcurements,
      icon: ShoppingCart,
      color: 'bg-indigo-50 text-indigo-600',
      tab: 'procurements' as TabType,
    },
    {
      label: 'Posko Belum',
      value: poskoUnbought,
      icon: Home,
      color: 'bg-rose-50 text-rose-600',
      tab: 'posko' as TabType,
    },
  ];

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Selamat datang 👋</h1>
        <p className="text-sm text-slate-500 mt-0.5">KKN-PPM Desa Sejahtera 2026</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => onNavigate(stat.tab)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenBorrow}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftRight size={16} />
            Pinjam Barang
          </button>
          <button
            onClick={onOpenProcurement}
            className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <PlusCircle size={16} />
            Lapor Pengadaan
          </button>
        </div>
      </div>

      {/* Widget: Inventaris */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Inventaris</h2>
              <p className="text-[10px] text-slate-400">
                {inventory.length} jenis barang · {categories.length} kategori · {totalItems} unit
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs text-blue-600 font-medium"
          >
            Buka
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Belum ada kategori</p>
        ) : (
          <div className="space-y-1.5">
            {categories.map(c => {
              const s = perCategory.map[c.id] ?? { count: 0, qty: 0 };
              const pct = totalItems ? Math.round((s.qty / totalItems) * 100) : 0;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0"
                >
                  <Tags size={13} className="text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-700 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {s.count} jenis · {s.qty} unit
                      </p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {perCategory.uncategorized.count > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 text-slate-400 italic">
                <span>Tanpa Kategori</span>
                <span>
                  {perCategory.uncategorized.count} jenis · {perCategory.uncategorized.qty} unit
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Widget: Pengadaan */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShoppingCart size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Pengadaan</h2>
              <p className="text-[10px] text-slate-400">
                {procurements.length} permintaan · total {fmt(totalProcurementCost)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('procurements')}
            className="text-xs text-blue-600 font-medium"
          >
            Buka
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-slate-500">
              <DollarSign size={12} />
              <p className="text-[10px] uppercase font-semibold tracking-wide">Total Biaya</p>
            </div>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{fmt(totalProcurementCost)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock size={12} />
              <p className="text-[10px] uppercase font-semibold tracking-wide">Menunggu</p>
            </div>
            <p className="text-sm font-bold text-amber-600 mt-0.5">{pendingProcurements}</p>
          </div>
        </div>

        {divisions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-2">Belum ada divisi</p>
        ) : (
          <div className="space-y-1.5">
            {divisions.map(d => {
              const s = perDivision.map[d.id] ?? { count: 0, total: 0 };
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-slate-400" />
                    <span className="text-slate-700 font-medium">{d.name}</span>
                  </div>
                  <span className="text-slate-500">
                    {s.count} · <span className="font-semibold text-slate-700">{fmt(s.total)}</span>
                  </span>
                </div>
              );
            })}
            {perDivision.noDiv.count > 0 && (
              <div className="flex items-center justify-between text-xs py-1.5 text-slate-400 italic">
                <span>Tanpa Divisi</span>
                <span>
                  {perDivision.noDiv.count} · <span className="font-semibold">{fmt(perDivision.noDiv.total)}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Widget: Posko */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <Home size={16} className="text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Kebutuhan Posko</h2>
              <p className="text-[10px] text-slate-400">
                {poskoNeeds.length} item terdaftar
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('posko')}
            className="text-xs text-blue-600 font-medium"
          >
            Buka
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Total</p>
            <p className="text-base font-bold text-slate-800">{poskoNeeds.length}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-emerald-600 uppercase font-semibold tracking-wide">Dibeli</p>
            <p className="text-base font-bold text-emerald-700">{poskoBought}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-rose-600 uppercase font-semibold tracking-wide">Belum</p>
            <p className="text-base font-bold text-rose-700">{poskoUnbought}</p>
          </div>
        </div>
        {poskoNeeds.length > 0 && (
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{
                  width: `${(poskoBought / poskoNeeds.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Programs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Program Kerja Mendatang</h2>
          <button
            onClick={() => onNavigate('programs')}
            className="text-xs text-blue-600 font-medium"
          >
            Lihat semua
          </button>
        </div>
        {upcomingPrograms.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Belum ada program kerja</p>
        ) : (
          <div className="space-y-3">
            {upcomingPrograms.map(prog => (
              <div key={prog.id} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{prog.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(prog.event_date)}</p>
                  {prog.description && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{prog.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Borrowings */}
      {activeBorrowings > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Peminjaman Aktif</h2>
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              {activeBorrowings} aktif
            </span>
          </div>
          <div className="space-y-2">
            {borrowings
              .filter(b => b.status === 'Dipinjam')
              .slice(0, 3)
              .map(b => {
                const details = borrowingDetails.filter(d => d.borrowing_id === b.id);
                const program = programs.find(p => p.id === b.program_id);
                return (
                  <div key={b.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <Clock size={15} className="text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700">
                        {program?.name ?? 'Peminjaman Umum'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {details.length} jenis barang · {b.borrow_date}
                      </p>
                    </div>
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                      Dipinjam
                    </span>
                  </div>
                );
              })}
          </div>
          {activeBorrowings > 3 && (
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-blue-600 font-medium mt-2"
            >
              +{activeBorrowings - 3} lainnya
            </button>
          )}
        </div>
      )}

      {/* Posko needs alert */}
      {poskoUnbought > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Kebutuhan Posko</p>
            <p className="text-xs text-rose-600 mt-0.5">
              {poskoUnbought} item belum dibeli. Segera koordinasikan dengan bendahara.
            </p>
          </div>
        </div>
      )}

      {/* Pending procurements alert */}
      {pendingProcurements > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ShoppingCart size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Pengadaan Menunggu</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {pendingProcurements} permintaan pengadaan menunggu persetujuan.
            </p>
          </div>
        </div>
      )}

      {activeBorrowings === 0 && poskoUnbought === 0 && pendingProcurements === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">Semua aman!</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Tidak ada item mendesak yang perlu ditangani.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
