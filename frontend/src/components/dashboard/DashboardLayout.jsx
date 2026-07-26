import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Users, Calendar, Shield, FileText, Megaphone } from 'lucide-react';

const DashboardLayout = () => {
  const navItems = [
    { to: '/dashboard/players', icon: Users, label: 'Players' },
    { to: '/dashboard/matches', icon: Calendar, label: 'Matches' },
    { to: '/dashboard/teams', icon: Shield, label: 'Teams' },
    { to: '/dashboard/contracts', icon: FileText, label: 'Contracts' },
    { to: '/dashboard/announcements', icon: Megaphone, label: 'Announcements' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="md:w-64 glass rounded-xl p-4 h-fit sticky top-24">
        <nav className="flex flex-col gap-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
