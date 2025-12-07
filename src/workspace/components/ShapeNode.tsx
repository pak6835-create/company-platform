import { useState } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { ShapeNodeData } from '../types'

// 프리셋 색상들
const PRESET_COLORS = [
  '#3b82f6', // 파랑
  '#ef4444', // 빨강
  '#22c55e', // 초록
  '#f59e0b', // 주황
  '#8b5cf6', // 보라
  '#ec4899', // 분홍
  '#06b6d4', // 청록
  '#6b7280', // 회색
]

export function ShapeNode({ id, data, selected }: NodeProps<ShapeNodeData>) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const { setNodes } = useReactFlow()

  // 색상 변경 핸들러
  const handleColorChange = (color: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, backgroundColor: color } }
        }
        return node
      })
    )
    setShowColorPicker(false)
  }

  return (
    <div
      className={`shape-node shape-${data.shape} ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor: data.backgroundColor || '#3b82f6',
        opacity: 0.5,
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
      onDoubleClick={() => setShowColorPicker(!showColorPicker)}
    >
      <Handle type="target" position={Position.Left} id="shape-in" />
      <NodeResizer isVisible={selected} minWidth={50} minHeight={50} />

      {/* 색상 선택 팝업 */}
      {showColorPicker && (
        <div
          className="shape-color-picker nodrag"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            zIndex: 1000,
            marginTop: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {PRESET_COLORS.map((color) => (
            <div
              key={color}
              onClick={() => handleColorChange(color)}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: color,
                borderRadius: '4px',
                cursor: 'pointer',
                border: data.backgroundColor === color ? '2px solid white' : '2px solid transparent',
              }}
            />
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} id="shape-out" />
    </div>
  )
}
