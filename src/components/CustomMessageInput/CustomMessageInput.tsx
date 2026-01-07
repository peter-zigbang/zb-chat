import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { useChannelContext } from '@sendbird/uikit-react/Channel/context';
import styles from './CustomMessageInput.module.css';

interface Props {
  // 초기 문의 텍스트 (직방 스타일)
  initialText?: string;
  // placeholder 텍스트
  placeholder?: string;
  // 메시지 전송 콜백
  onMessageSent?: (message: string) => void;
  // 파일 전송 콜백
  onFileSent?: (file: File) => void;
}

export function CustomMessageInput({
  initialText = '',
  placeholder = '메시지를 입력하세요...',
  onMessageSent,
  onFileSent,
}: Props) {
  const [text, setText] = useState(initialText);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string; isVideo?: boolean }[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sendbird Channel Context
  // sendMessage: 텍스트 메시지 전송 (params: { message: string, quoteMessage?, mentionedUsers?, mentionTemplate? })
  // sendFileMessage: 파일 전송 (file: File, quoteMessage?) => Promise<FileMessage>
  const { currentGroupChannel, sendMessage, sendFileMessage } = useChannelContext();

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
        sendMessage({
          message: text.trim(),
        });
        onMessageSent?.(text.trim());
      }

      // 입력 초기화
      setText('');
      setPreviewFiles([]);
      
      // textarea 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    } finally {
      setIsSending(false);
    }
  }, [text, previewFiles, currentGroupChannel, sendMessage, sendFileMessage, onMessageSent, onFileSent, isSending]);

  // Enter 키 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    setText(e.target.value);
    
    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const isDisabled = !currentGroupChannel;
  const canSend = (text.trim() || previewFiles.length > 0) && !isSending;

  return (
    <div 
      className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
