import { useState, useMemo, useCallback } from 'react';
import SendbirdChat from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';
import { ChatPage } from './components';
import { DualChatView } from './components/DualChatView/DualChatView';
import { SENDBIRD_CONFIG } from '@/config/sendbird';

type UIMode = 'basic' | 'custom';
type ViewMode = 'select' | 'chat' | 'single';

// 사용자 정보
const USERS = [
  { userId: 'FE_APT_01', nickname: '아파트유저01' },
  { userId: 'FE_APT_02', nickname: '아파트유저02' },
  { userId: 'FE_APT_03', nickname: '아파트유저03' },
];

// 하드코딩된 A 유저 ID
const BLOCKER_USER_ID = 'zigbang_1000098554_7daa6';

// URL 쿼리 파라미터 파싱
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    userId: params.get('userId'),
    nickname: params.get('nickname'),
    embedded: params.get('embedded') === 'true',
    uiMode: (params.get('uiMode') as UIMode) || 'custom',
  };
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [uiMode, setUIMode] = useState<UIMode>('custom');
  const [selectedUser, setSelectedUser] = useState(USERS[0]);

  // 차단 기능 상태
  const [showBlockSection, setShowBlockSection] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // URL 쿼리 파라미터 확인 (iframe embedded 모드)
  const queryParams = useMemo(() => getQueryParams(), []);

  // Sendbird 연결
  const connectSendbird = useCallback(async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      const sb = SendbirdChat.init({
        appId: SENDBIRD_CONFIG.APP_ID,
        modules: [new GroupChannelModule()],
      });

      // 토큰이 있으면 토큰으로 연결, 없으면 토큰 없이 연결
      if (accessToken.trim()) {
        await sb.connect(BLOCKER_USER_ID, accessToken.trim());
        console.log('[App] Sendbird 토큰 연결 성공:', BLOCKER_USER_ID);
        setIsConnected(true);
        setResult({ success: true, message: `${BLOCKER_USER_ID}로 토큰 연결되었습니다.` });
      } else {
        await sb.connect(BLOCKER_USER_ID);
        console.log('[App] Sendbird 연결 성공:', BLOCKER_USER_ID);
        setIsConnected(true);
        setResult({ success: true, message: `${BLOCKER_USER_ID}로 연결되었습니다. (토큰 없음)` });
      }
    } catch (error: unknown) {
      console.error('[App] Sendbird 연결 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setResult({ success: false, message: `연결 실패: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // 사용자 차단
  const handleBlockUser = useCallback(async () => {
    if (!targetUserId.trim()) {
      setResult({ success: false, message: '차단할 유저 ID를 입력하세요.' });
      return;
    }

    if (targetUserId.trim() === BLOCKER_USER_ID) {
      setResult({ success: false, message: '자기 자신은 차단할 수 없습니다.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const sb = SendbirdChat.instance;
      if (!sb) {
        setResult({ success: false, message: 'Sendbird 연결이 필요합니다. 먼저 연결하세요.' });
        setIsLoading(false);
        return;
      }

      console.log('[App] 차단 시도:', { blocker: BLOCKER_USER_ID, target: targetUserId.trim() });
      await sb.blockUserWithUserId(targetUserId.trim());
      
      console.log('[App] 차단 성공:', targetUserId.trim());
      setResult({ success: true, message: `✅ ${targetUserId.trim()} 유저를 차단했습니다.` });
      setTargetUserId('');
    } catch (error: unknown) {
      console.error('[App] 차단 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setResult({ success: false, message: `차단 실패: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  // 사용자 차단 해제
  const handleUnblockUser = useCallback(async () => {
    if (!targetUserId.trim()) {
      setResult({ success: false, message: '차단 해제할 유저 ID를 입력하세요.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const sb = SendbirdChat.instance;
      if (!sb) {
        setResult({ success: false, message: 'Sendbird 연결이 필요합니다. 먼저 연결하세요.' });
        setIsLoading(false);
        return;
      }

      console.log('[App] 차단 해제 시도:', targetUserId.trim());
      await sb.unblockUserWithUserId(targetUserId.trim());
      
      console.log('[App] 차단 해제 성공:', targetUserId.trim());
      setResult({ success: true, message: `✅ ${targetUserId.trim()} 유저의 차단을 해제했습니다.` });
      setTargetUserId('');
    } catch (error: unknown) {
      console.error('[App] 차단 해제 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setResult({ success: false, message: `차단 해제 실패: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  // embedded 모드 (iframe 내부) - ChatPage 바로 표시
  if (queryParams.embedded && queryParams.userId && queryParams.nickname) {
    return (
      <ChatPage
        userId={queryParams.userId}
        nickname={queryParams.nickname}
        embedded={true}
        uiMode={queryParams.uiMode}
      />
    );
  }

  // 단일 사용자 모드 - 선택된 사용자로 ChatPage 표시
  if (viewMode === 'single') {
    return (
      <ChatPage
        userId={selectedUser.userId}
        nickname={selectedUser.nickname}
        embedded={false}
        uiMode={uiMode}
        onLogout={() => setViewMode('select')}
      />
    );
  }

  // 멀티 채팅 모드 - DualChatView 표시
  if (viewMode === 'chat') {
    return (
      <DualChatView
        userA={{ userId: 'FE_APT_01', nickname: '아파트유저01', color: '#e94560' }}
        userB={{ userId: 'FE_APT_02', nickname: '아파트유저02', color: '#0ea5e9' }}
        userC={{ userId: 'FE_APT_03', nickname: '아파트유저03', color: '#10b981' }}
        onExit={() => setViewMode('select')}
        uiMode={uiMode}
      />
    );
  }

  // 첫 화면 - UI 모드 선택
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💬 Chat Debug</h1>
        <p style={styles.subtitle}>UI 모드를 선택하세요</p>
        
        {/* 멀티 유저 모드 (3명) */}
        <p style={styles.sectionLabel}>멀티 유저 (3명)</p>
        <div style={styles.buttonGroup}>
          <button
            style={styles.buttonBasic}
            onClick={() => {
              setUIMode('basic');
              setViewMode('chat');
            }}
          >
            📦 샌드버드
          </button>
          
          <button
            style={styles.buttonCustom}
            onClick={() => {
              setUIMode('custom');
              setViewMode('chat');
            }}
          >
            🎨 커스텀
          </button>
        </div>
        
        {/* 단일 유저 모드 - 각 사용자별 버튼 */}
        {USERS.map((user) => (
          <div key={user.userId} style={styles.buttonGroup}>
            <button
              style={styles.buttonSingleBasic}
              onClick={() => {
                setSelectedUser(user);
                setUIMode('basic');
                setViewMode('single');
              }}
            >
              📦 {user.userId} 샌드버드
            </button>
            
            <button
              style={styles.buttonSingleCustom}
              onClick={() => {
                setSelectedUser(user);
                setUIMode('custom');
                setViewMode('single');
              }}
            >
              🎨 {user.userId} 커스텀
            </button>
          </div>
        ))}

        {/* 구분선 */}
        <div style={styles.divider} />

        {/* 차단 기능 토글 버튼 */}
        <button
          style={styles.blockToggleButton}
          onClick={() => setShowBlockSection(!showBlockSection)}
        >
          🚫 사용자 차단 기능 {showBlockSection ? '▲' : '▼'}
        </button>

        {/* 차단 기능 섹션 */}
        {showBlockSection && (
          <div style={styles.blockSection}>
            {/* 토큰 입력 (연결 전에만 표시) */}
            {!isConnected && (
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Access Token (선택)</label>
                <input
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="토큰 입력 (없으면 비워두세요)"
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* 연결 상태 */}
            <div style={styles.connectionRow}>
              <span style={{
                ...styles.statusDot,
                background: isConnected ? '#22c55e' : '#ef4444',
                boxShadow: isConnected ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none',
              }} />
              <span style={styles.connectionText}>
                {isConnected ? '연결됨' : '연결 안됨'}
              </span>
              {!isConnected && (
                <button
                  style={styles.connectButton}
                  onClick={connectSendbird}
                  disabled={isLoading}
                >
                  {isLoading ? '연결중...' : '연결하기'}
                </button>
              )}
            </div>

            {/* A 유저 (하드코딩) */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>A (차단하는 유저)</label>
              <input
                type="text"
                value={BLOCKER_USER_ID}
                disabled
                style={styles.inputDisabled}
              />
            </div>

            {/* B 유저 (입력) */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>B (차단 대상 유저)</label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="차단할 유저 ID 입력"
                style={styles.input}
                disabled={isLoading || !isConnected}
              />
            </div>

            {/* 버튼들 */}
            <div style={styles.blockButtonGroup}>
              <button
                style={{
                  ...styles.blockButton,
                  opacity: isLoading || !targetUserId.trim() || !isConnected ? 0.5 : 1,
                  cursor: isLoading || !targetUserId.trim() || !isConnected ? 'not-allowed' : 'pointer',
                }}
                onClick={handleBlockUser}
                disabled={isLoading || !targetUserId.trim() || !isConnected}
              >
                {isLoading ? '처리중...' : '🚫 차단하기'}
              </button>
              <button
                style={{
                  ...styles.unblockButton,
                  opacity: isLoading || !targetUserId.trim() || !isConnected ? 0.5 : 1,
                  cursor: isLoading || !targetUserId.trim() || !isConnected ? 'not-allowed' : 'pointer',
                }}
                onClick={handleUnblockUser}
                disabled={isLoading || !targetUserId.trim() || !isConnected}
              >
                {isLoading ? '처리중...' : '✅ 차단해제'}
              </button>
            </div>

            {/* 결과 메시지 */}
            {result && (
              <div style={{
                ...styles.resultMessage,
                background: result.success 
                  ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                  : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                color: result.success ? '#155724' : '#721c24',
                border: result.success ? '1px solid #b1dfbb' : '1px solid #f5c6cb',
              }}>
                {result.message}
              </div>
            )}

            {/* 추후 기능 추가 영역 */}
            <div style={styles.futureSection}>
              <p style={styles.futurePlaceholder}>
                🔧 추후 기능이 여기에 추가됩니다...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
    padding: '10px',
    overflowY: 'auto',
  },
  card: {
    textAlign: 'center',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '360px',
    width: '100%',
    marginTop: '10px',
    marginBottom: '10px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    margin: '0 0 12px 0',
    fontSize: '0.7rem',
    color: '#94a3b8',
  },
  sectionLabel: {
    margin: '0 0 6px 0',
    fontSize: '0.6rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '6px',
    marginBottom: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  buttonBasic: {
    padding: '6px 12px',
    fontSize: '0.65rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  buttonCustom: {
    padding: '6px 12px',
    fontSize: '0.65rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  buttonSingleBasic: {
    padding: '5px 10px',
    fontSize: '0.6rem',
    fontWeight: 500,
    color: '#a5b4fc',
    background: 'transparent',
    border: '1px solid #6366f1',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonSingleCustom: {
    padding: '5px 10px',
    fontSize: '0.6rem',
    fontWeight: 500,
    color: '#6ee7b7',
    background: 'transparent',
    border: '1px solid #10b981',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  divider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '8px 0',
  },
  blockToggleButton: {
    padding: '8px 16px',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    width: '100%',
  },
  blockSection: {
    marginTop: '10px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '10px',
    textAlign: 'left' as const,
  },
  connectionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px',
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '6px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  connectionText: {
    fontSize: '0.65rem',
    color: '#666',
  },
  connectButton: {
    marginLeft: 'auto',
    padding: '4px 8px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.6rem',
    cursor: 'pointer',
  },
  inputGroup: {
    marginBottom: '10px',
  },
  inputLabel: {
    display: 'block',
    fontSize: '0.6rem',
    fontWeight: 500,
    color: '#666',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '0.65rem',
    boxSizing: 'border-box' as const,
  },
  inputDisabled: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '0.65rem',
    background: '#f5f5f5',
    color: '#888',
    boxSizing: 'border-box' as const,
  },
  blockButtonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },
  blockButton: {
    flex: 1,
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #ff4757 0%, #ff3344 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.65rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  unblockButton: {
    flex: 1,
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #2ed573 0%, #26c265 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.65rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resultMessage: {
    marginTop: '10px',
    padding: '8px 10px',
    borderRadius: '6px',
    fontSize: '0.6rem',
    textAlign: 'center' as const,
    fontWeight: 500,
  },
  futureSection: {
    marginTop: '10px',
    padding: '10px',
    background: '#f9f9f9',
    borderRadius: '6px',
    border: '1px dashed #ddd',
  },
  futurePlaceholder: {
    margin: 0,
    color: '#999',
    fontSize: '0.6rem',
    fontStyle: 'italic',
    textAlign: 'center' as const,
  },
};

export default App;
