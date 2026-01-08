import { useState } from 'react';
import { createDualUserTestGroup, inviteUserToChannel } from '@/utils/testGroupCreator';
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

type UIMode = 'custom' | 'basic';

// iframe을 사용해서 각 사용자를 완전히 분리된 환경에서 실행
export function DualChatView({ userA, userB, userC, onExit }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);
  // 고정 채널 URL (하드코딩)
  const [lastChannelUrl, setLastChannelUrl] = useState<string | null>(
    'sendbird_group_channel_335994112_e495ff4b37f8dae884a121fc7fcf499279b6f00f'
  );
  const [isInviting, setIsInviting] = useState(false);
  
  // UI 모드: 샌드버드 기본 vs 커스텀
  const [uiMode, setUIMode] = useState<UIMode>('custom');

  // 항상 3명 모드
  const users = [userA, userB, userC].filter(Boolean) as UserConfig[];

  const handleCreate50Group = async () => {
    setIsCreating(true);
    setCreateResult('🔄 시작...');
    
    const result = await createDualUserTestGroup(50, undefined, (message) => {
      setCreateResult(message);
    });
    
    if (result.success) {
      setLastChannelUrl(result.channelUrl || null);
      setCreateResult(`✅ ${result.memberCount}명 그룹 생성 완료! 새로고침하세요.`);
    } else {
      setCreateResult(`❌ 실패: ${result.error}`);
    }
    
    setIsCreating(false);
  };

  // 나간 사용자 재초대 (user_a가 초대)
  const handleReinviteUsers = async () => {
    if (!lastChannelUrl) {
      setCreateResult('❌ 먼저 그룹을 생성하세요');
      return;
    }
    
    setIsInviting(true);
    setCreateResult('🔄 사용자 재초대 중...');
    
    const result = await inviteUserToChannel(
      'user_a', // 운영자
      lastChannelUrl,
      ['user_a', 'user_b', 'user_c'] // 재초대할 사용자들
    );
    
    if (result.success) {
      setCreateResult('✅ 재초대 완료! 각 패널에서 채널을 다시 선택하세요.');
    } else {
      setCreateResult(`❌ 재초대 실패: ${result.error}`);
    }
    
    setIsInviting(false);
  };

  // iframe URL 생성 (쿼리 파라미터로 사용자 정보 전달)
  const getIframeUrl = (user: UserConfig) => {
    const params = new URLSearchParams({
      userId: user.userId,
      nickname: user.nickname,
      embedded: 'true',
      uiMode: uiMode,
    });
    return `${window.location.origin}/?${params.toString()}`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerActions}>
          {/* UI 모드 토글 버튼 */}
          <div className={styles.uiModeToggle}>
            <button 
              className={`${styles.modeButton} ${uiMode === 'basic' ? styles.active : ''}`}
              onClick={() => setUIMode('basic')}
            >
              📦 샌드버드 기본
            </button>
            <button 
              className={`${styles.modeButton} ${uiMode === 'custom' ? styles.active : ''}`}
              onClick={() => setUIMode('custom')}
            >
              🎨 커스텀
            </button>
          </div>
          
          <div className={styles.separator} />
          
          <button 
            onClick={handleCreate50Group} 
            className={styles.createButton}
            disabled={isCreating}
          >
            {isCreating ? '생성 중...' : '👥 50명 그룹 생성'}
          </button>
          <button 
            onClick={handleReinviteUsers} 
            className={styles.reinviteButton}
            disabled={isInviting || !lastChannelUrl}
            title={lastChannelUrl ? '마지막 생성된 채널에 A,B,C 재초대' : '먼저 그룹을 생성하세요'}
          >
            {isInviting ? '초대 중...' : '🔄 재초대'}
          </button>
          {createResult && (
            <span className={styles.createResult}>{createResult}</span>
          )}
          <button onClick={onExit} className={styles.exitButton}>
            ✕ 종료
          </button>
        </div>
      </header>

      <div className={`${styles.panels} ${styles.threePanel}`}>
        {users.map((user, index) => (
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
              key={`${user.userId}-${uiMode}`}
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
