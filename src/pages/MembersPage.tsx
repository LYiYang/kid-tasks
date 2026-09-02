import { useState, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import type { Member, MemberRole } from '../types';
import './MembersPage.css';

const AVATARS = ['🐰', '🐱', '🐻', '🦊', '🐸'];
const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b'];

export function MembersPage() {
  const { members, activeMember, addMember, deleteMember, switchMember, isAdmin, parentUnlocked } = useStore();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [role, setRole] = useState<MemberRole>('kid');

  const canManageMembers = isAdmin || parentUnlocked;
  const shownMembers = canManageMembers ? members : [activeMember];

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addMember(name, avatar, color, role);
    setName('');
  };

  const handleDelete = (member: Member) => {
    if (member.id === activeMember.id) {
      alert('不能删除当前正在使用的成员');
      return;
    }
    if (confirm(`确定删除「${member.name}」吗？`)) {
      deleteMember(member.id);
    }
  };

  return (
    <section className="page">
      <h2 className="page-title">成员管理</h2>
      <p className="page-desc">
        {isAdmin
          ? '管理员可以管理所有成员；宝宝只能看到自己的任务。'
          : '宝宝只能看到和添加自己的任务，删除任务需要爸爸妈妈权限。'}
      </p>

      <ul className="member-list">
        {shownMembers.map((m) => (
          <li
            key={m.id}
            className={`member-item${m.id === activeMember.id ? ' member-item-active' : ''}`}
          >
            <span className="member-avatar" style={{ backgroundColor: m.color }}>
              {m.avatar}
            </span>
            <span className="member-info">
              <span className="member-name">{m.name}</span>
              <span className="member-meta">
                <span className={`member-role member-role-${m.role}`}>
                  {m.role === 'admin' ? '管理员' : '宝宝'}
                </span>
                {m.id === activeMember.id && <span className="member-tag">当前使用</span>}
              </span>
            </span>
            <div className="member-actions">
              {m.id !== activeMember.id && (
                <button
                  className="member-use-btn"
                  type="button"
                  onClick={() => switchMember(m.id)}
                >
                  使用
                </button>
              )}
              {canManageMembers && (
                <button
                  className="member-del-btn"
                  type="button"
                  onClick={() => handleDelete(m)}
                  aria-label={`删除 ${m.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManageMembers && (
        <form className="member-form" onSubmit={handleAdd}>
          <input
            className="member-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="添加新成员..."
            aria-label="成员名称"
          />
          <div className="member-role-picker">
            {(['kid', 'admin'] as MemberRole[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`member-role-btn${role === r ? ' member-role-btn-active' : ''}`}
                onClick={() => setRole(r)}
              >
                {r === 'kid' ? '宝宝' : '管理员'}
              </button>
            ))}
          </div>
          <div className="member-pickers">
            <div className="member-avatar-picker">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`member-avatar${avatar === a ? ' member-avatar-active' : ''}`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="member-color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  className={`member-color${color === c ? ' member-color-active' : ''}`}
                  onClick={() => setColor(c)}
                  aria-label={`选择颜色 ${c}`}
                />
              ))}
            </div>
          </div>
          <button className="member-add-btn" type="submit">
            添加成员
          </button>
        </form>
      )}
    </section>
  );
}
