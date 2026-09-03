import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { todayString, scopeEndDate, getWeekStart } from '../utils/date';
import { TERM_TASKS } from '../data/schedule';
import type {
  Member,
  MemberRole,
  Reward,
  Task,
  TaskEvent,
  TaskScope,
  TermConfig,
} from '../types';

const TASKS_KEY = 'kid-tasks.tasks';
const REWARDS_KEY = 'kid-tasks.rewards';
const TERM_KEY = 'kid-tasks.term';
const MEMBERS_KEY = 'kid-tasks.members';
const ACTIVE_KEY = 'kid-tasks.activeMember';
const EARNED_KEY = 'kid-tasks.earnedPoints';
const DEFAULT_REWARDS: Reward[] = [
  { id: 'r-1', name: '冰淇淋', icon: '🍦', cost: 30, claimed: false },
  { id: 'r-2', name: '看动画片', icon: '📺', cost: 50, claimed: false },
  { id: 'r-3', name: '去游乐园', icon: '🎡', cost: 100, claimed: false },
];
const DEFAULT_TERM: TermConfig = {
  start: '2026-02-16',
  end: '2026-07-03',
};
const AVATARS = ['🐰', '🐱', '🐻', '🦊', '🐸'];
const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b'];

const DEFAULT_PIN = '1234';

function makeDefaultMembers(): Member[] {
  return [
    { id: 'm-1', name: '爸爸', avatar: '🐻', color: '#3b82f6', role: 'admin', parentPin: DEFAULT_PIN, createdAt: Date.now() },
    { id: 'm-2', name: '妈妈', avatar: '🐱', color: '#ec4899', role: 'admin', parentPin: DEFAULT_PIN, createdAt: Date.now() },
    { id: 'm-3', name: '阳阳', avatar: '🐰', color: '#8b5cf6', role: 'kid', createdAt: Date.now() },
    { id: 'm-4', name: '安安', avatar: '🐻‍❄️', color: '#f59e0b', role: 'kid', createdAt: Date.now() },
  ];
}

function makeDefaultTasks(term: TermConfig = DEFAULT_TERM): Task[] {
  const ownerId = 'm-3';
  return TERM_TASKS.map((item) => ({
    id: crypto.randomUUID(),
    title: item.title,
    points: 10,
    createdAt: Date.now(),
    planDate: term.start,
    endDate: term.end,
    scope: 'term' as TaskScope,
    period: item.period,
    completedDates: [],
    ownerId,
    logs: [],
  }));
}

function makeEvent(type: TaskEvent['type'], date: string, memberId: string): TaskEvent {
  return {
    id: crypto.randomUUID(),
    type,
    date,
    memberId,
    time: Date.now(),
  };
}

function migrateTask(task: Task): Task {
  const scope: TaskScope = task.scope ?? 'day';
  const endDate = task.endDate ?? task.planDate;
  const legacy = task as Task & { done?: boolean };
  const completedDates = task.completedDates ?? (legacy.done ? [task.planDate] : []);
  const logs = task.logs ?? [];
  return {
    ...task,
    scope,
    endDate,
    completedDates,
    ownerId: task.ownerId ?? 'm-3',
    logs,
  };
}

function migrateTasks(tasks: Task[]): Task[] {
  const migrated = tasks.map(migrateTask);
  const seen = new Set<string>();
  const deduped: Task[] = [];
  for (const t of migrated) {
    const key = `${t.ownerId}|${t.planDate}|${t.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(t);
  }
  return deduped;
}

function migrateMembers(members: Member[]): Member[] {
  let result: Member[] = members.map((m) => ({
    ...m,
    name: m.name === '宝宝' ? '阳阳' : m.name,
    role: m.role ?? 'kid',
    parentPin: m.role === 'admin' ? (m.parentPin ?? DEFAULT_PIN) : undefined,
  }));
  if (!result.some((m) => m.name === '安安')) {
    result = [
      ...result,
      { id: 'm-4', name: '安安', avatar: '🐻‍❄️', color: '#f59e0b', role: 'kid', parentPin: undefined, createdAt: Date.now() },
    ];
  }
  return result;
}

interface StoreContextValue {
  tasks: Task[];
  visibleTasks: Task[];
  rewards: Reward[];
  points: number;
  term: TermConfig;
  members: Member[];
  activeMember: Member;
  isAdmin: boolean;
  addTask: (
    title: string,
    points: number,
    planDate?: string,
    scope?: TaskScope,
    endDate?: string,
    ownerId?: string,
  ) => void;
  toggleTask: (id: string, date: string) => void;
  deleteTask: (id: string) => void;
  removeTaskFromDate: (id: string, date: string) => void;
  removeTaskFromWeekday: (id: string, weekday: number) => void;
  addReward: (name: string, icon: string, cost: number) => void;
  claimReward: (id: string) => void;
  resetData: () => void;
  updateTerm: (term: TermConfig) => void;
  addMember: (name: string, avatar: string, color: string, role: MemberRole, parentPin?: string) => void;
  deleteMember: (id: string) => void;
  switchMember: (id: string) => void;
  parentUnlocked: boolean;
  verifyPin: (pin: string) => boolean;
  lockParent: () => void;
  importSchedule: (ownerId?: string) => number;
  clearTasks: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export default StoreContext;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = usePersistentState<Task[]>(
    TASKS_KEY,
    makeDefaultTasks(),
  );
  const [rewards, setRewards] = usePersistentState<Reward[]>(
    REWARDS_KEY,
    DEFAULT_REWARDS,
  );
  const [term, setTerm] = usePersistentState<TermConfig>(TERM_KEY, DEFAULT_TERM);
  const [members, setMembers] = usePersistentState<Member[]>(
    MEMBERS_KEY,
    makeDefaultMembers(),
  );
  const [activeMemberId, setActiveMemberId] = usePersistentState<string>(
    ACTIVE_KEY,
    'm-3',
  );
  const [earnedPoints, setEarnedPoints] = usePersistentState<number>(EARNED_KEY, 0);
  const [parentUnlocked, setParentUnlocked] = useState(false);

  const migratedMembers = useMemo(() => migrateMembers(members), [members]);
  const migratedTasks = useMemo(() => migrateTasks(tasks), [tasks]);

  useEffect(() => {
    setTasks((prev) => {
      const migratedPrev = migrateTasks(prev);
      const has = (ownerId: string, title: string) =>
        migratedPrev.some((t) => t.ownerId === ownerId && t.title === title);

      // 阳阳：确保拥有全部学期任务池（19 项）
      const yangyang: Task[] = [];
      for (const item of TERM_TASKS) {
        if (!has('m-3', item.title)) {
          yangyang.push({
            id: `seed-m-3-${item.title}`,
            title: item.title,
            points: 10,
            createdAt: Date.now(),
            planDate: term.start,
            endDate: term.end,
            scope: 'term' as TaskScope,
            period: item.period,
            completedDates: [],
            ownerId: 'm-3',
            logs: [],
          });
        }
      }

      // 安安：只保留「玩游戏」，清除其它误归的任务
      const weekStart = getWeekStart(todayString());
      const anan: Task[] = [];
      if (!has('m-4', '玩游戏')) {
        anan.push({
          id: 'seed-m-4-玩游戏',
          title: '玩游戏',
          points: 10,
          createdAt: Date.now(),
          planDate: weekStart,
          endDate: scopeEndDate(weekStart, 'week', term.end),
          scope: 'week' as TaskScope,
          period: 'afternoon',
          completedDates: [],
          ownerId: 'm-4',
          logs: [],
        });
      }

      const keptAnan = migratedPrev.filter(
        (t) => t.ownerId !== 'm-4' || t.title === '玩游戏',
      );
      const keptOthers = migratedPrev.filter(
        (t) => t.ownerId !== 'm-4' && t.ownerId !== 'm-3',
      );
      const keptYangyang = migratedPrev.filter(
        (t) => t.ownerId === 'm-3',
      );

      // 幂等：若什么都没变则不重建
      const next = [
        ...keptOthers,
        ...yangyang,
        ...keptYangyang,
        ...keptAnan,
        ...anan,
      ];
      const nextKeys = next.map((t) => t.id).sort().join(',');
      const prevKeys = prev.map((t) => t.id).sort().join(',');
      return nextKeys === prevKeys ? prev : next;
    });
  }, [migratedMembers, term, setTasks]);

  const activeMember = useMemo(
    () =>
      migratedMembers.find((m) => m.id === activeMemberId) ??
      migratedMembers[0] ??
      makeDefaultMembers()[0],
    [migratedMembers, activeMemberId],
  );

  const isAdmin = activeMember.role === 'admin';

  const visibleTasks = useMemo(
    () =>
      isAdmin
        ? migratedTasks
        : migratedTasks.filter((t) => t.ownerId === activeMember.id),
    [migratedTasks, isAdmin, activeMember.id],
  );

  const points = earnedPoints;

  const value = useMemo<StoreContextValue>(
    () => ({
      tasks: migratedTasks,
      visibleTasks,
      rewards,
      points,
      term,
      members: migratedMembers,
      activeMember,
      isAdmin,
      parentUnlocked,
      addTask: (title, pts, planDate, scope = 'day', endDate, ownerId) => {
        const start = planDate ?? todayString();
        const task: Task = {
          id: crypto.randomUUID(),
          title: title.trim(),
          points: pts,
          createdAt: Date.now(),
          planDate: start,
          scope,
          endDate: endDate ?? scopeEndDate(start, scope, term.end, endDate),
          completedDates: [],
          ownerId: ownerId ?? activeMember.id,
          logs: [],
        };
        setTasks((prev) => [...prev, task]);
      },
      toggleTask: (id, date) => {
        const task = migratedTasks.find((t) => t.id === id);
        if (task) {
          const done = task.completedDates.includes(date);
          setEarnedPoints((prev) =>
            Math.max(0, done ? prev - task.points : prev + task.points),
          );
        }
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== id) return t;
            const done = t.completedDates.includes(date);
            const event: TaskEvent = makeEvent(
              done ? 'cancel' : 'complete',
              date,
              activeMember.id,
            );
            return {
              ...t,
              completedDates: done
                ? t.completedDates.filter((d) => d !== date)
                : [...t.completedDates, date],
              logs: [...t.logs, event],
            };
          }),
        );
      },
      deleteTask: (id) => {
        if (!isAdmin) return;
        setTasks((prev) => prev.filter((t) => t.id !== id));
      },
      claimReward: (id) => {
        const reward = rewards.find((r) => r.id === id);
        if (!reward || reward.claimed || points < reward.cost) return;
        setRewards((prev) =>
          prev.map((r) => (r.id === id ? { ...r, claimed: true } : r)),
        );
      },
      addReward: (name, icn, costValue) => {
        const reward: Reward = {
          id: crypto.randomUUID(),
          name: name.trim(),
          icon: icn,
          cost: costValue,
          claimed: false,
        };
        setRewards((prev) => [...prev, reward]);
      },
      removeTaskFromDate: (id, date) => {
        if (!isAdmin) return;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  excludedDates: [...(t.excludedDates ?? []), date],
                }
              : t,
          ),
        );
      },
      removeTaskFromWeekday: (id, weekday) => {
        if (!isAdmin) return;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  excludedWeekdays: [...(t.excludedWeekdays ?? []), weekday],
                }
              : t,
          ),
        );
      },
      resetData: () => {
        setTasks(makeDefaultTasks());
        setRewards(DEFAULT_REWARDS);
        setTerm(DEFAULT_TERM);
        setMembers(makeDefaultMembers());
        setActiveMemberId('m-3');
        setEarnedPoints(0);
      },
      updateTerm: (nextTerm) => {
        setTerm(nextTerm);
      },
      addMember: (name, avatar, color, role = 'kid', parentPin) => {
        const member: Member = {
          id: crypto.randomUUID(),
          name: name.trim(),
          avatar: avatar || AVATARS[0],
          color: color || COLORS[0],
          role,
          parentPin: role === 'admin' ? (parentPin || DEFAULT_PIN) : undefined,
          createdAt: Date.now(),
        };
        setMembers((prev) => [...prev, member]);
      },
      deleteMember: (id) => {
        if (!isAdmin) return;
        setMembers((prev) => prev.filter((m) => m.id !== id));
        if (activeMemberId === id) {
          const remaining = migratedMembers.filter((m) => m.id !== id);
          setActiveMemberId(remaining[0]?.id ?? '');
        }
        setTasks((prev) =>
          prev.map((t) =>
            t.ownerId === id ? { ...t, ownerId: activeMemberId } : t,
          ),
        );
      },
      switchMember: (id) => {
        setActiveMemberId(id);
        setParentUnlocked(false);
      },
      verifyPin: (pin) => {
        const match = migratedMembers.some(
          (m) => m.role === 'admin' && m.parentPin === pin,
        );
        if (match) setParentUnlocked(true);
        return match;
      },
      lockParent: () => {
        setParentUnlocked(false);
      },
      importSchedule: (ownerId) => {
        const targetOwner = ownerId ?? activeMember.id;
        const newTasks: Task[] = TERM_TASKS.map((item) => ({
          id: crypto.randomUUID(),
          title: item.title,
          points: 10,
          createdAt: Date.now(),
          planDate: term.start,
          endDate: term.end,
          scope: 'term' as TaskScope,
          period: item.period,
          completedDates: [],
          ownerId: targetOwner,
          logs: [],
        }));
        setTasks(newTasks);
        return newTasks.length;
      },
      clearTasks: () => {
        setTasks([]);
      },
    }),
    [
      migratedTasks,
      visibleTasks,
      rewards,
      points,
      term,
      migratedMembers,
      activeMember,
      isAdmin,
      parentUnlocked,
      setTasks,
      setRewards,
      setTerm,
      setMembers,
      setActiveMemberId,
      activeMemberId,
      setEarnedPoints,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
