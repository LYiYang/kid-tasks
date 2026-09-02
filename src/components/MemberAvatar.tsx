import type { Member } from '../types';
import './MemberAvatar.css';

interface Props {
  member?: Member;
  size?: number;
}

export function MemberAvatar({ member, size = 22 }: Props) {
  return (
    <span
      className="member-avatar-chip"
      style={{
        backgroundColor: member?.color ?? '#e5e7eb',
        width: size,
        height: size,
        fontSize: size * 0.5,
      }}
      title={member?.name}
      aria-label={member?.name}
    >
      {member?.avatar ?? '❓'}
    </span>
  );
}
