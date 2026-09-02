export type TaskScope = 'day' | 'week' | 'term' | 'range';
export type TaskPeriod = 'morning' | 'afternoon' | 'evening' | 'other';

export interface Task {
  id: string;
  title: string;
  points: number;
  createdAt: number;
  planDate: string;
  endDate?: string;
  scope?: TaskScope;
  period?: TaskPeriod;
  completedDates: string[];
  ownerId: string;
  logs: TaskEvent[];
  excludedDates?: string[];
  excludedWeekdays?: number[];
}

export interface Reward {
  id: string;
  name: string;
  icon: string;
  cost: number;
  claimed: boolean;
}

export interface TermConfig {
  start: string;
  end: string;
}

export type MemberRole = 'admin' | 'kid';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: MemberRole;
  parentPin?: string;
  createdAt: number;
}

export interface TaskEvent {
  id: string;
  type: 'complete' | 'cancel';
  date: string;
  memberId: string;
  time: number;
}
