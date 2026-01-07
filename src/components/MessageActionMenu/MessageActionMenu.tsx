import { useEffect, useRef } from 'react';
import type { UserMessage, FileMessage } from '@sendbird/chat/message';
import styles from './MessageActionMenu.module.css';

type Message = UserMessage | FileMessage;

interface Props {
  message: Message;
  position: { x: number; y: number };
  isMyMessage: boolean;
  onClose: () => void;
  onCopy: () => void;
  onReply: () => void;
  onDelete: () => void;
}

export function MessageActionMenu({
  message,
  position,
  isMyMessage,
  onClose,
  onCopy,
  onReply,
  onDelete,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // 약간의 딜레이 후 이벤트 리스너 추가 (클릭 이벤트 충돌 방지)
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

  // 메뉴 위치 조정 (화면 밖으로 나가지 않도록)
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 오른쪽으로 넘어가면 왼쪽으로 조정
      if (rect.right > viewportWidth - 16) {
        menu.style.left = `${viewportWidth - rect.width - 16}px`;
      }

      // 아래로 넘어가면 위로 조정
      if (rect.bottom > viewportHeight - 16) {
        menu.style.top = `${position.y - rect.height - 8}px`;
      }
    }
  }, [position]);

  const handleCopy = () => {
    onCopy();
    onClose();
  };

  const handleReply = () => {
    onReply();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div
        ref={menuRef}
        className={styles.menu}
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* 복사 */}
        <button className={styles.menuItem} onClick={handleCopy}>
          <span className={styles.menuText}>복사</span>
          <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        <div className={styles.divider} />

        {/* 답장 */}
        <button className={styles.menuItem} onClick={handleReply}>
          <span className={styles.menuText}>답장</span>
          <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
        </button>

        <div className={styles.divider} />

        {/* 삭제 */}
        <button className={`${styles.menuItem} ${styles.deleteItem}`} onClick={handleDelete}>
          <span className={styles.menuText}>삭제</span>
          <svg className={styles.menuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>

        <div className={styles.divider} />

        {/* 이모지 영역 - 나중에 연동 예정 */}
        <div className={styles.emojiSection}>
          <div className={styles.emojiPlaceholder}>
            <span>👍</span>
            <span>✓</span>
            <span>😍</span>
            <span>😅</span>
            <span>😢</span>
            <span>😂</span>
          </div>
        </div>
      </div>
    </div>
  );
}

