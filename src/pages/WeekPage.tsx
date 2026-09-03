import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Celebration } from '../components/Celebration';
import { MemberAvatar } from '../components/MemberAvatar';
import { DeleteTaskDialog } from '../components/DeleteTaskDialog';
import { addDays, formatDisplayDate, getDayLabel, getWeekDays, getWeekStart, taskVisibleOnDate, taskDoneOnDate, todayString } from '../utils/date';
import type { Task, TaskPeriod } from '../types';
import './WeekPage.css';

const PERIOD_META: Record<TaskPeriod, { label: string; emoji: string }> = {
  morning: { label: '上午', emoji: '🌅' },
  afternoon: { label: '下午', emoji: '☀️' },
  evening: { label: '晚间', emoji: '🌙' },
  other: { label: '其他', emoji: '' },
};

const PERIOD_ORDER: TaskPeriod[] = ['morning', 'afternoon', 'evening', 'other'];

export function WeekPage() {
  const { tasks, visibleTasks, addTask, toggleTask, deleteTask, removeTaskFromDate, removeTaskFromWeekday, members, isAdmin, activeMember } = useStore();
  const today = todayString();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [celebrating, setCelebrating] = useState(false);
  const [ownerId, setOwnerId] = useState(activeMember.id);
  const [deleteTarget, setDeleteTarget] = useState<{ task: Task; day: string } | null>(null);

  const kidMembers = members.filter((m) => m.role === 'kid');

  const scopedTasks = isAdmin
    ? tasks.filter((t) => t.ownerId === ownerId)
    : visibleTasks;

  const handleToggle = (id: string, day: string) => {
    const task = scopedTasks.find((t) => t.id === id);
    if (!task) return;
    if (!taskDoneOnDate(task.completedDates, day)) setCelebrating(true);
    toggleTask(id, day);
  };

  const weekDays = getWeekDays(weekStart);
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = today >= weekStart && today <= weekEnd;

  const tasksByDay = weekDays.map((day) =>
    scopedTasks.filter((t) =>
      taskVisibleOnDate(t.planDate, t.endDate, day, t.excludedDates, t.excludedWeekdays, t.scope),
    ),
  );

  const handleAdd = (day: string) => {
    const title = drafts[day]?.trim();
    if (!title) return;
    const owner = isAdmin ? ownerId || kidMembers[0]?.id : activeMember.id;
    addTask(title, 10, day, undefined, undefined, owner);
    setDrafts((prev) => ({ ...prev, [day]: '' }));
  };

  const total = scopedTasks.length;
  const done = scopedTasks.filter((t) =>
    taskDoneOnDate(t.completedDates, today),
  ).length;

  return (
    <section className="page">
      {celebrating && <Celebration onDone={() => setCelebrating(false)} />}
      <div className="week-header">
        <h2 className="page-title">周计划</h2>
        <span className="week-progress">
          {done}/{total} 已完成
        </span>
      </div>

      {isAdmin && (
        <label className="week-owner">
          <span>查看负责人</span>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">全部成员</option>
            {kidMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="week-nav">
        <button
          type="button"
          className="week-nav-btn"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          aria-label="上一周"
        >
          ‹
        </button>
        <span className="week-range">
          {isCurrentWeek ? '本周' : `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}`}
        </span>
        <button
          type="button"
          className="week-nav-btn"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          aria-label="下一周"
        >
          ›
        </button>
        {!isCurrentWeek && (
          <button
            type="button"
            className="week-today-btn"
            onClick={() => setWeekStart(getWeekStart(today))}
          >
            回到今天
          </button>
        )}
      </div>

      <div className="week-grid">
        {weekDays.map((day, i) => {
          const dayTasks = tasksByDay[i];
          return (
            <div
              key={day}
              className={`day-col${day === today ? ' day-col-today' : ''}`}
            >
              <div className="day-head">
                <span className="day-label">{getDayLabel(day)}</span>
                <span className="day-num">{parseDayNum(day)}</span>
              </div>

              <div className="day-tasks">
                {PERIOD_ORDER.map((period) => {
                  const periodTasks = dayTasks.filter(
                    (t) => (t.period ?? 'other') === period,
                  );
                  if (periodTasks.length === 0) return null;
                  const meta = PERIOD_META[period];
                  return (
                    <div key={period} className={`day-period day-period-${period}`}>
                      <div className="day-period-head">
                        <span>{meta.emoji} {meta.label}</span>
                        <span className="day-period-count">{periodTasks.length}</span>
                      </div>
                      <ul className="day-period-list">
                        {periodTasks.map((task) => {
                          const taskDone = taskDoneOnDate(task.completedDates, day);
                          const owner = members.find((m) => m.id === task.ownerId);
                          return (
                          <li
                            key={task.id}
                            className={`day-task${taskDone ? ' day-task-done' : ''}`}
                          >
                            <div className="day-task-top">
                              <button
                                type="button"
                                className="day-task-check"
                                onClick={() => handleToggle(task.id, day)}
                                aria-label={taskDone ? '标记为未完成' : '标记为已完成'}
                              >
                                {taskDone ? '✓' : ''}
                              </button>
                              <span className="day-task-title">{task.title}</span>
                              <MemberAvatar member={owner} size={18} />
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="day-task-delete"
                                  onClick={() => setDeleteTarget({ task, day })}
                                  aria-label="删除任务"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <span className="day-task-points">{task.points} ⭐</span>
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <form
                className="day-add"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdd(day);
                }}
              >
                <input
                  type="text"
                  value={drafts[day] ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [day]: e.target.value }))
                  }
                  placeholder="➕"
                  aria-label={`${getDayLabel(day)}添加任务`}
                />
              </form>
            </div>
          );
        })}
      </div>

      {deleteTarget && (
        <DeleteTaskDialog
          task={deleteTarget.task}
          day={deleteTarget.day}
          onClose={() => setDeleteTarget(null)}
          onDeleteAll={() => {
            deleteTask(deleteTarget.task.id);
            setDeleteTarget(null);
          }}
          onDeleteDate={() => {
            removeTaskFromDate(deleteTarget.task.id, deleteTarget.day);
            setDeleteTarget(null);
          }}
          onDeleteWeekday={() => {
            removeTaskFromWeekday(deleteTarget.task.id, new Date(deleteTarget.day).getDay());
            setDeleteTarget(null);
          }}
        />
      )}
    </section>
  );
}

function parseDayNum(day: string): number {
  return Number(day.split('-')[2]);
}
