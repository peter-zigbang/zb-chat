import styles from './DualChatView.module.css';

interface UserConfig {
  userId: string;
  nickname: string;
  color: string;
}

type UIMode = 'custom' | 'basic';

interface Props {
  userA: UserConfig;
  userB: UserConfig;
  userC?: UserConfig;
  onExit: () => void;
  uiMode: UIMode;
}

// iframe을 사용해서 각 사용자를 완전히 분리된 환경에서 실행
export function DualChatView({ userA, userB, userC, uiMode }: Props) {

  // 항상 3명 모드
  const users = [userA, userB, userC].filter(Boolean) as UserConfig[];

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
      <div className={`${styles.panels} ${styles.threePanel}`}>
        {users.map((user, index) => (
          <div 
            key={user.userId}
            className={styles.panel} 
          >
            <iframe 
              key={`${user.userId}-${uiMode}`}
              src={getIframeUrl(user)}
              className={styles.iframe}
              title={`User ${String.fromCharCode(65 + index)} Chat`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
