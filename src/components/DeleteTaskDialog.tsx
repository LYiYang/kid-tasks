import type { Task } from '../types';
import { getDayLabel } from '../utils/date';
import './DeleteTaskDialog.css';

interface Props {
  task: Task;
  day: string;
  onClose: () => void;
  onDeleteAll: () => void;
  onDeleteDate: () => void;
  onDeleteWeekday: () => void;
}

export function DeleteTaskDialog({
  task,
  day,
  onClose,
  onDeleteAll,
  onDeleteDate,
  onDeleteWeekday,
}: Props) {
  const dayLabel = getDayLabel(day);
  const weekdayNum = new Date(day).getDay();

  return (
    <div className="delete-overlay" onClick={onClose}>
      <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="delete-title">删除「{task.title}」</h3>
        <p className="delete-desc">请选择删除范围：</p>

        <button className="delete-option delete-option-all" type="button" onClick={onDeleteAll}>
          <span className="delete-option-title">删除全部</span>
          <span className="delete-option-sub">这个任务在所有天都不再显示</span>
        </button>

        <button className="delete-option" type="button" onClick={onDeleteDate}>
          <span className="delete-option-title">只删除{dayLabel}</span>
          <span className="delete-option-sub">仅 {day} 这天不显示，其他天保留</span>
        </button>

        <button className="delete-option" type="button" onClick={onDeleteWeekday}>
          <span className="delete-option-title">删除每周{dayLabel}</span>
          <span className="delete-option-sub">每个星期{weekdayLabel(weekdayNum)}都不显示</span>
        </button>

        <button className="delete-cancel" type="button" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
}

function weekdayLabel(num: number): string {
  return ['日', '一', '二', '三', '四', '五', '六'][num];
}
