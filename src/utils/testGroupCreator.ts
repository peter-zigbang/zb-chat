import SendbirdChat, { SendbirdChatWith } from '@sendbird/chat';
import { GroupChannelModule, GroupChannelCreateParams } from '@sendbird/chat/groupChannel';
import { SENDBIRD_CONFIG } from '@/config/sendbird';

// 50명 테스트 그룹 생성 유틸리티

/**
 * 테스트용 사용자 ID 생성
 */
export function generateTestUserIds(count: number, prefix = 'test_user'): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`);
}

/**
 * 50명 그룹 채널 생성
 */
export async function createTestGroupWith50Members(
  currentUserId: string,
  channelName = '50명 테스트 그룹'
): Promise<{ success: boolean; channelUrl?: string; error?: string }> {
  try {
    // Sendbird 초기화
    const sb = SendbirdChat.init({
      appId: SENDBIRD_CONFIG.APP_ID,
      modules: [new GroupChannelModule()],
    }) as SendbirdChatWith<[GroupChannelModule]>;

    // 현재 사용자로 연결
    await sb.connect(currentUserId);

    // 49명의 테스트 사용자 ID 생성 (현재 사용자 + 49명 = 50명)
    const testUserIds = generateTestUserIds(49, 'member');
    const allUserIds = [currentUserId, ...testUserIds];

    // 그룹 채널 생성 파라미터
    const params: GroupChannelCreateParams = {
      name: channelName,
      invitedUserIds: allUserIds,
      isDistinct: false, // 새 채널 생성
      operatorUserIds: [currentUserId], // 현재 사용자를 운영자로
      customType: 'TEST_GROUP_50',
    };

    // 채널 생성
    const channel = await sb.groupChannel.createChannel(params);

    console.log('✅ 50명 그룹 생성 완료:', {
      channelUrl: channel.url,
      memberCount: channel.memberCount,
      name: channel.name,
    });

    return {
      success: true,
      channelUrl: channel.url,
    };
  } catch (error) {
    console.error('❌ 그룹 생성 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 커스텀 멤버 수로 그룹 생성
 */
export async function createTestGroupWithMembers(
  currentUserId: string,
  memberCount: number,
  channelName?: string
): Promise<{ success: boolean; channelUrl?: string; error?: string; memberCount?: number }> {
  try {
    const sb = SendbirdChat.init({
      appId: SENDBIRD_CONFIG.APP_ID,
      modules: [new GroupChannelModule()],
    }) as SendbirdChatWith<[GroupChannelModule]>;

    await sb.connect(currentUserId);

    // 멤버 수 - 1 (현재 사용자 포함)
    const testUserIds = generateTestUserIds(memberCount - 1, 'member');
    const allUserIds = [currentUserId, ...testUserIds];

    const params: GroupChannelCreateParams = {
      name: channelName || `${memberCount}명 테스트 그룹`,
      invitedUserIds: allUserIds,
      isDistinct: false,
      operatorUserIds: [currentUserId],
      customType: `TEST_GROUP_${memberCount}`,
    };

    const channel = await sb.groupChannel.createChannel(params);

    console.log(`✅ ${memberCount}명 그룹 생성 완료:`, {
      channelUrl: channel.url,
      memberCount: channel.memberCount,
      name: channel.name,
    });

    return {
      success: true,
      channelUrl: channel.url,
      memberCount: channel.memberCount,
    };
  } catch (error) {
    console.error('❌ 그룹 생성 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 테스트 사용자를 Sendbird에 등록 (connect)
 * Sendbird에서는 한 번이라도 connect한 사용자만 그룹에 초대 가능
 */
async function registerTestUsers(userIds: string[], onProgress?: (current: number, total: number) => void): Promise<void> {
  const sb = SendbirdChat.init({
    appId: SENDBIRD_CONFIG.APP_ID,
    modules: [new GroupChannelModule()],
  }) as SendbirdChatWith<[GroupChannelModule]>;

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    try {
      await sb.connect(userId);
      await sb.updateCurrentUserInfo({ nickname: `Member ${i + 1}` });
      await sb.disconnect();
      onProgress?.(i + 1, userIds.length);
    } catch (error) {
      console.warn(`사용자 ${userId} 등록 실패:`, error);
    }
  }
}

/**
 * A, B, C 사용자가 포함된 멀티 그룹 생성 (멀티 모드용)
 * 50명의 테스트 사용자를 먼저 등록한 후 그룹 생성
 */
export async function createDualUserTestGroup(
  memberCount: number = 50,
  channelName?: string,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; channelUrl?: string; error?: string; memberCount?: number }> {
  try {
    // 메인 사용자 (A, B, C)
    const mainUsers = ['user_a', 'user_b', 'user_c'];
    
    // 추가 멤버 ID 생성
    const additionalMembers = generateTestUserIds(memberCount - mainUsers.length, 'member');
    const allUserIds = [...mainUsers, ...additionalMembers];

    onProgress?.(`🔄 ${additionalMembers.length}명의 테스트 사용자 등록 중...`);

    // 1단계: 모든 테스트 사용자를 Sendbird에 등록
    await registerTestUsers(allUserIds, (current, total) => {
      onProgress?.(`👤 사용자 등록 중: ${current}/${total}`);
    });

    onProgress?.('✅ 사용자 등록 완료! 그룹 생성 중...');

    // 2단계: user_a로 연결하여 그룹 생성
    const sb = SendbirdChat.init({
      appId: SENDBIRD_CONFIG.APP_ID,
      modules: [new GroupChannelModule()],
    }) as SendbirdChatWith<[GroupChannelModule]>;

    await sb.connect('user_a');
    await sb.updateCurrentUserInfo({ nickname: 'User A' });

    const params: GroupChannelCreateParams = {
      name: channelName || `${memberCount}명 테스트 그룹 (A↔B↔C)`,
      invitedUserIds: allUserIds,
      isDistinct: false,
      operatorUserIds: mainUsers,
      customType: `MULTI_TEST_GROUP_${memberCount}`,
    };

    const channel = await sb.groupChannel.createChannel(params);

    console.log(`✅ 멀티 테스트 그룹 생성 완료:`, {
      channelUrl: channel.url,
      memberCount: channel.memberCount,
      name: channel.name,
    });

    return {
      success: true,
      channelUrl: channel.url,
      memberCount: channel.memberCount,
    };
  } catch (error) {
    console.error('❌ 멀티 그룹 생성 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

