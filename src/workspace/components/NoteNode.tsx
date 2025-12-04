import { NodeProps, NodeResizer, Handle, Position } from 'reactflow'
import { NoteNodeData } from '../types'

export function NoteNode({ data, selected }: NodeProps<NoteNodeData>) {
  return (
    <div
      className={`note-node ${selected ? 'selected' : ''}`}
      style={{ backgroundColor: data.backgroundColor || '#fef3c7' }}
    >
      <Handle type="target" position={Position.Left} id="note-in" />
      <NodeResizer isVisible={selected} minWidth={150} minHeight={100} />
      <div className="note-content">{data.content}</div>
      <Handle type="source" position={Position.Right} id="note-out" />
    </div>
  )
}
