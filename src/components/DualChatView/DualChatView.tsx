import { useState } from 'react';
import { createDualUserTestGroup } from '@/utils/testGroupCreator';
import styles from './DualChatView.module.css';

interface UserConfig {
  userId: string;
  nickname: string;
  color: string;
}

interface Props {
  userA: UserConfig;
  userB: UserConfig;
  userC?: UserConfig;
  onExit: () => void;
}

// iframe을 사용해서 각 사용자를 완전히 분리된 환경에서 실행
export function DualChatView({ userA, userB, userC, onExit }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);
  const [panelCount, setPanelCount] = useState(userC ? 3 : 2);

  const users = [userA, userB, userC].filter(Boolean) as UserConfig[];

  const handleCreate50Group = async () => {
    setIsCreating(true);
    setCreateResult('🔄 시작...');
    
    const result = await createDualUserTestGroup(50, undefined, (message) => {
      setCreateResult(message);
    });
    
    if (result.success) {
      setCreateResult(`✅ ${result.memberCount}명 그룹 생성 완료! 새로고침하세요.`);
    } else {
      setCreateResult(`❌ 실패: ${result.error}`);
    }
    
    setIsCreating(false);
  };

  // iframe URL 생성 (쿼리 파라미터로 사용자 정보 전달)
  const getIframeUrl = (user: UserConfig) => {
    const params = new URLSearchParams({
      userId: user.userId,
      nickname: user.nickname,
      embedded: 'true',
    });
    return `${window.location.origin}/?${params.toString()}`;
  };

  const togglePanelCount = () => {
    setPanelCount(prev => prev === 2 ? 3 : 2);
  };

  const displayUsers = users.slice(0, panelCount);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🔄 멀티 채팅 테스트</h1>
        <div className={styles.headerInfo}>
          {displayUsers.map((user, index) => (
            <span key={user.userId}>
              {index > 0 && <span className={styles.vs}>↔</span>}
              <span className={styles.userBadge} style={{ backgroundColor: user.color }}>
                {String.fromCharCode(65 + index)}: {user.nickname}
              </span>
            </span>
          ))}
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={togglePanelCount}
            className={styles.toggleButton}
          >
            {panelCount === 2 ? '3명 모드' : '2명 모드'}
          </button>
          <button 
            onClick={handleCreate50Group} 
            className={styles.createButton}
            disabled={isCreating}
          >
            {isCreating ? '생성 중...' : '👥 50명 그룹 생성'}
          </button>
          {createResult && (
            <span className={styles.createResult}>{createResult}</span>
          )}
          <button onClick={onExit} className={styles.exitButton}>
            ✕ 종료
          </button>
        </div>
      </header>

      <div className={`${styles.panels} ${panelCount === 3 ? styles.threePanel : ''}`}>
        {displayUsers.map((user, index) => (
          <div 
            key={user.userId}
            className={styles.panel} 
            style={{ borderColor: user.color }}
          >
            <div className={styles.panelHeader} style={{ backgroundColor: user.color }}>
              <span className={styles.panelLabel}>User {String.fromCharCode(65 + index)}</span>
              <span className={styles.panelUser}>
                {user.nickname} ({user.userId})
              </span>
            </div>
            <iframe 
              src={getIframeUrl(user)}
              className={styles.iframe}
              title={`User ${String.fromCharCode(65 + index)} Chat`}
            />
          </div>
        ))}
      </div>

      {/* 테스트 방법 안내 - 숨김 처리
      <div className={styles.instructions}>
        <h4>📋 테스트 방법</h4>
        <ol>
          <li>모든 패널에서 같은 채널을 선택하세요</li>
          <li>한 사용자가 메시지를 보내면 다른 사용자들이 실시간으로 수신합니다</li>
          <li>@멘션을 테스트하려면 메시지에 @를 입력하세요</li>
        </ol>
      </div>
      */}
    </div>
  );
}
