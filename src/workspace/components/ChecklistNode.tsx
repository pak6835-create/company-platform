import { useState, useCallback } from 'react'
import { NodeProps, Handle, Position, useReactFlow, NodeResizer } from 'reactflow'

// 체크리스트 아이템 타입
export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

// 체크리스트 노드 데이터 타입
export interface ChecklistNodeData {
  title: string
  items: ChecklistItem[]
}

export function ChecklistNode({ id, data, selected }: NodeProps<ChecklistNodeData>) {
  const { setNodes } = useReactFlow()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(data.title || '체크리스트')
  const [newItemText, setNewItemText] = useState('')

  // 노드 데이터 업데이트 헬퍼
  const updateNodeData = useCallback((updates: Partial<ChecklistNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...updates } }
        }
        return node
      })
    )
  }, [id, setNodes])

  // 제목 저장
  const handleSaveTitle = useCallback(() => {
    updateNodeData({ title: titleInput.trim() || '체크리스트' })
    setEditingTitle(false)
  }, [titleInput, updateNodeData])

  // 새 아이템 추가
  const handleAddItem = useCallback(() => {
    if (!newItemText.trim()) return

    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      checked: false,
    }

    updateNodeData({ items: [...(data.items || []), newItem] })
    setNewItemText('')
  }, [newItemText, data.items, updateNodeData])

  // 아이템 체크 토글
  const handleToggleItem = useCallback((itemId: string) => {
    const updatedItems = (data.items || []).map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )
    updateNodeData({ items: updatedItems })
  }, [data.items, updateNodeData])

  // 아이템 삭제
  const handleDeleteItem = useCallback((itemId: string) => {
    const updatedItems = (data.items || []).filter((item) => item.id !== itemId)
    updateNodeData({ items: updatedItems })
  }, [data.items, updateNodeData])

  // 키보드 이벤트
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: 'title' | 'add') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (action === 'title') {
        handleSaveTitle()
      } else {
        handleAddItem()
      }
    } else if (e.key === 'Escape' && action === 'title') {
      setEditingTitle(false)
      setTitleInput(data.title || '체크리스트')
    }
  }, [handleSaveTitle, handleAddItem, data.title])

  const items = data.items || []
  const completedCount = items.filter((item) => item.checked).length
  const totalCount = items.length

  return (
    <div
      className={`checklist-node ${selected ? 'selected' : ''}`}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <NodeResizer isVisible={selected} minWidth={200} minHeight={150} />
      <Handle type="target" position={Position.Left} id="checklist-in" />

      {/* 헤더 */}
      <div className="checklist-header">
        {editingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'title')}
            onBlur={handleSaveTitle}
            className="checklist-title-input nodrag"
            autoFocus
          />
        ) : (
          <div
            className="checklist-title"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {data.title || '체크리스트'}
          </div>
        )}
        {totalCount > 0 && (
          <div className="checklist-progress">
            {completedCount}/{totalCount}
          </div>
        )}
      </div>

      {/* 진행률 바 */}
      {totalCount > 0 && (
        <div className="checklist-progress-bar">
          <div
            className="checklist-progress-fill"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* 아이템 리스트 */}
      <div className="checklist-items nodrag">
        {items.map((item) => (
          <div
            key={item.id}
            className={`checklist-item ${item.checked ? 'checked' : ''}`}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleToggleItem(item.id)}
              className="checklist-checkbox"
            />
            <span className="checklist-item-text">{item.text}</span>
            <button
              className="checklist-item-delete"
              onClick={() => handleDeleteItem(item.id)}
              title="삭제"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 새 아이템 추가 */}
      <div className="checklist-add nodrag">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'add')}
          placeholder="새 할 일 추가..."
          className="checklist-add-input"
        />
        <button
          onClick={handleAddItem}
          className="checklist-add-btn"
          disabled={!newItemText.trim()}
        >
          +
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="checklist-out" />
    </div>
  )
}
