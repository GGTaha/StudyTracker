import React from 'react';
export const Pill: React.FC<{ children: React.ReactNode; variant?: 'green' | 'blue' | 'gray' | 'rose' | 'indigo' }> = ({ children, variant = 'gray' }) => {
  const styles: Record<string, string> = {
    green: "bg-green-500/15 text-green-400 border border-green-500/20",
    blue: "bg-sky-500/15 text-sky-400 border border-sky-500/20",
    gray: "bg-white/10 text-slate-300 border border-white/5",
    rose: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[variant]}`}>{children}</span>;
};
