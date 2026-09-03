import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getFamilyId, setFamilyId } from '../lib/family';
import './SettingsPage.css';

export function SettingsPage() {
  const { visibleTasks, rewards, points, term, members, resetData, updateTerm, isAdmin, importSchedule, activeMember, clearTasks } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [termStart, setTermStart] = useState(term.start);
  const [termEnd, setTermEnd] = useState(term.end);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const [familyInput, setFamilyInput] = useState(getFamilyId());
  const [familyMsg, setFamilyMsg] = useState('');

  const logs = visibleTasks
    .flatMap((t) =>
      t.logs.map((log) => ({
        ...log,
        taskTitle: t.title,
        member: members.find((m) => m.id === log.memberId),
      })),
    )
    .sort((a, b) => b.time - a.time);

  const handleReset = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    resetData();
    setConfirming(false);
  };

  const handleTermSave = () => {
    if (!termStart || !termEnd || termStart > termEnd) return;
    updateTerm({ start: termStart, end: termEnd });
  };

  const handleImportSchedule = () => {
    if (
      confirm(
        '导入学期任务池？将清空现有任务并建立去重后的学期任务（归宝宝，共 19 项）。',
      )
    ) {
      const kid = members.find((m) => m.role === 'kid') ?? activeMember;
      const n = importSchedule(kid.id);
      setScheduleMsg(`已导入 ${n} 项学期任务`);
    }
  };

  const handleClearTasks = () => {
    if (confirm('清空所有任务？此操作不可恢复，只清任务，不影响成员和积分。')) {
      clearTasks();
      setScheduleMsg('已清空所有任务');
    }
  };

  const handleFamilyCopy = async () => {
    try {
      await navigator.clipboard.writeText(familyInput.trim());
      setFamilyMsg('家庭码已复制');
    } catch {
      setFamilyMsg('复制失败，请手动复制');
    }
  };

  const handleFamilySave = () => {
    if (familyInput.trim().length < 4) {
      setFamilyMsg('家庭码至少 4 个字符');
      return;
    }
    setFamilyId(familyInput);
    setFamilyMsg('已切换家庭码，正在刷新…');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <section className="page">
      <h2 className="page-title">设置</h2>

      <div className="settings-card">
        <div className="settings-row">
          <span>任务总数</span>
          <span>{visibleTasks.length}</span>
        </div>
        <div className="settings-row">
          <span>奖励总数</span>
          <span>{rewards.length}</span>
        </div>
        <div className="settings-row">
          <span>当前积分</span>
          <span>{points}</span>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">家庭共享码</h3>
        <p className="settings-hint">
          同一台设备会自动生成一个家庭码。家人的设备填入相同的码，就能看到同一份任务。
        </p>
        <div className="family-row">
          <input
            className="family-input"
            type="text"
            value={familyInput}
            onChange={(e) => setFamilyInput(e.target.value)}
            aria-label="家庭共享码"
          />
          <button className="family-btn" type="button" onClick={handleFamilyCopy}>
            复制
          </button>
          <button className="family-btn family-btn-primary" type="button" onClick={handleFamilySave}>
            切换
          </button>
        </div>
        {familyMsg && <p className="settings-hint family-msg">{familyMsg}</p>}
      </div>

      {isAdmin && (
        <div className="settings-section">
          <h3 className="settings-section-title">学期设置</h3>
          <div className="settings-term-row">
            <label>
              开始
              <input
                type="date"
                value={termStart}
                onChange={(e) => setTermStart(e.target.value)}
              />
            </label>
            <label>
              结束
              <input
              type="date"
              value={termEnd}
              onChange={(e) => setTermEnd(e.target.value)}
            />
          </label>
        </div>
        <button
          className="settings-save-btn"
          type="button"
          onClick={handleTermSave}
        >
          保存学期
        </button>
        </div>
      )}

      {isAdmin && (
        <div className="settings-section">
          <h3 className="settings-section-title">导入数据</h3>
          <button
            className="settings-save-btn"
            type="button"
            onClick={handleImportSchedule}
          >
            导入学期任务池
          </button>
          <button
            className="settings-danger-btn"
            type="button"
            style={{ marginTop: 10 }}
            onClick={handleClearTasks}
          >
            清空所有任务
          </button>
          {scheduleMsg && <p className="settings-hint">{scheduleMsg}</p>}
        </div>
      )}

      <div className="settings-section">
        <h3 className="settings-section-title">操作日志</h3>
        {logs.length === 0 ? (
          <p className="settings-hint">暂无操作记录。</p>
        ) : (
          <ul className="log-list">
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <span className="log-type">{log.type === 'complete' ? '✅' : '↩️'}</span>
                <span className="log-text">
                  <strong>{log.member?.name ?? '未知成员'}</strong>{' '}
                  {log.type === 'complete' ? '完成了' : '取消了'}{' '}
                  <span className="log-task">{log.taskTitle}</span>
                </span>
                <span className="log-time">{formatDateTime(log.time)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAdmin && (
        <div className="settings-danger">
          <h3 className="settings-danger-title">数据管理</h3>
          <button
            className="settings-reset-btn"
            type="button"
            onClick={handleReset}
          >
            {confirming ? '再次点击确认重置' : '重置所有数据'}
          </button>
          <p className="settings-hint">
            重置会清空所有任务、奖励、成员和学期设置，且无法恢复。
          </p>
        </div>
      )}
    </section>
  );
}

function formatDateTime(time: number): string {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
