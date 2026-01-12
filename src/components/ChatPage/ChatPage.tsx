import { useState, useCallback, useEffect } from 'react';
import type { GroupChannel } from '@sendbird/chat/groupChannel';
import Channel from '@sendbird/uikit-react/Channel';
import { useSendbirdStateContext } from '@sendbird/uikit-react';
import { SendbirdProviderWrapper } from '@/providers/SendbirdProvider';
import { ChannelList } from '../ChannelList/ChannelList';
import { ChannelChat } from '../ChannelChat/ChannelChat';
import { TestGroupCreator } from '../TestGroupCreator/TestGroupCreator';
import type { ChatPageProps } from '@/types';
import styles from './ChatPage.module.css';

// 차단 대상 사용자 목록
const BLOCK_TARGET_USERS = [
  { userId: 'FE_APT_01', nickname: '아파트유저01' },
  { userId: 'FE_APT_02', nickname: '아파트유저02' },
  { userId: 'FE_APT_03', nickname: '아파트유저03' },
];

// 공통 채팅 헤더 컴포넌트
function ChatHeader({ 
  channel, 
  onBack, 
  currentUserId 
}: { 
  channel: GroupChannel; 
  onBack: () => void;
  currentUserId: string;
}) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [currentNickname, setCurrentNickname] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const context = useSendbirdStateContext();
  const sdk = context?.stores?.sdkStore?.sdk;

  // 현재 닉네임 가져오기
  useEffect(() => {
    if (sdk?.currentUser) {
      setCurrentNickname(sdk.currentUser.nickname || '');
    }
  }, [sdk]);

  // 차단 상태 확인
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!sdk) return;
      
      try {
        const query = sdk.createBlockedUserListQuery();
        const blockedUsers = await query.next();
        const blockedIds = new Set(blockedUsers.map(u => u.userId));
        setBlockedUserIds(blockedIds);
      } catch (err) {
        console.error('차단 상태 확인 실패:', err);
      }
    };
    checkBlockStatus();
  }, [sdk]);

  // 차단하기
  const handleBlockUser = async (userId: string) => {
    if (!sdk) return;
    
    try {
      await sdk.blockUserWithUserId(userId);
      setBlockedUserIds(prev => new Set([...prev, userId]));
      // 차단 변경 이벤트 발생 (ChannelChat에서 감지)
      window.dispatchEvent(new CustomEvent('blockListChanged'));
    } catch (err) {
      console.error('차단 실패:', err);
    }
  };

  // 차단 해제
  const handleUnblockUser = async (userId: string) => {
    if (!sdk) return;
    
    try {
      await sdk.unblockUserWithUserId(userId);
      setBlockedUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      // 차단 변경 이벤트 발생 (ChannelChat에서 감지)
      window.dispatchEvent(new CustomEvent('blockListChanged'));
    } catch (err) {
      console.error('차단 해제 실패:', err);
    }
  };

  // 닉네임 변경
  const handleUpdateNickname = async () => {
    if (!sdk || !newNickname.trim()) return;
    
    setIsUpdating(true);
    try {
      await sdk.updateCurrentUserInfo({
        nickname: newNickname.trim(),
      });
      setCurrentNickname(newNickname.trim());
      setShowNicknameModal(false);
      setNewNickname('');
      console.log('[ChatHeader] 닉네임 변경 성공:', newNickname.trim());
      alert(`닉네임이 "${newNickname.trim()}"(으)로 변경되었습니다.`);
    } catch (err) {
      console.error('닉네임 변경 실패:', err);
      alert('닉네임 변경에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 현재 사용자를 제외한 차단 대상 목록
  const blockTargets = BLOCK_TARGET_USERS.filter(u => u.userId !== currentUserId);
  
  // 차단된 사용자 수
  const blockedCount = blockTargets.filter(u => blockedUserIds.has(u.userId)).length;

  return (
    <div className={styles.chatHeader}>
      <button onClick={onBack} className={styles.chatBackButton}>
        ←
      </button>
      <div className={styles.chatHeaderInfo}>
        <span className={styles.chatHeaderTitle}>{channel.name || '채팅방'}</span>
      </div>
      
      {/* 차단 버튼 및 드롭다운 */}
      <div className={styles.blockWrapper}>
        <button
          className={`${styles.chatBlockButton} ${blockedCount > 0 ? styles.blocked : ''}`}
          onClick={() => setShowBlockMenu(!showBlockMenu)}
        >
          차단 {blockedCount > 0 && `(${blockedCount})`}
        </button>
        
        {showBlockMenu && (
          <>
            <div 
              className={styles.blockOverlay}
              onClick={() => setShowBlockMenu(false)}
            />
            <div className={styles.blockMenu}>
              {blockTargets.map(user => {
                const isBlocked = blockedUserIds.has(user.userId);
                return (
                  <button
                    key={user.userId}
                    className={`${styles.blockMenuItem} ${isBlocked ? styles.blockedItem : ''}`}
                    onClick={() => {
                      if (isBlocked) {
                        handleUnblockUser(user.userId);
                      } else {
                        handleBlockUser(user.userId);
                      }
                    }}
                  >
                    <span className={styles.blockUserName}>{user.userId}</span>
                    <span className={styles.blockStatus}>
                      {isBlocked ? '차단 해제' : '차단'}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 닉네임 변경 버튼 */}
      <button
        className={styles.nicknameButton}
        onClick={() => {
          setNewNickname(currentNickname);
          setShowNicknameModal(true);
        }}
      >
        ✏️ 닉네임
      </button>

      {/* 닉네임 변경 모달 */}
      {showNicknameModal && (
        <>
          <div 
            className={styles.blockOverlay}
            onClick={() => setShowNicknameModal(false)}
          />
          <div className={styles.nicknameModal}>
            <h3 className={styles.nicknameModalTitle}>닉네임 변경</h3>
            <p className={styles.nicknameModalCurrent}>
              현재: <strong>{currentNickname || '없음'}</strong>
            </p>
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="새 닉네임 입력"
              className={styles.nicknameInput}
              disabled={isUpdating}
            />
            <div className={styles.nicknameModalButtons}>
              <button
                className={styles.nicknameModalCancel}
                onClick={() => setShowNicknameModal(false)}
                disabled={isUpdating}
              >
                취소
              </button>
              <button
                className={styles.nicknameModalConfirm}
                onClick={handleUpdateNickname}
                disabled={isUpdating || !newNickname.trim()}
              >
                {isUpdating ? '변경중...' : '변경'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// zigbang의 전체 채팅 구조와 유사
export function ChatPage({ userId, nickname, onLogout, onDualMode, embedded, uiMode = 'custom' }: ChatPageProps) {
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

  // 부모 창(DualChatView)에서 오는 메시지 수신 (채팅방 목록으로 돌아가기)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GO_TO_CHANNEL_LIST') {
        setSelectedChannel(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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
                {/* 공통 헤더 */}
                <ChatHeader 
                  channel={selectedChannel} 
                  onBack={handleBack}
                  currentUserId={userId}
                />
                
                {uiMode === 'basic' ? (
                  // 샌드버드 기본 UI
                  <div className={styles.basicChannelWrapper}>
                    <Channel channelUrl={selectedChannel.url} />
                  </div>
                ) : (
                  // 커스텀 UI (헤더 숨김)
                  <ChannelChat 
                    channel={selectedChannel} 
                    onBack={handleBack}
                    currentUserId={userId}
                    hideHeader
                  />
                )}
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
                  uiMode === 'basic' ? (
                    // 샌드버드 기본 UI
                    <div className={styles.basicChannelWrapper}>
                      <Channel channelUrl={selectedChannel.url} />
                    </div>
                  ) : (
                    // 커스텀 UI (단일 모드에서는 디버그 정보 표시)
                    <ChannelChat 
                      channel={selectedChannel} 
                      onBack={handleBack}
                      currentUserId={userId}
                      showDebug={!embedded}
                    />
                  )
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

