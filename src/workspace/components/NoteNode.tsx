import { useState, useRef, useEffect, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { NoteNodeData } from '../types'

export function NoteNode({ id, data, selected }: NodeProps<NoteNodeData>) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(data.content || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { setNodes } = useReactFlow()

  // 외부 데이터가 변경되면 동기화
  useEffect(() => {
    setContent(data.content || '')
  }, [data.content])

  // 컨텐츠에 따른 노드 높이 계산
  const calculatedHeight = useMemo(() => {
    if (!content) return 100 // 빈 노트 최소 높이
    const lineCount = content.split('\n').length
    const charPerLine = 25 // 대략적인 한 줄 글자 수
    const estimatedLines = Math.max(lineCount, Math.ceil(content.length / charPerLine))
    const height = 60 + estimatedLines * 20 // 기본 패딩 + 줄당 높이
    return Math.max(100, Math.min(height, 500))
  }, [content])

  // 노드 크기 자동 조절 (편집 모드가 아닐 때만)
  useEffect(() => {
    if (isEditing) return // 편집 중에는 자동 조절 안함
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          const currentHeight = (n.style?.height as number) || 100
          if (Math.abs(currentHeight - calculatedHeight) > 20) {
            return { ...n, style: { ...n.style, height: calculatedHeight } }
          }
        }
        return n
      })
    )
  }, [calculatedHeight, id, setNodes, isEditing])

  // 편집 모드 시작시 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // 편집 완료 시 노드 데이터 업데이트
  const handleBlur = () => {
    setIsEditing(false)
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, content } }
        }
        return n
      })
    )
  }

  // 엔터키(Shift 없이)로 편집 완료
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(data.content || '')
      setIsEditing(false)
    }
  }

  // 리사이즈 핸들러
  const handleResize = (_: unknown, params: { width: number; height: number }) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            style: { ...node.style, width: params.width, height: params.height },
          }
        }
        return node
      })
    )
  }

  return (
    <div
      className={`note-node ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor: data.backgroundColor || '#fef3c7',
        width: '100%',
        height: '100%',
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Left} id="note-in" />
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={100}
        onResize={handleResize}
      />
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="note-edit-textarea nodrag"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="note-content">{content || '더블클릭하여 편집'}</div>
      )}
      <Handle type="source" position={Position.Right} id="note-out" />
    </div>
  )
}
