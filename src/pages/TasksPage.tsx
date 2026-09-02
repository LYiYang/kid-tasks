import { useState, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { Celebration } from '../components/Celebration';
import { MemberAvatar } from '../components/MemberAvatar';
import {
  getDayLabel,
  getWeekStart,
  todayString,
  formatDisplayDate,
  taskDoneOnDate,
} from '../utils/date';
import type { TaskScope } from '../types';
import './TasksPage.css';

const SCOPE_OPTIONS: { value: TaskScope; label: string }[] = [
  { value: 'day', label: '某天' },
  { value: 'week', label: '一周' },
  { value: 'range', label: '自由选择' },
  { value: 'term', label: '一学期' },
];

export function TasksPage() {
  const { visibleTasks, addTask, toggleTask, deleteTask, term, members, isAdmin, activeMember } = useStore();
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(10);
  const [scope, setScope] = useState<TaskScope>('day');
  const [date, setDate] = useState(todayString());
  const [endDate, setEndDate] = useState(todayString());
  const [ownerId, setOwnerId] = useState(activeMember.id);
  const [celebrating, setCelebrating] = useState(false);

  const kidMembers = members.filter((m) => m.role === 'kid');

  const handleToggle = (id: string) => {
    const task = visibleTasks.find((t) => t.id === id);
    if (!task) return;
    if (!taskDoneOnDate(task.completedDates, task.planDate)) setCelebrating(true);
    toggleTask(id, task.planDate);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const resolvedEnd = scope === 'range' && endDate >= date ? endDate : undefined;
    const owner = isAdmin ? ownerId : activeMember.id;
    addTask(title, points, date, scope, resolvedEnd, owner);
    setTitle('');
    setPoints(10);
  };

  const doneCount = visibleTasks.filter((t) =>
    taskDoneOnDate(t.completedDates, t.planDate),
  ).length;
  const scopeLabel =
    scope === 'day'
      ? getDayLabel(date)
      : scope === 'week'
        ? `一周`
        : scope === 'range'
          ? `自由日期`
          : '整个学期';

  return (
    <section className="page">
      {celebrating && <Celebration onDone={() => setCelebrating(false)} />}
      <div className="tasks-header">
        <h2 className="page-title">任务清单</h2>
        <span className="tasks-progress">
          {doneCount}/{visibleTasks.length} 已完成
        </span>
      </div>

      <form className="task-form task-form-column" onSubmit={handleSubmit}>
        <div className="task-form-row">
          <input
            className="task-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="添加一个新任务..."
            aria-label="任务名称"
          />
          <label className="task-points">
            <span>分值</span>
            <input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))}
              aria-label="任务分值"
            />
          </label>
        </div>

        {isAdmin && (
          <label className="task-owner">
            <span>负责人</span>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="">选择宝宝...</option>
              {kidMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="task-scope-row">
          <div className="task-scope-tabs">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`task-scope-tab${scope === opt.value ? ' task-scope-tab-active' : ''}`}
                onClick={() => setScope(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {scope === 'day' ? (
            <input
              className="task-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayString())}
              aria-label="选择日期"
            />
          ) : scope === 'week' ? (
            <span className="task-scope-info">{formatDisplayDate(getWeekStart(date))} 起的一整周</span>
          ) : scope === 'range' ? (
            <div className="task-range">
              <label>
                从
                <input
                  className="task-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value || todayString())}
                  aria-label="开始日期"
                />
              </label>
              <label>
                到
                <input
                  className="task-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value || todayString())}
                  aria-label="结束日期"
                />
              </label>
            </div>
          ) : (
            <span className="task-scope-info">
              {term.start} ~ {term.end}
            </span>
          )}
        </div>

        <button className="task-add-btn" type="submit">
          添加为「{scopeLabel}」
        </button>
      </form>

      {visibleTasks.length === 0 ? (
        <p className="tasks-empty">还没有任务，先添加一个吧～</p>
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => {
            const done = taskDoneOnDate(task.completedDates, task.planDate);
            const owner = members.find((m) => m.id === task.ownerId);
            return (
            <li key={task.id} className={`task-item${done ? ' task-item-done' : ''}`}>
              <button
                className="task-check"
                type="button"
                onClick={() => handleToggle(task.id)}
                aria-label={done ? '标记为未完成' : '标记为已完成'}
              >
                {done ? '✓' : ''}
              </button>
              <span className="task-title">{task.title}</span>
              <MemberAvatar member={owner} />
              <span className="task-scope-badge">{scopeBadge(task.scope)}</span>
              <span className="task-points-badge">{task.points} ⭐</span>
              {isAdmin && (
                <button
                  className="task-delete"
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  aria-label="删除任务"
                >
                  ✕
                </button>
              )}
            </li>
          );
          })}
        </ul>
      )}
    </section>
  );
}

function scopeBadge(scope?: TaskScope): string {
  if (scope === 'week') return '周';
  if (scope === 'term') return '学期';
  if (scope === 'range') return '自由';
  return '日';
}
