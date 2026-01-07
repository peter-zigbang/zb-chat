import { useState, useEffect, useRef } from 'react';
import type { Reaction } from '@sendbird/chat/message';
import styles from './ReactionUserList.module.css';

interface UserInfo {
  oderId: string;
  nickname: string;
  profileUrl?: string;
}

interface Props {
  reactions: Reaction[];
  position: { x: number; y: number };
  onClose: () => void;
  // 사용자 정보를 가져오는 함수 (채널 멤버에서 조회)
  getUserInfo?: (userId: string) => UserInfo | null;
}

export function ReactionUserList({
  reactions,
  position,
  onClose,
  getUserInfo,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>(
    reactions[0]?.key || ''
  );

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 위치 조정
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 오른쪽으로 넘어가면 왼쪽으로 조정
      if (rect.right > viewportWidth - 16) {
        container.style.left = `${viewportWidth - rect.width - 16}px`;
      }

      // 아래로 넘어가면 위로 조정
      if (rect.bottom > viewportHeight - 16) {
        container.style.top = `${position.y - rect.height - 8}px`;
      }
    }
  }, [position]);

  // 선택된 이모지의 사용자 목록
  const selectedReaction = reactions.find(r => r.key === selectedEmoji);
  const userIds = selectedReaction?.userIds || [];

  // 카운트 포맷 (99+)
  const formatCount = (count: number) => {
    return count > 99 ? '99+' : count.toString();
  };

  return (
    <div className={styles.overlay}>
      <div
        ref={containerRef}
        className={styles.container}
        style={{ left: position.x, top: position.y }}
      >
        {/* 이모지 탭 */}
        <div className={styles.emojiTabs}>
          {reactions.map((reaction) => (
            <button
              key={reaction.key}
              className={`${styles.emojiTab} ${selectedEmoji === reaction.key ? styles.selected : ''}`}
              onClick={() => setSelectedEmoji(reaction.key)}
            >
              <span className={styles.emoji}>{reaction.key}</span>
              <span className={styles.count}>{formatCount(reaction.userIds.length)}</span>
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div className={styles.divider} />

        {/* 사용자 목록 */}
        <div className={styles.userList}>
          {userIds.map((userId) => {
            const userInfo = getUserInfo?.(userId);
            return (
              <div key={userId} className={styles.userItem}>
                <div className={styles.avatar}>
                  {userInfo?.profileUrl ? (
                    <img 
                      src={userInfo.profileUrl} 
                      alt={userInfo.nickname || userId}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {(userInfo?.nickname || userId).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className={styles.userName}>
                  {userInfo?.nickname || userId}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

