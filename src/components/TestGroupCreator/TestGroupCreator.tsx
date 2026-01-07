import { useState } from 'react';
import { createTestGroupWithMembers } from '@/utils/testGroupCreator';
import styles from './TestGroupCreator.module.css';

interface Props {
  userId: string;
  onGroupCreated?: (channelUrl: string) => void;
}

export function TestGroupCreator({ userId, onGroupCreated }: Props) {
  const [memberCount, setMemberCount] = useState(50);
  const [channelName, setChannelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    channelUrl?: string;
  } | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setResult(null);

    try {
      const response = await createTestGroupWithMembers(
        userId,
        memberCount,
        channelName || undefined
      );

      if (response.success) {
        setResult({
          success: true,
          message: `✅ ${response.memberCount}명 그룹 생성 완료!`,
          channelUrl: response.channelUrl,
        });
        onGroupCreated?.(response.channelUrl!);
      } else {
        setResult({
          success: false,
          message: `❌ 생성 실패: ${response.error}`,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🧪 테스트 그룹 생성</h3>
      
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>멤버 수</label>
          <input
            type="number"
            className={styles.input}
            value={memberCount}
            onChange={(e) => setMemberCount(Number(e.target.value))}
            min={2}
            max={100}
            disabled={isCreating}
          />
          <span className={styles.hint}>
            현재 사용자 포함 {memberCount}명
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>채널 이름 (선택)</label>
          <input
            type="text"
            className={styles.input}
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder={`${memberCount}명 테스트 그룹`}
            disabled={isCreating}
          />
        </div>

        <div className={styles.presets}>
          <span className={styles.presetLabel}>프리셋:</span>
          <button
            className={styles.presetButton}
            onClick={() => setMemberCount(10)}
            disabled={isCreating}
          >
            10명
          </button>
          <button
            className={styles.presetButton}
            onClick={() => setMemberCount(50)}
            disabled={isCreating}
          >
            50명
          </button>
          <button
            className={styles.presetButton}
            onClick={() => setMemberCount(100)}
            disabled={isCreating}
          >
            100명
          </button>
        </div>

        <button
          className={styles.createButton}
          onClick={handleCreate}
          disabled={isCreating || memberCount < 2}
        >
          {isCreating ? '생성 중...' : `${memberCount}명 그룹 생성`}
        </button>
      </div>

      {result && (
        <div className={`${styles.result} ${result.success ? styles.success : styles.error}`}>
          <p>{result.message}</p>
          {result.channelUrl && (
            <code className={styles.channelUrl}>{result.channelUrl}</code>
          )}
        </div>
      )}

      <div className={styles.info}>
        <h4>📋 테스트 정보</h4>
        <ul>
          <li>생성되는 멤버 ID: member_1, member_2, ... member_{memberCount - 1}</li>
          <li>현재 사용자({userId})가 운영자로 설정됩니다</li>
          <li>멘션(@) 테스트를 위해 maxSuggestionCount를 조정하세요</li>
        </ul>
      </div>
    </div>
  );
}

