import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PinDialog } from '../components/PinDialog';
import './AppLayout.css';

const navItems = [
  { to: '/', label: '首页', icon: '🏠', end: true },
  { to: '/week', label: '周计划', icon: '📅' },
  { to: '/tasks', label: '任务', icon: '📋' },
  { to: '/rewards', label: '奖励', icon: '🏆' },
  { to: '/settings', label: '设置', icon: '⚙️' },
];

export function AppLayout() {
  const { activeMember, isAdmin } = useStore();
  const navigate = useNavigate();
  const [pinOpen, setPinOpen] = useState(false);

  const goMembers = () => navigate('/members');

  const handleMemberClick = () => {
    if (isAdmin) {
      goMembers();
      return;
    }
    setPinOpen(true);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">✨ 任务乐园</h1>
        <button
          type="button"
          className="app-member"
          onClick={handleMemberClick}
          aria-label="切换成员"
        >
          <span className="app-member-avatar" style={{ backgroundColor: activeMember.color }}>
            {activeMember.avatar}
          </span>
          <span className="app-member-name">{activeMember.name}</span>
          <span className="app-member-switch">切换</span>
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `nav-item${isActive ? ' nav-item-active' : ''}`
            }
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {pinOpen && (
        <PinDialog
          onClose={() => setPinOpen(false)}
          onUnlocked={() => {
            setPinOpen(false);
            goMembers();
          }}
        />
      )}
    </div>
  );
}
