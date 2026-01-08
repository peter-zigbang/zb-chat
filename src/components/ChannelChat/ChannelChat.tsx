import { useCallback, useState, useEffect } from 'react';
import Channel from '@sendbird/uikit-react/Channel';
import SendbirdChat from '@sendbird/chat';
import type { GroupChannel } from '@sendbird/chat/groupChannel';
import type { UserMessage, FileMessage, Reaction } from '@sendbird/chat/message';
import type { User } from '@sendbird/chat';
import { CustomMessageInput } from '../CustomMessageInput/CustomMessageInput';
import { MessageActionMenu } from '../MessageActionMenu/MessageActionMenu';
import { ReactionUserList } from '../ReactionUserList/ReactionUserList';
import styles from './ChannelChat.module.css';

type ReplyMessage = UserMessage | FileMessage;

interface MenuState {
  message: ReplyMessage;
  position: { x: number; y: number };
  isMyMessage: boolean;
}

interface ReactionListState {
  reactions: Reaction[];
  position: { x: number; y: number };
}

interface Props {
  channel: GroupChannel;
  onBack: () => void;
  currentUserId: string;
}

// zigbang의 GroupChannelScreen과 유사한 구현
export function ChannelChat({ channel, onBack, currentUserId }: Props) {
  // Reply 상태 관리
  const [replyToMessage, setReplyToMessage] = useState<ReplyMessage | null>(null);
  
  // 메시지 액션 메뉴 상태
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  
  // 이모지 피커 상태
  const [emojiPickerState, setEmojiPickerState] = useState<{
    message: ReplyMessage;
    position: { x: number; y: number };
  } | null>(null);
  
  // 리액션 사용자 목록 상태
  const [reactionListState, setReactionListState] = useState<ReactionListState | null>(null);
  
  // Channel 강제 리렌더링을 위한 key
  const [channelKey, setChannelKey] = useState(0);
  
  // 설정 메뉴 상태
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  // 차단된 사용자 목록
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);

  // 메시지 전송 로그 (디버깅용)
  const logMessage = useCallback((action: string, data: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${action}: ${JSON.stringify(data, null, 2)}`;
    console.log(log);
  }, []);

  // 채널의 다른 멤버 가져오기 (1:1 채팅 기준)
  const getOtherMember = useCallback(() => {
    return channel.members.find(m => m.userId !== currentUserId);
  }, [channel.members, currentUserId]);

  // 차단된 사용자 목록 불러오기
  const loadBlockedUsers = useCallback(async () => {
    try {
      const sb = SendbirdChat.instance;
      if (!sb) return;
      
      const query = sb.createBlockedUserListQuery();
      const users = await query.next();
      setBlockedUsers(users);
      console.log('[ChannelChat] 차단된 사용자 목록:', users.map(u => u.userId));
    } catch (error) {
      console.error('[ChannelChat] 차단 목록 로드 실패:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 차단 목록 로드
  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  // 특정 사용자가 차단되었는지 확인
  const isUserBlocked = useCallback((userId: string) => {
    return blockedUsers.some(u => u.userId === userId);
  }, [blockedUsers]);

  // 사용자 차단
  const handleBlockUser = useCallback(async (userId: string) => {
    try {
      const sb = SendbirdChat.instance;
      if (!sb) {
        alert('Sendbird 연결이 필요합니다.');
        return;
      }
      
      if (confirm(`${userId} 사용자를 차단하시겠습니까?\n차단하면 상대방의 메시지를 받지 않습니다.`)) {
        await sb.blockUser(userId);
        console.log('[ChannelChat] 사용자 차단됨:', userId);
        alert(`${userId} 사용자가 차단되었습니다.`);
        await loadBlockedUsers();
        setShowSettingsMenu(false);
      }
    } catch (error) {
      console.error('[ChannelChat] 차단 실패:', error);
      alert('사용자 차단에 실패했습니다.');
    }
  }, [loadBlockedUsers]);

  // 사용자 차단 해제
  const handleUnblockUser = useCallback(async (userId: string) => {
    try {
      const sb = SendbirdChat.instance;
      if (!sb) {
        alert('Sendbird 연결이 필요합니다.');
        return;
      }
      
      if (confirm(`${userId} 사용자의 차단을 해제하시겠습니까?`)) {
        await sb.unblockUser(userId);
        console.log('[ChannelChat] 차단 해제됨:', userId);
        alert(`${userId} 사용자의 차단이 해제되었습니다.`);
        await loadBlockedUsers();
        setShowSettingsMenu(false);
      }
    } catch (error) {
      console.error('[ChannelChat] 차단 해제 실패:', error);
      alert('차단 해제에 실패했습니다.');
    }
  }, [loadBlockedUsers]);

  // Reply 버튼 클릭 핸들러
  const handleReply = useCallback((message: ReplyMessage) => {
    setReplyToMessage(message);
  }, []);

  // Reply 취소 핸들러
  const handleCancelReply = useCallback(() => {
    setReplyToMessage(null);
  }, []);

  // 메시지 클릭 핸들러 - 액션 메뉴 표시
  const handleMessageClick = useCallback((
    e: React.MouseEvent,
    message: ReplyMessage,
    isMyMessage: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    setMenuState({
      message,
      position: { x: e.clientX, y: e.clientY },
      isMyMessage,
    });
  }, []);

  // 메뉴 닫기
  const handleCloseMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  // 복사 핸들러
  const handleCopy = useCallback(() => {
    if (!menuState) return;
    
    const message = menuState.message;
    let textToCopy = '';
    
    if ('message' in message && message.message) {
      textToCopy = message.message;
    } else if ('name' in message && message.name) {
      textToCopy = message.name;
    }
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('[ChannelChat] 메시지 복사됨:', textToCopy);
      }).catch(err => {
        console.error('[ChannelChat] 복사 실패:', err);
      });
    }
  }, [menuState]);

  // 답장 핸들러 (메뉴에서)
  const handleReplyFromMenu = useCallback(() => {
    if (!menuState) return;
    handleReply(menuState.message);
  }, [menuState, handleReply]);

  // 삭제 핸들러 - 메시지를 "삭제된 메시지입니다"로 표시
  const handleDelete = useCallback(async () => {
    if (!menuState) return;
    
    const message = menuState.message;
    const senderUserId = message.sender?.userId || '';
    
    console.log('[ChannelChat] 삭제 시도:', {
      currentUserId,
      senderUserId,
      messageId: message.messageId,
    });
    
    const isMyMessage = senderUserId === currentUserId;
    
    // 다른 사람 메시지는 삭제 불가
    if (!isMyMessage) {
      alert(`자신의 메시지만 삭제할 수 있습니다.\n(발신자: ${senderUserId}, 현재: ${currentUserId})`);
      return;
    }
    
    if (confirm('이 메시지를 삭제하시겠습니까?')) {
      try {
        // UserMessage인 경우에만 업데이트 가능
        if ('message' in message && message.messageType === 'user') {
          // 메시지 내용을 "삭제된 메시지입니다"로 업데이트
          const params = {
            message: '삭제된 메시지입니다.',
            data: JSON.stringify({ isDeleted: true, originalMessage: message.message }),
          };
          await channel.updateUserMessage(message.messageId, params);
          console.log('[ChannelChat] 메시지 삭제 표시됨:', message.messageId);
          
          // Channel 강제 리렌더링
          setChannelKey(prev => prev + 1);
        } else {
          // 파일 메시지는 실제 삭제
          await channel.deleteMessage(message);
          console.log('[ChannelChat] 파일 메시지 삭제됨:', message.messageId);
        }
      } catch (error) {
        console.error('[ChannelChat] 삭제 실패:', error);
        alert('메시지 삭제에 실패했습니다.');
      }
    }
  }, [menuState, channel, currentUserId]);

  // 리액션 핸들러 - Sendbird 리액션 API 사용
  const handleReaction = useCallback(async (emojiKey: string) => {
    if (!menuState) return;
    
    const message = menuState.message;
    
    try {
      // 이미 같은 리액션이 있는지 확인
      const existingReaction = message.reactions?.find(r => 
        r.key === emojiKey && r.userIds.includes(currentUserId)
      );
      
      if (existingReaction) {
        // 이미 리액션이 있으면 제거
        await channel.deleteReaction(message, emojiKey);
        console.log('[ChannelChat] 리액션 제거:', emojiKey, message.messageId);
      } else {
        // 리액션 추가
        await channel.addReaction(message, emojiKey);
        console.log('[ChannelChat] 리액션 추가:', emojiKey, message.messageId);
      }
      
      // 메뉴 닫기 (UIKit이 리액션 이벤트를 자동으로 처리하여 UI 업데이트)
      setMenuState(null);
    } catch (error) {
      console.error('[ChannelChat] 리액션 실패:', error);
    }
  }, [menuState, channel, currentUserId]);

  // 이모지 피커에서 리액션 추가 핸들러
  const handleAddReactionFromPicker = useCallback(async (emojiKey: string) => {
    if (!emojiPickerState) return;
    
    const message = emojiPickerState.message;
    
    try {
      // 이미 같은 리액션이 있는지 확인
      const existingReaction = message.reactions?.find(r => 
        r.key === emojiKey && r.userIds.includes(currentUserId)
      );
      
      if (existingReaction) {
        await channel.deleteReaction(message, emojiKey);
        console.log('[ChannelChat] 리액션 제거 (피커):', emojiKey, message.messageId);
      } else {
        await channel.addReaction(message, emojiKey);
        console.log('[ChannelChat] 리액션 추가 (피커):', emojiKey, message.messageId);
      }
      
      setEmojiPickerState(null);
    } catch (error) {
      console.error('[ChannelChat] 리액션 실패:', error);
    }
  }, [emojiPickerState, channel, currentUserId]);

  // + 버튼 클릭 핸들러
  const handleOpenEmojiPicker = useCallback((
    e: React.MouseEvent,
    message: ReplyMessage
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setEmojiPickerState({
      message,
      position: { x: rect.left, y: rect.bottom + 8 },
    });
  }, []);

  // 리액션 배지 클릭 핸들러 - 사용자 목록 팝업 표시
  const handleReactionBadgeClick = useCallback((
    e: React.MouseEvent,
    reactions: Reaction[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 화면 중앙에 팝업 표시
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    setReactionListState({
      reactions,
      position: { 
        x: Math.max(16, (viewportWidth - 320) / 2), 
        y: Math.max(100, viewportHeight / 4) 
      },
    });
  }, []);

  // 채널 멤버에서 사용자 정보 가져오기
  const getUserInfo = useCallback((userId: string) => {
    const member = channel.members.find(m => m.userId === userId);
    if (member) {
      return {
        oderId: member.oderId,
        nickname: member.nickname,
        profileUrl: member.profileUrl,
      };
    }
    return null;
  }, [channel.members]);

  return (
    <div className={styles.container}>
      {/* 헤더 - zigbang의 ChannelHeader와 유사 */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← 뒤로
        </button>
        <div className={styles.headerInfo}>
          <h2 className={styles.channelName}>{channel.name || '채팅방'}</h2>
          <span className={styles.memberCount}>
            멤버 {channel.memberCount}명 | GroupChannelScreen
          </span>
        </div>
        
        {/* 설정 버튼 */}
        <div className={styles.settingsWrapper}>
          <button 
            className={styles.settingsButton}
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title="설정"
          >
            ⚙️
          </button>
          
          {/* 설정 드롭다운 메뉴 */}
          {showSettingsMenu && (
            <>
              <div 
                className={styles.settingsOverlay}
                onClick={() => setShowSettingsMenu(false)}
              />
              <div className={styles.settingsMenu}>
                {/* 상대방 차단/차단해제 */}
                {(() => {
                  const otherMember = getOtherMember();
                  if (!otherMember) return null;
                  
                  const blocked = isUserBlocked(otherMember.userId);
                  
                  return (
                    <button
                      className={`${styles.settingsMenuItem} ${blocked ? styles.unblockItem : styles.blockItem}`}
                      onClick={() => blocked 
                        ? handleUnblockUser(otherMember.userId) 
                        : handleBlockUser(otherMember.userId)
                      }
                    >
                      <span className={styles.menuIcon}>{blocked ? '✓' : '🚫'}</span>
                      {blocked ? `${otherMember.nickname || otherMember.userId} 차단 해제` : `${otherMember.nickname || otherMember.userId} 차단`}
                    </button>
                  );
                })()}
                
                {/* 차단된 사용자 목록 보기 */}
                {blockedUsers.length > 0 && (
                  <>
                    <div className={styles.menuDivider} />
                    <div className={styles.blockedListHeader}>
                      차단된 사용자 ({blockedUsers.length})
                    </div>
                    {blockedUsers.map(user => (
                      <button
                        key={user.userId}
                        className={styles.blockedUserItem}
                        onClick={() => handleUnblockUser(user.userId)}
                      >
                        <span className={styles.blockedUserInfo}>
                          {user.nickname || user.userId}
                        </span>
                        <span className={styles.unblockLabel}>해제</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className={styles.chatWrapper}>
        <Channel
          key={`channel-${channel.url}-${channelKey}`}
          channelUrl={channel.url}
          renderMessage={({ message }) => {
            // AdminMessage는 reply 지원 안함
            if (message.messageType === 'admin') {
              return undefined; // 기본 렌더링 사용
            }

            const userOrFileMessage = message as ReplyMessage;
            const isMyMessage = userOrFileMessage.sender?.userId === currentUserId;
            const senderId = userOrFileMessage.sender?.userId || '';
            
            // 차단된 사용자의 메시지인지 확인
            const isBlockedUserMessage = !isMyMessage && isUserBlocked(senderId);
            
            // 삭제된 메시지인지 확인
            let isDeletedMessage = false;
            try {
              if (userOrFileMessage.data) {
                const data = JSON.parse(userOrFileMessage.data);
                isDeletedMessage = data?.isDeleted === true;
              }
            } catch {
              // JSON 파싱 실패 시 무시
            }
            
            // 메시지 텍스트 가져오기
            const getMessageText = () => {
              if ('message' in userOrFileMessage && userOrFileMessage.message) {
                return userOrFileMessage.message;
              }
              if ('name' in userOrFileMessage) {
                return `📎 ${userOrFileMessage.name}`;
              }
              return '';
            };

            // 멘션된 사용자 목록
            const mentionedUsers = userOrFileMessage.mentionedUsers || [];
            
            // 멘션 하이라이트 렌더링
            const renderMessageWithMentions = (messageText: string) => {
              if (mentionedUsers.length === 0) {
                return messageText;
              }

              // @ 멘션 패턴 찾기
              const mentionRegex = /@(\S+)/g;
              const parts: (string | JSX.Element)[] = [];
              let lastIndex = 0;
              let match;

              while ((match = mentionRegex.exec(messageText)) !== null) {
                // 멘션 전 텍스트 추가
                if (match.index > lastIndex) {
                  parts.push(messageText.slice(lastIndex, match.index));
                }

                const mentionText = match[0]; // @nickname
                const nickname = match[1]; // nickname
                
                // 멘션된 사용자인지 확인
                const isMentioned = mentionedUsers.some(
                  u => u.nickname === nickname || u.userId === nickname
                );
                
                // 나를 멘션했는지 확인
                const isMentioningMe = mentionedUsers.some(
                  u => u.userId === currentUserId && (u.nickname === nickname || u.userId === nickname)
                );

                if (isMentioned) {
                  parts.push(
                    <span 
                      key={match.index} 
                      className={`${styles.mention} ${isMentioningMe ? styles.mentionMe : ''}`}
                    >
                      {mentionText}
                    </span>
                  );
                } else {
                  parts.push(mentionText);
                }

                lastIndex = match.index + match[0].length;
              }

              // 남은 텍스트 추가
              if (lastIndex < messageText.length) {
                parts.push(messageText.slice(lastIndex));
              }

              return parts.length > 0 ? parts : messageText;
            };

            // Parent message (답장 대상) 정보
            const parentMessage = userOrFileMessage.parentMessage;
            const getParentMessageText = () => {
              if (!parentMessage) return '';
              if ('message' in parentMessage && parentMessage.message) {
                return parentMessage.message;
              }
              if ('name' in parentMessage) {
                return `📎 ${parentMessage.name}`;
              }
              return '메시지';
            };

            // 읽음 수 계산 (채널 멤버 수 - 읽은 멤버 수)
            const unreadCount = channel.getUnreadMemberCount?.(userOrFileMessage) || 0;

            return (
              <div className={`${styles.messageWrapper} ${isMyMessage ? styles.myMessage : styles.otherMessage}`}>
                {/* 보낸 사람 이름 - 버블 바깥 위에 표시 (다른 사람 메시지만, 삭제/차단 메시지 제외) */}
                {!isMyMessage && !isDeletedMessage && !isBlockedUserMessage && (
                  <span className={styles.senderName}>
                    {userOrFileMessage.sender?.nickname || '알 수 없음'}
                  </span>
                )}

                {/* 메시지 컨테이너 (버블 + 메타 정보) */}
                <div className={styles.messageContainer}>
                  {/* 메시지 버블 */}
                  <div 
                    className={`${styles.messageBubble} ${isDeletedMessage || isBlockedUserMessage ? styles.deletedMessage : ''} ${parentMessage && !isBlockedUserMessage ? styles.hasReply : ''}`}
                    onClick={(e) => !isDeletedMessage && !isBlockedUserMessage && handleMessageClick(e, userOrFileMessage, isMyMessage)}
                  >
                    {/* 답장 대상 메시지 표시 - 버블 안에 포함 (삭제/차단 메시지 제외) */}
                    {parentMessage && !isDeletedMessage && !isBlockedUserMessage && (
                      <div className={styles.replyPreview}>
                        <span className={styles.replySender}>
                          {parentMessage.sender?.nickname || '알 수 없음'}에게 답장
                        </span>
                        <span className={styles.replyText}>
                          {getParentMessageText().slice(0, 30)}
                          {getParentMessageText().length > 30 ? '...' : ''}
                        </span>
                      </div>
                    )}

                    {/* 차단된 사용자 메시지 */}
                    {isBlockedUserMessage ? (
                      <p className={styles.deletedText}>
                        <span className={styles.deletedIcon}>🚫</span>
                        차단된 사용자의 메시지입니다.
                      </p>
                    ) : isDeletedMessage ? (
                      /* 삭제된 메시지 */
                      <p className={styles.deletedText}>
                        <span className={styles.deletedIcon}>🚫</span>
                        삭제된 메시지입니다.
                      </p>
                    ) : (
                      <>
                        {/* 파일 메시지인 경우 */}
                        {'url' in userOrFileMessage && userOrFileMessage.url && (
                          <div className={styles.fileContent}>
                            {/* 이미지 */}
                            {userOrFileMessage.type?.startsWith('image/') ? (
                              <img 
                                src={userOrFileMessage.url} 
                                alt={userOrFileMessage.name || '이미지'} 
                                className={styles.messageImage}
                              />
                            ) : userOrFileMessage.type?.startsWith('video/') ? (
                              /* 동영상 - 썸네일 + 플레이 버튼 */
                              <div 
                                className={styles.videoContainer}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(userOrFileMessage.url, '_blank');
                                }}
                              >
                                {/* 썸네일: thumbnails 배열이 있으면 사용, 없으면 video 태그로 첫 프레임 표시 */}
                                {userOrFileMessage.thumbnails && userOrFileMessage.thumbnails.length > 0 ? (
                                  <img 
                                    src={userOrFileMessage.thumbnails[0].url} 
                                    alt={userOrFileMessage.name || '동영상'} 
                                    className={styles.videoThumbnail}
                                  />
                                ) : (
                                  <video 
                                    src={userOrFileMessage.url} 
                                    className={styles.videoThumbnail}
                                    preload="metadata"
                                    muted
                                  />
                                )}
                                {/* 플레이 버튼 오버레이 */}
                                <div className={styles.playButton}>
                                  <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                                {/* 동영상 시간 표시 (있는 경우) */}
                                <span className={styles.videoDuration}>
                                  🎬 동영상
                                </span>
                              </div>
                            ) : (
                              /* 기타 파일 */
                              <a 
                                href={userOrFileMessage.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={styles.fileLink}
                                onClick={(e) => e.stopPropagation()}
                              >
                                📎 {userOrFileMessage.name}
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* 텍스트 메시지 - 이미지/동영상은 파일명 숨김, 멘션 하이라이트 */}
                        {'message' in userOrFileMessage && userOrFileMessage.message && (
                          // 이미지나 동영상이 아닌 경우에만 텍스트 표시
                          !('url' in userOrFileMessage && (
                            userOrFileMessage.type?.startsWith('image/') || 
                            userOrFileMessage.type?.startsWith('video/')
                          )) && (
                            <p className={styles.messageText}>
                              {renderMessageWithMentions(userOrFileMessage.message)}
                            </p>
                          )
                        )}
                      </>
                    )}

                  </div>

                  {/* 메타 정보 (읽음 수 + 시간) */}
                  <div className={styles.messageMeta}>
                    {unreadCount > 0 && (
                      <span className={styles.readCount}>{unreadCount}</span>
                    )}
                    <span className={styles.messageTime}>
                      {new Date(userOrFileMessage.createdAt).toLocaleTimeString('ko-KR', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }).replace('오전', '오전 ').replace('오후', '오후 ')}
                    </span>
                  </div>
                </div>

                {/* 리액션 표시 - 버블 바깥 아래에 (Figma 디자인) - 차단된 메시지는 제외 */}
                {!isBlockedUserMessage && userOrFileMessage.reactions && userOrFileMessage.reactions.length > 0 && (
                  <div className={styles.reactionsContainer}>
                    {userOrFileMessage.reactions.map((reaction) => (
                      <button 
                        key={reaction.key} 
                        className={`${styles.reactionBadge} ${reaction.userIds.includes(currentUserId) ? styles.myReaction : ''}`}
                        title={`${reaction.userIds.length}명이 반응함 - 클릭하여 확인`}
                        onClick={(e) => handleReactionBadgeClick(e, userOrFileMessage.reactions || [])}
                      >
                        {reaction.key}
                        <span className={styles.reactionCount}>{reaction.userIds.length}</span>
                      </button>
                    ))}
                    {/* + 버튼 - 이모지 피커 열기 */}
                    <button 
                      className={styles.addReactionButton}
                      onClick={(e) => handleOpenEmojiPicker(e, userOrFileMessage)}
                      title="리액션 추가"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          }}
          renderMessageInput={() => (
            <CustomMessageInput 
              placeholder="메시지를 입력하세요..."
              replyToMessage={replyToMessage}
              onCancelReply={handleCancelReply}
              onMessageSent={(message) => {
                logMessage('Custom Input - Message Sent', { message });
              }}
              onFileSent={(file) => {
                logMessage('Custom Input - File Sent', { 
                  name: file.name, 
                  size: file.size, 
                  type: file.type 
                });
              }}
            />
          )}
        />
      </div>

      {/* 메시지 액션 메뉴 */}
      {menuState && (
        <MessageActionMenu
          message={menuState.message}
          position={menuState.position}
          isMyMessage={menuState.isMyMessage}
          onClose={handleCloseMenu}
          onCopy={handleCopy}
          onReply={handleReplyFromMenu}
          onDelete={handleDelete}
          onReaction={handleReaction}
        />
      )}

      {/* 이모지 피커 팝업 */}
      {emojiPickerState && (
        <div 
          className={styles.emojiPickerOverlay}
          onClick={() => setEmojiPickerState(null)}
        >
          <div 
            className={styles.emojiPicker}
            style={{ left: emojiPickerState.position.x, top: emojiPickerState.position.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {['👍', '✓', '😍', '😅', '😢', '😂'].map((emoji) => (
              <button
                key={emoji}
                className={styles.emojiPickerButton}
                onClick={() => handleAddReactionFromPicker(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 리액션 사용자 목록 팝업 */}
      {reactionListState && (
        <ReactionUserList
          reactions={reactionListState.reactions}
          position={reactionListState.position}
          onClose={() => setReactionListState(null)}
          getUserInfo={getUserInfo}
        />
      )}
    </div>
  );
}
