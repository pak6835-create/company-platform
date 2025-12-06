import { useState } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { ImageNodeData } from '../types'

export function ImageNode({ data, selected, id }: NodeProps<ImageNodeData>) {
  const { setNodes } = useReactFlow()
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleResize = (_: unknown, params: { width: number; height: number }) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, width: params.width, height: params.height },
          }
        }
        return node
      })
    )
  }

  return (
    <div
      className={`image-node ${selected ? 'selected' : ''}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={80}
        onResize={handleResize}
      />
      <div className="image-content">
        {!imageLoaded && <div className="image-loading">Loading...</div>}
        <img
          src={data.imageUrl}
          alt={data.label}
          className="image-thumbnail"
          onLoad={() => setImageLoaded(true)}
          style={{ display: imageLoaded ? 'block' : 'none' }}
          draggable={false}
        />
      </div>
      <div className="image-label">{data.label}</div>
      {/* 핸들 - 좌측 중앙 (입력) */}
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#3b82f6',
          width: 10,
          height: 10,
        }}
      />
      {/* 핸들 - 우측 중앙 (출력) */}
      <Handle
        type="source"
        position={Position.Right}
        id="image-out"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#10b981',
          width: 10,
          height: 10,
        }}
      />
    </div>
  )
}
