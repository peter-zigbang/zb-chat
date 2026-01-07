import GroupChannelList from '@sendbird/uikit-react/GroupChannelList';
import type { GroupChannel } from '@sendbird/chat/groupChannel';
import styles from './ChannelList.module.css';

interface Props {
  onChannelSelect: (channel: GroupChannel) => void;
  selectedChannelUrl?: string;
}

// zigbang의 GroupChannelListScreen과 유사
export function ChannelList({ onChannelSelect, selectedChannelUrl }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>💬 채팅 목록</h2>
        <p className={styles.subtitle}>GroupChannelListScreen</p>
      </div>
      
      <div className={styles.listWrapper}>
        <GroupChannelList
          onChannelSelect={(channel) => {
            if (channel) onChannelSelect(channel);
          }}
          onChannelCreated={(channel) => {
            if (channel) onChannelSelect(channel);
          }}
          selectedChannelUrl={selectedChannelUrl ?? undefined}
          // zigbang 스타일: 채널 쿼리 필터
          channelListQueryParams={{
            includeEmpty: true,
            limit: 20,
          }}
        />
      </div>
    </div>
  );
}

