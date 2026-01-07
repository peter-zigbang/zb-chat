import { useState, useCallback } from 'react';
import type { GroupChannel } from '@sendbird/chat/groupChannel';
import { SendbirdProviderWrapper } from '@/providers/SendbirdProvider';
import { ChannelList } from '../ChannelList/ChannelList';
import { ChannelChat } from '../ChannelChat/ChannelChat';
import { TestGroupCreator } from '../TestGroupCreator/TestGroupCreator';
import type { ChatPageProps } from '@/types';
import styles from './ChatPage.module.css';

// zigbang의 전체 채팅 구조와 유사
export function ChatPage({ userId, nickname, onLogout, onDualMode, embedded }: ChatPageProps) {
  const [selectedChannel, setSelectedChannel] = useState<GroupChannel | null>(null);

  const handleChannelSelect = useCallback((channel: GroupChannel) => {
    console.log('Channel Selected:', {
      url: channel.url,
      name: channel.name,
      memberCount: channel.memberCount,
    });
    setSelectedChannel(channel);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedChannel(null);
  }, []);

  return (
    <SendbirdProviderWrapper userId={userId} nickname={nickname}>
      <div className={`${styles.container} ${embedded ? styles.embedded : ''}`}>
        {/* 상단 헤더 - embedded 모드에서는 숨김 */}
        {!embedded && (
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.logo}>🏠 Zigbang Chat Debug</span>
            </div>
            <div className={styles.headerCenter}>
              <span className={styles.userInfo}>
                👤 {nickname} ({userId})
              </span>
            </div>
            <div className={styles.headerRight}>
              {onDualMode && (
                <button onClick={onDualMode} className={styles.dualModeButton}>
                  🔄 듀얼 모드
                </button>
              )}
              {onLogout && (
                <button onClick={onLogout} className={styles.logoutButton}>
                  로그아웃
                </button>
              )}
            </div>
          </header>
        )}

        {/* 메인 컨텐츠 */}
        <main className={styles.main}>
          {/* embedded 모드: 채널 선택 시 채팅만 표시, 아니면 목록만 표시 */}
          {embedded ? (
            selectedChannel ? (
              <section className={styles.chatAreaFull}>
                <ChannelChat 
                  channel={selectedChannel} 
                  onBack={handleBack}
                  currentUserId={userId}
                />
              </section>
            ) : (
              <aside className={styles.sidebarFull}>
                <ChannelList
                  onChannelSelect={handleChannelSelect}
                  selectedChannelUrl={undefined}
                />
              </aside>
            )
          ) : (
            <>
              {/* 채널 목록 (GroupChannelListScreen) */}
              <aside className={styles.sidebar}>
                <ChannelList
                  onChannelSelect={handleChannelSelect}
                  selectedChannelUrl={selectedChannel?.url}
                />
              </aside>

              {/* 채팅 영역 (GroupChannelScreen) */}
              <section className={styles.chatArea}>
                {selectedChannel ? (
                  <ChannelChat 
                    channel={selectedChannel} 
                    onBack={handleBack}
                    currentUserId={userId}
                  />
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                      <span className={styles.emptyIcon}>💬</span>
                      <h3>채팅방을 선택하세요</h3>
                      <p>왼쪽 목록에서 채팅방을 선택하거나<br/>새 채팅을 시작하세요</p>
                      
                      {/* 테스트 그룹 생성 UI */}
                      <TestGroupCreator 
                        userId={userId}
                        onGroupCreated={(channelUrl) => {
                          console.log('새 그룹 생성됨:', channelUrl);
                          // 채널 목록이 자동으로 업데이트됨
                        }}
                      />
                      
                      <div className={styles.codeInfo}>
                        <h4>📂 zigbang 코드 구조</h4>
                        <ul>
                          <li><code>GroupChannelListScreen</code> → 채널 목록</li>
                          <li><code>GroupChannelScreen</code> → 채팅 상세</li>
                          <li><code>SendInput</code> → 메시지 입력</li>
                          <li><code>ChannelInput</code> → 입력 래퍼</li>
                          <li><code>CustomMessageRenderer</code> → 커스텀 메시지</li>
                          <li><code>useSendBirdMessage</code> → 메시지 훅</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </SendbirdProviderWrapper>
  );
}

