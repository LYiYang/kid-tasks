import { useState, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import './RewardsPage.css';

export function RewardsPage() {
  const { rewards, points, addReward, claimReward } = useStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎁');
  const [cost, setCost] = useState(50);

  const handleAddReward = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addReward(name, icon, cost);
    setName('');
    setIcon('🎁');
    setCost(50);
  };

  return (
    <section className="page">
      <div className="rewards-header">
        <h2 className="page-title">奖励中心</h2>
        <span className="rewards-points">
          我的积分：<strong>{points}</strong> ⭐
        </span>
      </div>

      <form className="reward-form" onSubmit={handleAddReward}>
        <input
          className="reward-search"
          type="text"
          placeholder="输入奖励名称..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="奖励名称"
        />
        <div className="reward-icon-picker">
          {['🎁', '🍦', '📺', '🎡', '🧸', '🍬'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`reward-icon${icon === emoji ? ' reward-icon-active' : ''}`}
              onClick={() => setIcon(emoji)}
              aria-label={`选择图标 ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="reward-form-row">
          <label className="reward-cost-input">
            <span>分值</span>
            <input
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(Math.max(1, Number(e.target.value)))}
              aria-label="奖励分值"
            />
          </label>
          <button className="reward-add-btn" type="submit">
            添加奖励
          </button>
        </div>
      </form>

      <ul className="reward-list">
        {rewards.map((reward) => {
          const affordable = points >= reward.cost;
          return (
            <li key={reward.id} className={`reward-item${reward.claimed ? ' reward-item-claimed' : ''}`}>
              <span className="reward-icon-badge" aria-hidden="true">
                {reward.icon}
              </span>
              <div className="reward-info">
                <span className="reward-name">{reward.name}</span>
                <span className="reward-cost">{reward.cost} ⭐</span>
              </div>
              {reward.claimed ? (
                <span className="reward-status">已兑换</span>
              ) : (
                <button
                  className="reward-claim-btn"
                  type="button"
                  disabled={!affordable}
                  onClick={() => claimReward(reward.id)}
                >
                  {affordable ? '兑换' : '积分不足'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
