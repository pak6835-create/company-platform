import { NodeProps, NodeResizer, Handle, Position } from 'reactflow'
import { TextNodeData } from '../types'

export function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  return (
    <div className={`text-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="text-in" />
      <NodeResizer isVisible={selected} minWidth={100} minHeight={30} />
      <div
        className="text-content"
        style={{
          fontSize: data.fontSize || 16,
          color: data.color || '#374151',
        }}
      >
        {data.text}
      </div>
      <Handle type="source" position={Position.Right} id="text-out" />
    </div>
  )
}
