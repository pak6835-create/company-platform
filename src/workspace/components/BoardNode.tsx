import { useState, useEffect, useRef } from 'react'
import { NodeProps } from 'reactflow'
import { BoardNodeData } from '../types'

export function BoardNode({ data, selected }: NodeProps<BoardNodeData>) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(data.name || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditName(data.name || '')
    setIsEditing(true)
  }

  const handleNameChange = () => {
    setIsEditing(false)
    if (data.onNameChange) {
      data.onNameChange(data.boardId, editName)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameChange()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(data.name || '')
    }
  }

  return (
    <div className={`board-node ${selected ? 'selected' : ''}`}>
      <div className="board-node-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={data.color || '#9ca3af'} strokeWidth="1.5">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      {isEditing ? (
        <input
          ref={inputRef}
          className="board-node-input nodrag"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameChange}
          onKeyDown={handleKeyDown}
          placeholder="보드 이름"
        />
      ) : (
        <div className="board-node-name" onDoubleClick={handleNameDoubleClick}>
          {data.name || ''}
        </div>
      )}
      {(data.itemCount ?? 0) > 0 && (
        <div className="board-node-count">{data.itemCount}</div>
      )}
    </div>
  )
}
