'use client';

import React from 'react';
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
} from 'lucide-react';
import {
  InventoryItem,
  Borrowing,
  BorrowingDetail,
  Program,
  PoskoNeed,
  Procurement,
  TabType,
} from '../types';

interface DashboardViewProps {
  inventory: InventoryItem[];
  borrowings: Borrowing[];
  borrowingDetails: BorrowingDetail[];
  programs: Program[];
  poskoNeeds: PoskoNeed[];
  procurements: Procurement[];
  onNavigate: (tab: TabType) => void;
  onOpenBorrow: () => void;
  onOpenProcurement: () => void;
}

export default function DashboardView({
  inventory,
  borrowings,
  borrowingDetails,
  programs,
  poskoNeeds,
  procurements,
  onNavigate,
  onOpenBorrow,
  onOpenProcurement,
}: DashboardViewProps) {
  const totalItems = inventory.reduce((s, i) => s + i.quantity, 0);
  const activeBorrowings = borrowings.filter(b => b.status === 'Dipinjam').length;
  const pendingProcurements = procurements.filter(p => p.status === 'Menunggu').length;
  const poskoUnbought = poskoNeeds.filter(p => p.status === 'Belum Dibeli').length;

  const upcomingPrograms = [...programs]
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

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
