import type { UserMessage, FileMessage } from '@sendbird/chat/message';
import { MESSAGE_CUSTOM_TYPES } from '@/config/sendbird';
import type { HouseInquiryMessageData, DanjiInquiryMessageData, DanjiItemInquiryMessageData } from '@/types';
import styles from './CustomMessageRenderer.module.css';

interface Props {
  message: UserMessage | FileMessage;
}

// zigbang의 CustomMessageRenderer와 유사한 구현
export function CustomMessageRenderer({ message }: Props) {
  const customType = message.customType;
  
  // 메시지 데이터 파싱
  let data: unknown = null;
  try {
    if (message.data) {
      data = JSON.parse(message.data);
    }
  } catch {
    data = message.data;
  }

  // 메시지 타입별 렌더링
  switch (customType) {
    case MESSAGE_CUSTOM_TYPES.HOUSE_INQUIRY_ITEM:
      return <HouseInquiryMessage data={data as HouseInquiryMessageData} />;
    
    case MESSAGE_CUSTOM_TYPES.DANJI_INQUIRY_ITEM:
      return <DanjiInquiryMessage data={data as DanjiInquiryMessageData} />;
    
    case MESSAGE_CUSTOM_TYPES.DANJI_ITEM_INQUIRY_ITEM:
      return <DanjiItemInquiryMessage data={data as DanjiItemInquiryMessageData} />;
    
    case MESSAGE_CUSTOM_TYPES.AGENT_PROFILE_INQUIRY:
      return <AgentProfileMessage data={data} />;
    
    case MESSAGE_CUSTOM_TYPES.COLD_MESSAGE_INQUIRY:
      return <ColdMessageInquiry data={data} />;
    
    case MESSAGE_CUSTOM_TYPES.MULTIPLE_IMAGES:
      return <MultipleImagesMessage message={message as FileMessage} />;
    
    default:
      return <GenericCustomMessage customType={customType} data={data} />;
  }
}

// 매물 문의 메시지 (zigbang의 HouseInquiryMessageItemData)
function HouseInquiryMessage({ data }: { data: HouseInquiryMessageData }) {
  return (
    <div className={styles.cardMessage}>
      <div className={styles.cardBadge}>🏠 매물 문의</div>
      {data?.imageUrl && (
        <img src={data.imageUrl} alt="매물 이미지" className={styles.cardImage} />
      )}
      <div className={styles.cardContent}>
        <span className={styles.cardTag}>{data?.tagText || data?.itemId}</span>
        <h4 className={styles.cardTitle}>{data?.title || '가격 정보'}</h4>
        <p className={styles.cardSubtitle}>{data?.subtitle1}</p>
        <p className={styles.cardSubtitle}>{data?.subtitle2}</p>
      </div>
    </div>
  );
}

// 단지 문의 메시지 (zigbang의 DanjiInquiryMessageItemData)
function DanjiInquiryMessage({ data }: { data: DanjiInquiryMessageData }) {
  return (
    <div className={styles.cardMessage}>
      <div className={styles.cardBadge}>🏢 단지 문의</div>
      {data?.imageUrl && (
        <img src={data.imageUrl} alt="단지 이미지" className={styles.cardImage} />
      )}
      <div className={styles.cardContent}>
        <h4 className={styles.cardTitle}>{data?.title}</h4>
        <p className={styles.cardSubtitle}>{data?.subtitle1}</p>
        <p className={styles.cardSubtitle}>{data?.subtitle2}</p>
      </div>
    </div>
  );
}

// 단지 매물 문의 메시지
function DanjiItemInquiryMessage({ data }: { data: DanjiItemInquiryMessageData }) {
  return (
    <div className={styles.cardMessage}>
      <div className={styles.cardBadge}>🏠 아파트 매물</div>
      {data?.imageUrl && (
        <img src={data.imageUrl} alt="매물 이미지" className={styles.cardImage} />
      )}
      <div className={styles.cardContent}>
        <span className={styles.cardTag}>{data?.tagText}</span>
        <h4 className={styles.cardTitle}>{data?.title}</h4>
        <p className={styles.cardSubtitle}>{data?.subtitle1}</p>
        <p className={styles.cardSubtitle}>{data?.subtitle2}</p>
        <span className={styles.tranType}>{data?.tranType}</span>
      </div>
    </div>
  );
}

// 중개사 프로필 문의
function AgentProfileMessage({ data }: { data: unknown }) {
  const agentData = data as { agentId?: number; danjiId?: number; itemId?: number } | null;
  return (
    <div className={styles.cardMessage}>
      <div className={styles.cardBadge}>👤 중개사 문의</div>
      <div className={styles.cardContent}>
        <p>중개사 ID: {agentData?.agentId || 'N/A'}</p>
        {agentData?.danjiId && <p>단지 ID: {agentData.danjiId}</p>}
        {agentData?.itemId && <p>매물 ID: {agentData.itemId}</p>}
      </div>
    </div>
  );
}

// 동네픽 메시지
function ColdMessageInquiry({ data }: { data: unknown }) {
  const coldData = data as { title?: string; messageId?: number } | null;
  return (
    <div className={styles.cardMessage}>
      <div className={styles.cardBadge}>📍 동네픽</div>
      <div className={styles.cardContent}>
        <h4 className={styles.cardTitle}>{coldData?.title || '동네픽 메시지'}</h4>
        <p className={styles.cardSubtitle}>메시지 ID: {coldData?.messageId}</p>
      </div>
    </div>
  );
}

// 다중 이미지 메시지
function MultipleImagesMessage({ message }: { message: FileMessage }) {
  return (
    <div className={styles.cardMessage}>
      <div className={styles.cardBadge}>🖼️ 다중 이미지</div>
      <div className={styles.cardContent}>
        <p>이미지 메시지</p>
        {message.url && (
          <img src={message.url} alt="이미지" className={styles.cardImage} />
        )}
      </div>
    </div>
  );
}

// 기타 커스텀 메시지
function GenericCustomMessage({ customType, data }: { customType: string; data: unknown }) {
  return (
    <div className={styles.cardMessage}>
      <div className={styles.cardBadge}>📦 {customType}</div>
      <div className={styles.cardContent}>
        <pre className={styles.jsonData}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

