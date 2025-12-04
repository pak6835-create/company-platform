import { useState, useCallback, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useStore } from 'reactflow'
import { AIGeneratorNodeData } from '../types'

// 모델 목록 (나노바나나 = Gemini 이미지 생성 모델 코드명)
// 공식 문서: https://ai.google.dev/gemini-api/docs/image-generation
const MODELS = [
  { id: 'gemini-2.0-flash-preview-image-generation', name: '나노바나나 2' },
  { id: 'gemini-2.5-flash-preview-image-generation', name: '나노바나나 2.5' },
  { id: 'gemini-3-pro-image-preview', name: '나노바나나 3 Pro' },
]

export function AIGeneratorNode({ data, selected, id }: NodeProps<AIGeneratorNodeData>) {
  const [localApiKey, setLocalApiKey] = useState(data.apiKey || '')
  const [localModel, setLocalModel] = useState(data.model || 'gemini-2.0-flash-preview-image-generation')
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // 연결된 노드 데이터 수집 - 안전하게 접근
  const edges = useStore((s) => s.edges || [])
  const nodes = useStore((s) => s.nodes || [])

  // useMemo로 연결 정보 계산 (안전한 접근)
  const { connectedSources, connectedPrompts, connectedRefs } = useMemo(() => {
    if (!Array.isArray(edges) || !Array.isArray(nodes)) {
      return { connectedSources: [], connectedPrompts: '', connectedRefs: [] }
    }

    const sources = edges
      .filter((e) => e && e.target === id)
      .map((e) => nodes.find((n) => n && n.id === e.source))
      .filter(Boolean)

    const prompts = sources
      .filter((n) => n?.type?.startsWith('prompt'))
      .map((n) => n?.data?.combinedPrompt)
      .filter(Boolean)
      .join(', ')

    const refs = sources
      .filter((n) => n?.type === 'reference')
      .map((n) => ({
        type: n?.data?.referenceType || 'unknown',
        hasImage: !!n?.data?.image,
      }))

    return { connectedSources: sources, connectedPrompts: prompts, connectedRefs: refs }
  }, [edges, nodes, id])

  // 최종 프롬프트 생성
  const getFinalPrompt = useCallback(() => {
    const parts: string[] = []
    if (localPrompt.trim()) parts.push(localPrompt.trim())
    if (connectedPrompts) parts.push(connectedPrompts)
    return parts.join(', ')
  }, [localPrompt, connectedPrompts])

  const handleGenerate = async () => {
    const finalPrompt = getFinalPrompt()
    if (!localApiKey || !finalPrompt) {
      setError('API 키와 프롬프트를 입력하세요')
      return
    }
    setIsGenerating(true)
    setError('')

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${localModel}:generateContent?key=${localApiKey}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: { responseModalities: ['Text', 'Image'] },
        }),
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error.message || result.error)

      const imagePart = result.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { data: string } }) => p.inlineData?.data
      )
      if (!imagePart) throw new Error('이미지 생성 실패')

      const imageUrl = 'data:image/png;base64,' + imagePart.inlineData.data
      if (data.onGenerate) {
        data.onGenerate(imageUrl, finalPrompt.slice(0, 30) + '...')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasConnections = connectedSources.length > 0

  return (
    <div className={`ai-generator-node ${selected ? 'selected' : ''} ${hasConnections ? 'has-connections' : ''}`}>
      <Handle type="target" position={Position.Left} id="prompt-in" />
      <NodeResizer isVisible={selected} minWidth={300} minHeight={200} />

      <div className="ai-node-header">
        <span>🤖 AI 이미지 생성기</span>
        {hasConnections && <span className="connection-badge">🔗 {connectedSources.length}</span>}
      </div>

      <div className="ai-node-content nodrag" onMouseDown={(e) => e.stopPropagation()}>
        {hasConnections && (
          <div className="ai-node-connections">
            <div className="connections-title">📥 연결된 노드:</div>
            {connectedPrompts && (
              <div className="connection-item prompt-connection">
                <span className="conn-icon">🎨</span>
                <span className="conn-label">프롬프트 빌더</span>
                <span className="conn-status">✓</span>
              </div>
            )}
            {connectedRefs.map((ref, i) => (
              <div key={i} className={`connection-item ref-connection ${ref.hasImage ? 'has-image' : ''}`}>
                <span className="conn-icon">🖼️</span>
                <span className="conn-label">{ref.type} 참조</span>
                <span className="conn-status">{ref.hasImage ? '✓' : '⚠️'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="ai-node-field">
          <label>API 키</label>
          <div className="ai-node-input-row">
            <input
              className="nodrag"
              type={showApiKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="AIza..."
            />
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setShowApiKey(!showApiKey)}>
              {showApiKey ? '숨김' : '보기'}
            </button>
          </div>
        </div>

        <div className="ai-node-field">
          <label>모델</label>
          <select className="nodrag" value={localModel} onChange={(e) => setLocalModel(e.target.value)}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="ai-node-field">
          <label>추가 프롬프트</label>
          <textarea
            className="nodrag"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            placeholder="추가 지시사항..."
            rows={2}
          />
        </div>

        {getFinalPrompt() && (
          <div className="ai-node-preview">
            <label>📝 최종 프롬프트</label>
            <p>{getFinalPrompt()}</p>
          </div>
        )}

        {error && <div className="ai-node-error">{error}</div>}

        <button
          className="ai-node-generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating || !localApiKey}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isGenerating ? '생성 중...' : '🎨 이미지 생성'}
        </button>

        {!hasConnections && (
          <div className="ai-node-help">💡 프롬프트 빌더나 참조 노드를 연결하세요</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="image-out" />
    </div>
  )
}
