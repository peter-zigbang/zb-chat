// 사용자 정보 타입
export interface UserInfo {
  userId: string;
  nickname: string;
}

// 로그인 페이지 Props
export interface LoginPageProps {
  onLogin: (userInfo: UserInfo) => void;
}

// 채팅 페이지 Props
export interface ChatPageProps {
  userId: string;
  nickname: string;
  onLogout?: () => void;
  onDualMode?: () => void;
  embedded?: boolean;
}

// 채널 정보 타입 (zigbang 스타일)
export interface ChannelInfo {
  channelUrl: string;
  name: string;
  coverUrl?: string;
  lastMessage?: string;
  unreadCount: number;
  createdAt: number;
}

// 커스텀 메시지 데이터 타입들 (zigbang 스타일)
export interface HouseInquiryMessageData {
  itemId: number;
  tagText: string;
  title: string;
  subtitle1: string;
  subtitle2: string;
  imageUrl: string;
  serviceType: string;
}

export interface DanjiInquiryMessageData {
  danjiId: number;
  title: string;
  subtitle1: string;
  subtitle2: string;
  imageUrl: string;
}

export interface DanjiItemInquiryMessageData {
  danjiId: number;
  danjiItemId: number;
  hoId: number;
  tranType: string;
  itemSource: string;
  itemType: string;
  tagText: string;
  title: string;
  subtitle1: string;
  subtitle2: string;
  imageUrl: string;
}

