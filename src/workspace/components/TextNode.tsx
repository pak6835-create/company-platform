import { useState, useRef, useEffect, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { TextNodeData } from '../types'

export function TextNode({ id, data, selected }: NodeProps<TextNodeData>) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(data.text || '')
  const inputRef = useRef<HTMLInputElement>(null)
  const { setNodes } = useReactFlow()

  // 외부 데이터가 변경되면 동기화
  useEffect(() => {
    setText(data.text || '')
  }, [data.text])

  // 컨텐츠에 따른 노드 너비 계산
  const calculatedWidth = useMemo(() => {
    const fontSize = data.fontSize || 16
    const charWidth = fontSize * 0.6 // 대략적인 글자 너비
    const padding = 24 // 양쪽 패딩
    const minWidth = 100
    const maxWidth = 400
    const width = Math.max(minWidth, Math.min(text.length * charWidth + padding, maxWidth))
    return width
  }, [text, data.fontSize])

  // 노드 너비 자동 조절 (편집 모드가 아닐 때만)
  useEffect(() => {
    if (isEditing) return
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          const currentWidth = (n.style?.width as number) || 100
          if (Math.abs(currentWidth - calculatedWidth) > 20) {
            return { ...n, style: { ...n.style, width: calculatedWidth } }
          }
        }
        return n
      })
    )
  }, [calculatedWidth, id, setNodes, isEditing])

  // 편집 모드 시작시 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // 편집 완료 시 노드 데이터 업데이트
  const handleBlur = () => {
    setIsEditing(false)
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, text } }
        }
        return n
      })
    )
  }

  // 엔터키로 편집 완료
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setText(data.text || '')
      setIsEditing(false)
    }
  }

  return (
    <div
      className={`text-node ${selected ? 'selected' : ''}`}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Left} id="text-in" />
      <NodeResizer isVisible={selected} minWidth={100} minHeight={30} />
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="text-edit-input nodrag"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            fontSize: data.fontSize || 16,
            color: data.color || '#374151',
          }}
        />
      ) : (
        <div
          className="text-content"
          style={{
            fontSize: data.fontSize || 16,
            color: data.color || '#374151',
          }}
        >
          {text || '더블클릭하여 편집'}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="text-out" />
    </div>
  )
}
