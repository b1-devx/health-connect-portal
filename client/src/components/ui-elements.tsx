import React from "react";

export function PageHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-slate-500 font-medium">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-6 text-slate-500 font-medium animate-pulse">Loading securely...</p>
    </div>
  );
}

export function Card({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 ${onClick ? 'cursor-pointer hover-lift' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 font-display">{title}</h3>
      <p className="mt-2 text-slate-500 max-w-md">{description}</p>
    </div>
  );
}
