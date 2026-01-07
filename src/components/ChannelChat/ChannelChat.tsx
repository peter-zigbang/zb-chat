import { useCallback, useState } from 'react';
import Channel from '@sendbird/uikit-react/Channel';
import type { GroupChannel } from '@sendbird/chat/groupChannel';
import type { UserMessage, FileMessage } from '@sendbird/chat/message';
import { CustomMessageInput } from '../CustomMessageInput/CustomMessageInput';
import styles from './ChannelChat.module.css';

type ReplyMessage = UserMessage | FileMessage;

interface Props {
  channel: GroupChannel;
  onBack: () => void;
}

// zigbang의 GroupChannelScreen과 유사한 구현
export function ChannelChat({ channel, onBack }: Props) {
  // Reply 상태 관리
  const [replyToMessage, setReplyToMessage] = useState<ReplyMessage | null>(null);

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
          channelUrl={channel.url}
          renderMessage={({ message }) => {
            // AdminMessage는 reply 지원 안함
            if (message.messageType === 'admin') {
              return undefined; // 기본 렌더링 사용
            }

            const userOrFileMessage = message as ReplyMessage;
            const isMyMessage = userOrFileMessage.sender?.userId === channel.myUserId;
            
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

                {/* 메시지 본문 */}
                <div className={styles.messageBubble}>
                  {!isMyMessage && (
                    <span className={styles.senderName}>
                      {userOrFileMessage.sender?.nickname || '알 수 없음'}
                    </span>
                  )}
                  
                  {/* 파일 메시지인 경우 */}
                  {'url' in userOrFileMessage && userOrFileMessage.url && (
                    <div className={styles.fileContent}>
                      {userOrFileMessage.type?.startsWith('image/') ? (
                        <img 
                          src={userOrFileMessage.url} 
                          alt={userOrFileMessage.name || '이미지'} 
                          className={styles.messageImage}
                        />
                      ) : (
                        <a 
                          href={userOrFileMessage.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.fileLink}
                        >
                          📎 {userOrFileMessage.name}
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* 텍스트 메시지 */}
                  {'message' in userOrFileMessage && userOrFileMessage.message && (
                    <p className={styles.messageText}>{userOrFileMessage.message}</p>
                  )}
                  
                  {/* 시간 표시 */}
                  <span className={styles.messageTime}>
                    {new Date(userOrFileMessage.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Reply 버튼 */}
                <button 
                  className={styles.replyButton}
                  onClick={() => handleReply(userOrFileMessage)}
                  title="답장"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 14 4 9 9 4" />
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                  </svg>
                </button>
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
    </div>
  );
}
