import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  ShoppingBag, ChefHat, LayoutGrid, LogOut, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const user = useAppStore(state => state.user);
  const logout = useAppStore(state => state.logout);
  const navigate = useNavigate();

  const navItems = [
    { id: '/kasir', icon: ShoppingBag, label: 'Kasir / POS' },
    { id: '/kds', icon: ChefHat, label: 'Kitchen (KDS)' },
    { id: '/meja', icon: LayoutGrid, label: 'Manajemen Meja' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={cn(
      "h-full flex flex-col transition-all duration-300",
      "bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Brand */}
      <div className={cn(
        "h-16 flex items-center shrink-0 px-4 border-b border-zinc-200 dark:border-zinc-800",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center font-black text-lg">P</div>
            <span className="font-black text-sm tracking-tighter text-zinc-900 dark:text-white uppercase">POS Client</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center font-black text-lg">P</div>
        )}
        {!isCollapsed && (
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 h-8 w-8">
            <ChevronLeft size={16} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.id}
              to={item.id}
              className={({ isActive }) => cn(
                "flex items-center transition-all duration-300 group",
                isCollapsed 
                  ? "justify-center w-10 h-10 mx-auto px-0 rounded-lg" 
                  : "gap-4 px-4 py-2.5 rounded-lg",
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 font-bold border border-zinc-200 dark:border-zinc-700"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              )}
              onClick={onClose}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
        {!isCollapsed ? (
          <div className="flex items-center gap-4 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
             <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white font-black text-xs">
                {user?.name?.[0] || 'C'}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user?.name || 'Cashier'}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider">POS Operator</p>
             </div>
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={handleLogout} 
               className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
               title="Sign Out"
             >
                <LogOut size={16} />
             </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="w-10 h-10 mx-auto flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
