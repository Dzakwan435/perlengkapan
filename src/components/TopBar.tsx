'use client';

import React from 'react';
import { USER_AVATAR, CURRENT_USER } from '../data';

export default function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 px-4 h-[60px]">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={USER_AVATAR}
            alt="Avatar"
            className="w-9 h-9 rounded-full object-cover border-2 border-blue-100"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">KKN Logistics</p>
          <p className="text-xs text-slate-400 truncate">
            {CURRENT_USER.full_name} · {CURRENT_USER.role}
          </p>
        </div>

        {/* Badge */}
        <span className="flex-shrink-0 text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
          2026
        </span>
      </div>
    </header>
  );
}
