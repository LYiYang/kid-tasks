import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  getWeekStart,
  getWeekDays,
  todayString,
  taskVisibleOnDate,
  taskDoneOnDate,
  visibleDaysInRange,
} from '../utils/date';
import './HomePage.css';

export function HomePage() {
  const { visibleTasks, rewards, points, term } = useStore();
  const today = todayString();
  const weekStart = getWeekStart(today);
  const weekDays = getWeekDays(weekStart);

  const weekPlanned = weekDays.reduce(
    (acc, day) =>
      acc +
      visibleTasks.filter((t) =>
        taskVisibleOnDate(t.planDate, t.endDate, day, t.excludedDates, t.excludedWeekdays, t.scope),
      ).length,
    0,
  );
  const weekDone = weekDays.reduce(
    (acc, day) =>
      acc +
      visibleTasks.filter(
        (t) =>
          taskVisibleOnDate(t.planDate, t.endDate, day, t.excludedDates, t.excludedWeekdays, t.scope) &&
          taskDoneOnDate(t.completedDates, day),
      ).length,
    0,
  );

  const termTasks = visibleTasks.filter((t) => t.scope === 'term');
  const termPlanned = termTasks.reduce(
    (acc, t) =>
      acc + visibleDaysInRange(term.start, term.end, t.excludedDates, t.excludedWeekdays),
    0,
  );
  const termDone = termTasks.reduce(
    (acc, t) => acc + t.completedDates.length,
    0,
  );
  const termPending = termTasks.filter((t) =>
    t.completedDates.length <
    visibleDaysInRange(term.start, term.end, t.excludedDates, t.excludedWeekdays),
  );

  const claimedRewards = rewards.filter((r) => r.claimed).length;
  const hasTasks = visibleTasks.length > 0;

  return (
    <section className="page">
      <div className="home-points-card">
        <span className="home-points-label">当前积分</span>
        <span className="home-points-value">{points} ⭐</span>
      </div>

      <div className="home-stats">
        <div className="home-stat">
          <span className="home-stat-value">
            {weekDone}/{weekPlanned}
          </span>
          <span className="home-stat-label">本周完成</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">{claimedRewards}</span>
          <span className="home-stat-label">已获奖励</span>
        </div>
      </div>

      <div className="home-week-card">
        <h3 className="home-card-title">本周进度</h3>
        <div className="home-week-bars">
          {weekDays.map((day) => {
            const dayTasks = weekTasksForDay(visibleTasks, day);
            const dayTotals = dayTasks.reduce(
              (acc, t) => {
                const planned = 1;
                const done = taskDoneOnDate(t.completedDates, day) ? 1 : 0;
                return { planned: acc.planned + planned, done: acc.done + done };
              },
              { planned: 0, done: 0 },
            );
            const pct = dayTotals.planned
              ? Math.round((dayTotals.done / dayTotals.planned) * 100)
              : 0;
            return (
              <div
                key={day}
                className={`home-week-bar${day === today ? ' home-week-bar-today' : ''}`}
              >
                <div className="home-week-bar-fill" style={{ height: `${pct}%` }} />
              </div>
            );
          })}
        </div>
        <div className="home-week-labels">
          {weekDays.map((d) => {
            const label = ['日', '一', '二', '三', '四', '五', '六'][
              new Date(d).getDay()
            ];
            return (
              <span key={d} className={d === today ? 'home-week-label-today' : ''}>
                {label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="home-term-card">
        <h3 className="home-card-title">
          本学期（完成 {termDone} / {termPlanned} 天）
        </h3>
        {termPending.length === 0 ? (
          <p className="home-term-empty">
            {termPlanned === 0
              ? '本学期还没有安排任务'
              : '本学期计划已全部完成 🎉'}
          </p>
        ) : (
          <ul className="home-term-list">
            {termPending.map((task) => (
              <li key={task.id} className="home-term-item">
                <span className="home-term-name">{task.title}</span>
                <span className="home-term-date">
                  剩 {taskRemainingDays(task, term.start, term.end)} 天
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!hasTasks && (
        <p className="home-desc">还没有任务，先去添加今天的计划吧！</p>
      )}

      <Link className="page-action" to="/week">
        去体验周计划 →
      </Link>
    </section>
  );
}

function weekTasksForDay(
  tasks: { planDate: string; endDate?: string; completedDates: string[]; excludedDates?: string[]; excludedWeekdays?: number[]; scope?: string }[],
  day: string,
) {
  return tasks.filter((t) =>
    taskVisibleOnDate(t.planDate, t.endDate, day, t.excludedDates, t.excludedWeekdays, t.scope),
  );
}

function taskRemainingDays(
  task: {
    planDate: string;
    endDate?: string;
    completedDates: string[];
    excludedDates?: string[];
    excludedWeekdays?: number[];
  },
  regionStart: string,
  regionEnd: string,
): number {
  const visible = visibleDaysInRange(
    regionStart,
    regionEnd,
    task.excludedDates,
    task.excludedWeekdays,
  );
  return Math.max(0, visible - task.completedDates.length);
}
