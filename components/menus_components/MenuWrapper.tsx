import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

interface MenuWrapperProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  description?: string;
  headerActions?: React.ReactNode;
}

export const MenuWrapper: React.FC<MenuWrapperProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  description,
  headerActions
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 mb-6">
      {/* Header / Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-6 border-b border-slate-100 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left flex-1">
          <div className="bg-emerald-50 p-2 rounded-xl">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          <div className={`ml-2 p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {isOpen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {headerActions && (
            <div onClick={e => e.stopPropagation()}>
              {headerActions}
            </div>
          )}
          <div className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );
};
