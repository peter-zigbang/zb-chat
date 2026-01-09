import { useState, useMemo } from 'react';
import { ChatPage } from './components';
import { DualChatView } from './components/DualChatView/DualChatView';

type UIMode = 'basic' | 'custom';
type ViewMode = 'select' | 'chat' | 'single';

// 사용자 정보
const USERS = [
  { userId: 'FE_APT_01', nickname: '아파트유저01' },
  { userId: 'FE_APT_02', nickname: '아파트유저02' },
  { userId: 'FE_APT_03', nickname: '아파트유저03' },
];

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

  // URL 쿼리 파라미터 확인 (iframe embedded 모드)
  const queryParams = useMemo(() => getQueryParams(), []);

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
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
  },
  card: {
    textAlign: 'center',
    padding: '48px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '2rem',
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '1rem',
    color: '#94a3b8',
  },
  sectionLabel: {
    margin: '0 0 12px 0',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    justifyContent: 'center',
  },
  buttonBasic: {
    padding: '14px 28px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  buttonCustom: {
    padding: '14px 28px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  buttonSingleBasic: {
    padding: '12px 20px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#a5b4fc',
    background: 'transparent',
    border: '1px solid #6366f1',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonSingleCustom: {
    padding: '12px 20px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#6ee7b7',
    background: 'transparent',
    border: '1px solid #10b981',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default App;

