import React from 'react';
export const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-[24px] shadow-lg p-6 flex flex-col gap-5 ${className}`}>
    {children}
  </div>
);
