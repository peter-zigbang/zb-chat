// Sendbird 설정 - zigbang과 동일한 APP_ID 사용
export const SENDBIRD_CONFIG = {
  // zigbang에서 사용하는 Sendbird Application ID
  APP_ID: 'CDB015BB-B6AE-4A81-BA48-D0F10547185A',
  
  // 이미지 압축 설정
  IMAGE_COMPRESSION: {
    compressionRate: 0.7,
    resizingWidth: 1000,
    resizingHeight: 1000,
  },
  
  // 테마 설정 ('light' | 'dark')
  THEME: 'light' as const,
};

// 메시지 커스텀 타입 (zigbang과 동일)
export const MESSAGE_CUSTOM_TYPES = {
  HOUSE_INQUIRY_ITEM: 'HOUSE_INQUIRY_ITEM',
  DANJI_INQUIRY_ITEM: 'DANJI_INQUIRY_ITEM',
  DANJI_ITEM_INQUIRY_ITEM: 'DANJI_ITEM_INQUIRY_ITEM',
  AGENT_PROFILE_INQUIRY: 'AGENT_PROFILE_INQUIRY',
  COLD_MESSAGE_INQUIRY: 'COLD_MESSAGE_INQUIRY',
  MULTIPLE_IMAGES: 'MULTIPLE_IMAGES',
} as const;

export type MessageCustomType = typeof MESSAGE_CUSTOM_TYPES[keyof typeof MESSAGE_CUSTOM_TYPES];

