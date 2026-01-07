import { ReactNode } from 'react';
import SendbirdProvider from '@sendbird/uikit-react/SendbirdProvider';
import '@sendbird/uikit-react/dist/index.css';
import { SENDBIRD_CONFIG } from '@/config/sendbird';

interface Props {
  userId: string;
  nickname: string;
  children: ReactNode;
}

// zigbang의 useSendbirdAuthentication과 유사한 역할
export function SendbirdProviderWrapper({ userId, nickname, children }: Props) {
  return (
    <SendbirdProvider
      appId={SENDBIRD_CONFIG.APP_ID}
      userId={userId}
      nickname={nickname}
      theme={SENDBIRD_CONFIG.THEME}
      imageCompression={SENDBIRD_CONFIG.IMAGE_COMPRESSION}
      // 커스텀 설정
      config={{
        logLevel: 'warn',
        // 멘션(@) 기능 설정
        userMention: {
          maxMentionCount: 10,      // 한 메시지에서 최대 멘션 수
          maxSuggestionCount: 15,   // 추천 목록에 표시될 최대 사용자 수
        },
      }}
    >
      {children}
    </SendbirdProvider>
  );
}

