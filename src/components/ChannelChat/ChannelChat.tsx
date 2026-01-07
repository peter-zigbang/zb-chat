import { useCallback } from 'react';
import Channel from '@sendbird/uikit-react/Channel';
import type { GroupChannel } from '@sendbird/chat/groupChannel';
import { CustomMessageInput } from '../CustomMessageInput/CustomMessageInput';
import styles from './ChannelChat.module.css';

interface Props {
  channel: GroupChannel;
  onBack: () => void;
}

// zigbang의 GroupChannelScreen과 유사한 구현
export function ChannelChat({ channel, onBack }: Props) {
  // 메시지 전송 로그 (디버깅용)
  const logMessage = useCallback((action: string, data: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${action}: ${JSON.stringify(data, null, 2)}`;
    console.log(log);
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
          renderMessageInput={() => (
            <CustomMessageInput 
              placeholder="메시지를 입력하세요..."
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
