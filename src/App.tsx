import { useState, useEffect, useMemo } from 'react';
import { LoginPage, ChatPage } from './components';
import { DualChatView } from './components/DualChatView/DualChatView';
import type { UserInfo } from './types';

type ViewMode = 'single' | 'dual';

// URL 쿼리 파라미터 파싱
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    userId: params.get('userId'),
    nickname: params.get('nickname'),
    embedded: params.get('embedded') === 'true',
    uiMode: (params.get('uiMode') as 'basic' | 'custom') || 'custom',
  };
}

function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  // URL 쿼리 파라미터 확인 (iframe embedded 모드)
  const queryParams = useMemo(() => getQueryParams(), []);

  // 페이지 로드 시 저장된 사용자 정보 복원 또는 쿼리 파라미터 사용
  useEffect(() => {
    // embedded 모드면 쿼리 파라미터의 사용자 정보 사용
    if (queryParams.embedded && queryParams.userId && queryParams.nickname) {
      setUser({
        userId: queryParams.userId,
        nickname: queryParams.nickname,
      });
      return;
    }

    // 일반 모드면 localStorage에서 복원
    const savedUser = localStorage.getItem('chat_debug_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('chat_debug_user');
      }
    }
  }, [queryParams]);

  const handleLogin = (userInfo: UserInfo) => {
    localStorage.setItem('chat_debug_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_debug_user');
    setUser(null);
    setViewMode('single');
  };

  // 멀티 채팅 모드 (로그인 없이 사용 가능, 2~3명 지원)
  if (viewMode === 'dual') {
    return (
      <DualChatView
        userA={{ userId: 'user_a', nickname: 'User A', color: '#e94560' }}
        userB={{ userId: 'user_b', nickname: 'User B', color: '#0ea5e9' }}
        userC={{ userId: 'user_c', nickname: 'User C', color: '#10b981' }}
        onExit={() => setViewMode('single')}
      />
    );
  }

  // 로그인 전
  if (!user) {
    return (
      <LoginPage 
        onLogin={handleLogin} 
        onDualMode={() => setViewMode('dual')}
      />
    );
  }

  // 로그인 후 - zigbang 스타일의 채팅 화면
  return (
    <ChatPage
      userId={user.userId}
      nickname={user.nickname}
      onLogout={queryParams.embedded ? undefined : handleLogout}
      onDualMode={queryParams.embedded ? undefined : () => setViewMode('dual')}
      embedded={queryParams.embedded}
      uiMode={queryParams.uiMode}
    />
  );
}

export default App;

