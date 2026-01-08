import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent, useEffect } from 'react';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import type { UserMessage, FileMessage } from '@sendbird/chat/message';
import type { Member } from '@sendbird/chat/groupChannel';
import styles from './CustomMessageInput.module.css';

interface MentionedUser {
  userId: string;
  nickname: string;
}

interface Props {
  // 초기 문의 텍스트 (직방 스타일)
  initialText?: string;
  // placeholder 텍스트
  placeholder?: string;
  // 메시지 전송 콜백
  onMessageSent?: (message: string) => void;
  // 파일 전송 콜백
  onFileSent?: (file: File) => void;
  // Reply 대상 메시지
  replyToMessage?: UserMessage | FileMessage | null;
  // Reply 취소 콜백
  onCancelReply?: () => void;
}

export function CustomMessageInput({
  initialText = '',
  placeholder = '메시지를 입력하세요...',
  onMessageSent,
  onFileSent,
  replyToMessage,
  onCancelReply,
}: Props) {
  const [text, setText] = useState(initialText);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string; isVideo?: boolean }[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // 멘션 관련 상태
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  // Sendbird Channel Context
  // sendMessage: 텍스트 메시지 전송 (params: { message: string, quoteMessage?, mentionedUsers?, mentionTemplate? })
  // sendFileMessage: 파일 전송 (file: File, quoteMessage?) => Promise<FileMessage>
  const { currentGroupChannel, sendMessage, sendFileMessage } = useChannelContext();

  // 채널 멤버 목록
  const members = currentGroupChannel?.members || [];

  // 멘션 쿼리에 따른 멤버 필터링
  useEffect(() => {
    if (!showMentionList || !currentGroupChannel) {
      setFilteredMembers([]);
      return;
    }

    const query = mentionQuery.toLowerCase();
    const filtered = members.filter(member => {
      const nickname = member.nickname?.toLowerCase() || '';
      const userId = member.userId.toLowerCase();
      return nickname.includes(query) || userId.includes(query);
    });
    
    setFilteredMembers(filtered.slice(0, 10)); // 최대 10명
    setSelectedMentionIndex(0);
  }, [showMentionList, mentionQuery, members, currentGroupChannel]);

  // 멘션 시작 감지
  const detectMention = useCallback((value: string, cursorPosition: number) => {
    // 커서 위치에서 뒤로 @ 찾기
    let atIndex = -1;
    for (let i = cursorPosition - 1; i >= 0; i--) {
      const char = value[i];
      if (char === '@') {
        atIndex = i;
        break;
      }
      // 공백이나 줄바꿈을 만나면 중단
      if (char === ' ' || char === '\n') {
        break;
      }
    }

    if (atIndex >= 0) {
      const query = value.slice(atIndex + 1, cursorPosition);
      // @ 바로 앞이 공백이거나 문장 시작인 경우만 멘션으로 처리
      if (atIndex === 0 || value[atIndex - 1] === ' ' || value[atIndex - 1] === '\n') {
        setShowMentionList(true);
        setMentionQuery(query);
        setMentionStartIndex(atIndex);
        return;
      }
    }

    setShowMentionList(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  }, []);

  // 멘션 선택
  const handleSelectMention = useCallback((member: Member) => {
    if (mentionStartIndex < 0 || !textareaRef.current) return;

    const beforeMention = text.slice(0, mentionStartIndex);
    const afterMention = text.slice(textareaRef.current.selectionStart);
    const mentionText = `@${member.nickname} `;
    
    const newText = beforeMention + mentionText + afterMention;
    setText(newText);
    
    // 멘션된 사용자 추가 (중복 제거)
    setMentionedUsers(prev => {
      const exists = prev.some(u => u.userId === member.userId);
      if (exists) return prev;
      return [...prev, { userId: member.userId, nickname: member.nickname || member.userId }];
    });

    // 멘션 목록 닫기
    setShowMentionList(false);
    setMentionQuery('');
    setMentionStartIndex(-1);

    // 커서 위치 조정
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [text, mentionStartIndex]);

  // 텍스트 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (!text.trim() && previewFiles.length === 0) return;
    if (!currentGroupChannel) return;
    if (isSending) return;

    setIsSending(true);

    try {
      // 먼저 파일들 전송
      for (const { file } of previewFiles) {
        console.log('[CustomMessageInput] Sending file:', file.name, file.type, file.size);
        try {
          await sendFileMessage(file);
          console.log('[CustomMessageInput] File sent successfully:', file.name);
          onFileSent?.(file);
        } catch (fileError) {
          console.error('[CustomMessageInput] File send error:', fileError);
          throw fileError;
        }
      }

      // 텍스트 메시지 전송
      if (text.trim()) {
        // 멘션된 사용자 ID 목록 생성
        const mentionedUserIds = mentionedUsers
          .filter(u => text.includes(`@${u.nickname}`))
          .map(u => u.userId);

        console.log('[CustomMessageInput] Sending with mentions:', mentionedUserIds);

        sendMessage({
          message: text.trim(),
          // Reply 대상 메시지가 있으면 quoteMessage로 전달
          ...(replyToMessage && { quoteMessage: replyToMessage }),
          // 멘션된 사용자들
          ...(mentionedUserIds.length > 0 && { 
            mentionedUserIds,
            mentionType: 'users',
          }),
        });
        onMessageSent?.(text.trim());
      }

      // 입력 초기화
      setText('');
      setPreviewFiles([]);
      setMentionedUsers([]);
      
      // Reply 초기화
      onCancelReply?.();
      
      // textarea 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    } finally {
      setIsSending(false);
    }
  }, [text, previewFiles, currentGroupChannel, sendMessage, sendFileMessage, onMessageSent, onFileSent, isSending, replyToMessage, onCancelReply]);

  // Enter 키 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 멘션 목록이 열려있을 때
    if (showMentionList && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(filteredMembers[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionList(false);
        return;
      }
    }

    // 일반 Enter 처리 (메시지 전송)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 파일 크기 제한 (5MB - Sendbird Free plan 기준)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_FILE_SIZE_MB = 5;

  // 파일 선택 핸들러
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('[CustomMessageInput] handleFileSelect called, files:', files);
    
    if (!files || files.length === 0) {
      console.log('[CustomMessageInput] No files selected');
      return;
    }

    const validFiles: typeof previewFiles = [];
    const oversizedFiles: string[] = [];

    Array.from(files).forEach(file => {
      console.log('[CustomMessageInput] Processing file:', file.name, file.type, file.size);
      
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      validFiles.push({
        file,
        preview: (isImage || isVideo) ? URL.createObjectURL(file) : '',
        isVideo,
      });
    });

    if (oversizedFiles.length > 0) {
      alert(`파일 크기 제한 초과 (최대 ${MAX_FILE_SIZE_MB}MB):\n${oversizedFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      console.log('[CustomMessageInput] Adding files to preview:', validFiles.length);
      setPreviewFiles(prev => [...prev, ...validFiles]);
    }
    
    // input 초기화 (같은 파일 다시 선택 가능하게)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // 파일 제거
  const removeFile = (index: number) => {
    setPreviewFiles(prev => {
      const removed = prev[index];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files) return;

    const validFiles: typeof previewFiles = [];
    const oversizedFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      validFiles.push({
        file,
        preview: (isImage || isVideo) ? URL.createObjectURL(file) : '',
        isVideo,
      });
    });

    if (oversizedFiles.length > 0) {
      alert(`파일 크기 제한 초과 (최대 ${MAX_FILE_SIZE_MB}MB):\n${oversizedFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setPreviewFiles(prev => [...prev, ...validFiles]);
    }
  };

  // Textarea 자동 높이 조절
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setText(value);
    
    // 멘션 감지
    detectMention(value, cursorPosition);
    
    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const isDisabled = !currentGroupChannel;
  const canSend = (text.trim() || previewFiles.length > 0) && !isSending;

  // Reply 메시지 텍스트 가져오기
  const getReplyMessageText = () => {
    if (!replyToMessage) return '';
    
    // UserMessage인 경우
    if ('message' in replyToMessage && replyToMessage.message) {
      return replyToMessage.message;
    }
    
    // FileMessage인 경우
    if ('name' in replyToMessage && replyToMessage.name) {
      return `📎 ${replyToMessage.name}`;
    }
    
    return '메시지';
  };

  return (
    <div 
      className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Reply 프리뷰 영역 */}
      {replyToMessage && (
        <div className={styles.replyPreview}>
          <div className={styles.replyBar} />
          <div className={styles.replyContent}>
            <span className={styles.replySender}>
              {replyToMessage.sender?.nickname || '알 수 없음'}에게 답장
            </span>
            <span className={styles.replyText}>
              {getReplyMessageText().slice(0, 60)}
              {getReplyMessageText().length > 60 ? '...' : ''}
            </span>
          </div>
          <button
            type="button"
            className={styles.replyCancelButton}
            onClick={onCancelReply}
            title="답장 취소"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* 파일 미리보기 영역 */}
      {previewFiles.length > 0 && (
        <div className={styles.previewContainer}>
          {previewFiles.map((item, index) => (
            <div key={index} className={styles.previewItem}>
              {item.preview ? (
                item.isVideo ? (
                  <video src={item.preview} className={styles.previewImage} muted />
                ) : (
                  <img src={item.preview} alt={item.file.name} className={styles.previewImage} />
                )
              ) : (
                <div className={styles.fileIcon}>
                  <span className={styles.fileExtension}>
                    {item.file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(index)}
                className={styles.removeButton}
                type="button"
              >
                ×
              </button>
              <span className={styles.fileName}>{item.file.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* 멘션 목록 팝업 */}
      {showMentionList && filteredMembers.length > 0 && (
        <div ref={mentionListRef} className={styles.mentionList}>
          <div className={styles.mentionHeader}>
            멤버 선택 <span className={styles.mentionHint}>↑↓ 이동, Enter 선택</span>
          </div>
          {filteredMembers.map((member, index) => (
            <button
              key={member.userId}
              className={`${styles.mentionItem} ${index === selectedMentionIndex ? styles.selected : ''}`}
              onClick={() => handleSelectMention(member)}
              onMouseEnter={() => setSelectedMentionIndex(index)}
            >
              <div className={styles.mentionAvatar}>
                {member.profileUrl ? (
                  <img src={member.profileUrl} alt={member.nickname} />
                ) : (
                  <span>{(member.nickname || member.userId)[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className={styles.mentionInfo}>
                <span className={styles.mentionNickname}>{member.nickname || member.userId}</span>
                <span className={styles.mentionUserId}>@{member.userId}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 입력 영역 */}
      <div className={styles.inputWrapper}>
        {/* 첨부 버튼 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={styles.attachButton}
          disabled={isDisabled}
          title="파일 첨부"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* 이미지 버튼 */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className={styles.imageButton}
          disabled={isDisabled}
          title="이미지 첨부"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        {/* 텍스트 입력 */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.textarea}
          disabled={isDisabled}
          rows={1}
        />

        {/* 전송 버튼 */}
        <button
          type="button"
          onClick={handleSendMessage}
          className={`${styles.sendButton} ${canSend ? styles.active : ''}`}
          disabled={!canSend}
          title="전송"
        >
          {isSending ? (
            <div className={styles.spinner} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
        multiple
        accept="*/*"
      />

      {/* 숨겨진 이미지 입력 */}
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
        multiple
        accept="image/*"
      />

      {/* 드래그 오버레이 */}
      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragContent}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>파일을 여기에 놓으세요</span>
          </div>
        </div>
      )}
    </div>
  );
}
