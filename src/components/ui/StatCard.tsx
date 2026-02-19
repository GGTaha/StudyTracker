import React from 'react';
export const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; colorClass: string; bgClass: string }> = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[16px] p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors shadow-sm">
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1.5">{title}</p>
      <p className="text-[1.85rem] font-bold text-slate-50 leading-tight">{value}</p>
    </div>
    <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
      <Icon size={22} />
    </div>
  </div>
);
