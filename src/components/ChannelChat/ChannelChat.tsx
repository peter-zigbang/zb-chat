import { useCallback, useState } from 'react';
import Channel from '@sendbird/uikit-react/Channel';
import type { GroupChannel } from '@sendbird/chat/groupChannel';
import type { UserMessage, FileMessage } from '@sendbird/chat/message';
import { CustomMessageInput } from '../CustomMessageInput/CustomMessageInput';
import { MessageActionMenu } from '../MessageActionMenu/MessageActionMenu';
import styles from './ChannelChat.module.css';

type ReplyMessage = UserMessage | FileMessage;

interface MenuState {
  message: ReplyMessage;
  position: { x: number; y: number };
  isMyMessage: boolean;
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
  
  // Channel 강제 리렌더링을 위한 key
  const [channelKey, setChannelKey] = useState(0);

  // 메시지 전송 로그 (디버깅용)
  const logMessage = useCallback((action: string, data: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${action}: ${JSON.stringify(data, null, 2)}`;
    console.log(log);
  }, []);

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

            return (
              <div className={`${styles.messageWrapper} ${isMyMessage ? styles.myMessage : styles.otherMessage}`}>
                {/* 답장 대상 메시지 표시 */}
                {parentMessage && (
                  <div className={styles.quotedMessage}>
                    <div className={styles.quotedBar} />
                    <div className={styles.quotedContent}>
                      <span className={styles.quotedSender}>
                        {parentMessage.sender?.nickname || '알 수 없음'}
                      </span>
                      <span className={styles.quotedText}>
                        {getParentMessageText().slice(0, 40)}
                        {getParentMessageText().length > 40 ? '...' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* 메시지 본문 - 클릭 시 액션 메뉴 표시 */}
                <div 
                  className={`${styles.messageBubble} ${isDeletedMessage ? styles.deletedMessage : ''}`}
                  onClick={(e) => !isDeletedMessage && handleMessageClick(e, userOrFileMessage, isMyMessage)}
                >
                  {!isMyMessage && !isDeletedMessage && (
                    <span className={styles.senderName}>
                      {userOrFileMessage.sender?.nickname || '알 수 없음'}
                    </span>
                  )}
                  
                  {/* 삭제된 메시지 */}
                  {isDeletedMessage ? (
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
                      
                      {/* 텍스트 메시지 - 이미지/동영상은 파일명 숨김 */}
                      {'message' in userOrFileMessage && userOrFileMessage.message && (
                        // 이미지나 동영상이 아닌 경우에만 텍스트 표시
                        !('url' in userOrFileMessage && (
                          userOrFileMessage.type?.startsWith('image/') || 
                          userOrFileMessage.type?.startsWith('video/')
                        )) && (
                          <p className={styles.messageText}>{userOrFileMessage.message}</p>
                        )
                      )}
                    </>
                  )}
                  
                  {/* 시간 표시 */}
                  <span className={styles.messageTime}>
                    {new Date(userOrFileMessage.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
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
        />
      )}
    </div>
  );
}
