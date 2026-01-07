'use client';

import { useState } from 'react';
import { LoginPage, ChatPage } from '@/components';
import type { UserInfo } from '@/types';

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null);

  const handleLogin = (userInfo: UserInfo) => {
    // 로컬 스토리지에 저장 (새로고침 시 유지)
    localStorage.setItem('chat_debug_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_debug_user');
    setUser(null);
  };

  // 로그인 전
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // 로그인 후 - zigbang 스타일의 채팅 화면
  return (
    <ChatPage
      userId={user.userId}
      nickname={user.nickname}
      onLogout={handleLogout}
    />
  );
}
