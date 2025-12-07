import { useState, useCallback } from 'react'
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow'

// 링크 카드 노드 데이터 타입
export interface LinkCardNodeData {
  url: string
  title?: string
  description?: string
  favicon?: string
}

export function LinkCardNode({ id, data, selected }: NodeProps<LinkCardNodeData>) {
  const { setNodes } = useReactFlow()
  const [isEditing, setIsEditing] = useState(!data.url)
  const [inputUrl, setInputUrl] = useState(data.url || '')

  // URL 저장
  const handleSave = useCallback(() => {
    if (!inputUrl.trim()) return

    // URL 형식 보정
    let finalUrl = inputUrl.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }

    // 도메인에서 제목 추출
    let title = data.title
    if (!title) {
      try {
        const urlObj = new URL(finalUrl)
        title = urlObj.hostname.replace('www.', '')
      } catch {
        title = finalUrl
      }
    }

    // favicon URL 생성
    let favicon = data.favicon
    if (!favicon) {
      try {
        const urlObj = new URL(finalUrl)
        favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      } catch {
        favicon = undefined
      }
    }

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              url: finalUrl,
              title,
              favicon,
            },
          }
        }
        return node
      })
    )
    setIsEditing(false)
  }, [id, inputUrl, data.title, data.favicon, setNodes])

  // 링크 열기
  const handleOpenLink = useCallback(() => {
    if (data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
  }, [data.url])

  // 더블클릭으로 편집 모드
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setInputUrl(data.url || '')
  }, [data.url])

  // 키보드 이벤트
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setInputUrl(data.url || '')
    }
  }, [handleSave, data.url])

  return (
    <div
      className={`link-card-node ${selected ? 'selected' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Left} id="link-in" />

      {isEditing ? (
        // 편집 모드
        <div className="link-card-edit nodrag">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="URL을 입력하세요 (예: google.com)"
            autoFocus
          />
          <div className="link-card-edit-buttons">
            <button onClick={handleSave} className="save-btn">저장</button>
            <button onClick={() => setIsEditing(false)} className="cancel-btn">취소</button>
          </div>
        </div>
      ) : (
        // 표시 모드
        <div className="link-card-display" onClick={handleOpenLink}>
          <div className="link-card-header">
            {data.favicon && (
              <img
                src={data.favicon}
                alt=""
                className="link-card-favicon"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            <span className="link-card-title">{data.title || '링크'}</span>
          </div>
          <div className="link-card-url">{data.url}</div>
          <div className="link-card-hint">클릭하여 열기 • 더블클릭하여 편집</div>
        </div>
      )}

      <Handle type="source" position={Position.Right} id="link-out" />
    </div>
  )
}
