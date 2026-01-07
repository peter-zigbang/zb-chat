import { useState, FormEvent } from 'react';
import styles from './LoginPage.module.css';

interface UserInfo {
  userId: string;
  nickname: string;
}

interface Props {
  onLogin: (userInfo: UserInfo) => void;
  onDualMode?: () => void;
}

export function LoginPage({ onLogin, onDualMode }: Props) {
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim() || !nickname.trim()) {
      return;
    }

    setIsLoading(true);
    
    // 약간의 딜레이 후 로그인 처리
    setTimeout(() => {
      onLogin({ userId: userId.trim(), nickname: nickname.trim() });
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>🏠 Zigbang Chat Debug</h1>
          <p className={styles.subtitle}>Sendbird 채팅 테스트</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="userId" className={styles.label}>
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="test_user"
              className={styles.input}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="nickname" className={styles.label}>
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="테스트유저"
              className={styles.input}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading || !userId.trim() || !nickname.trim()}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className={styles.info}>
          <p>💡 zigbang과 동일한 Sendbird APP_ID를 사용합니다</p>
        </div>

        {onDualMode && (
          <div className={styles.dualMode}>
            <div className={styles.divider}>
              <span>또는</span>
            </div>
            <button
              type="button"
              onClick={onDualMode}
              className={styles.dualButton}
            >
              🔄 듀얼 채팅 모드 (A ↔ B 테스트)
            </button>
            <p className={styles.dualInfo}>
              두 사용자가 동시에 채팅하는 화면을 테스트합니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

