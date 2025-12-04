import { NodeProps, NodeResizer, Handle, Position } from 'reactflow'
import { ShapeNodeData } from '../types'

export function ShapeNode({ data, selected }: NodeProps<ShapeNodeData>) {
  return (
    <div
      className={`shape-node shape-${data.shape} ${selected ? 'selected' : ''}`}
      style={{
        backgroundColor: data.backgroundColor || '#3b82f6',
        width: data.width || 100,
        height: data.height || 100,
      }}
    >
      <Handle type="target" position={Position.Left} id="shape-in" />
      <NodeResizer isVisible={selected} minWidth={50} minHeight={50} />
      <Handle type="source" position={Position.Right} id="shape-out" />
    </div>
  )
}
