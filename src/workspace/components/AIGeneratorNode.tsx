import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useStore, useReactFlow } from 'reactflow'
import { AIGeneratorNodeData } from '../types'

// 모델 목록 (나노바나나 = Gemini 이미지 생성 모델 코드명)
// 공식 문서: https://ai.google.dev/gemini-api/docs/image-generation
const MODELS = [
  { id: 'gemini-2.0-flash-preview-image-generation', name: '나노바나나 2' },
  { id: 'gemini-2.5-flash-preview-image-generation', name: '나노바나나 2.5' },
  { id: 'gemini-3-pro-image-preview', name: '나노바나나 3 Pro' },
]

// 어셋 라이브러리 이벤트 발생 함수
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

export function AIGeneratorNode({ data, selected, id }: NodeProps<AIGeneratorNodeData>) {
  const [localApiKey, setLocalApiKey] = useState(data.apiKey || '')
  const [localModel, setLocalModel] = useState(data.model || 'gemini-2.0-flash-preview-image-generation')
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; prompt: string }>>([])
  const nodeRef = useRef<HTMLDivElement>(null)
  const { setNodes } = useReactFlow()

  // 연결된 노드 데이터 수집 - 안전하게 접근
  const edges = useStore((s) => s.edges || [])
  const nodes = useStore((s) => s.nodes || [])

  // useMemo로 연결 정보 계산 (안전한 접근)
  const { connectedSources, connectedPrompts, connectedRefs, connectedCharMakers } = useMemo(() => {
    if (!Array.isArray(edges) || !Array.isArray(nodes)) {
      return { connectedSources: [], connectedPrompts: '', connectedRefs: [], connectedCharMakers: [] }
    }

    const sources = edges
      .filter((e) => e && e.target === id)
      .map((e) => nodes.find((n) => n && n.id === e.source))
      .filter(Boolean)

    // 프롬프트 노드에서 combinedPrompt 수집
    const promptNodes = sources.filter((n) => n?.type?.startsWith('prompt'))
    const promptTexts = promptNodes
      .map((n) => n?.data?.combinedPrompt)
      .filter(Boolean)

    // 캐릭터 메이커 노드에서 combinedPrompt 수집
    const charMakers = sources.filter((n) => n?.type === 'characterMaker')
    const charMakerTexts = charMakers
      .map((n) => n?.data?.combinedPrompt)
      .filter(Boolean)

    // 모든 프롬프트 합치기
    const allPrompts = [...promptTexts, ...charMakerTexts].join(', ')

    const refs = sources
      .filter((n) => n?.type === 'reference')
      .map((n) => ({
        type: n?.data?.referenceType || 'unknown',
        hasImage: !!n?.data?.image,
        image: n?.data?.image || null,
        strength: n?.data?.strength || 0.8,
      }))

    return {
      connectedSources: sources,
      connectedPrompts: allPrompts,
      connectedRefs: refs,
      connectedCharMakers: charMakers
    }
  }, [edges, nodes, id])

  // 최종 프롬프트 생성
  const getFinalPrompt = useCallback(() => {
    const parts: string[] = []
    if (localPrompt.trim()) parts.push(localPrompt.trim())
    if (connectedPrompts) parts.push(connectedPrompts)
    return parts.join(', ')
  }, [localPrompt, connectedPrompts])

  // 노드 크기 자동 조절
  const autoResizeNode = useCallback(() => {
    if (nodeRef.current) {
      const height = nodeRef.current.scrollHeight + 20
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return { ...n, style: { ...n.style, height: Math.max(height, 400) } }
          }
          return n
        })
      )
    }
  }, [id, setNodes])

  // 이미지 갤러리가 변경될 때 크기 자동 조절
  useEffect(() => {
    if (generatedImages.length > 0) {
      setTimeout(autoResizeNode, 100)
    }
  }, [generatedImages.length, autoResizeNode])

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

      // API 요청 파트 구성
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

      // 텍스트 프롬프트 추가
      parts.push({ text: finalPrompt })

      // 연결된 이미지 참조 추가 (Gemini multimodal)
      const refImages = connectedRefs.filter((ref) => ref.hasImage && ref.image)
      for (const ref of refImages) {
        // base64 데이터 추출 (data:image/png;base64, 제거)
        const base64Data = ref.image.split(',')[1]
        if (base64Data) {
          const mimeType = ref.image.split(';')[0].split(':')[1] || 'image/png'
          parts.push({
            inlineData: { mimeType, data: base64Data }
          })
          // 참조 타입에 따른 추가 프롬프트
          parts.push({ text: `Use this image as ${ref.type} reference with ${Math.round(ref.strength * 100)}% strength.` })
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
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

      // 생성된 이미지를 목록에 추가
      const newImage = { url: imageUrl, prompt: finalPrompt.slice(0, 50) + '...' }
      setGeneratedImages((prev) => [newImage, ...prev].slice(0, 10))

      // 어셋 라이브러리에 자동 추가
      emitAssetAdd({ url: imageUrl, prompt: finalPrompt, timestamp: Date.now() })

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
    <div ref={nodeRef} className={`ai-generator-node ${selected ? 'selected' : ''} ${hasConnections ? 'has-connections' : ''}`}>
      <Handle type="target" position={Position.Left} id="prompt-in" />
      <NodeResizer isVisible={selected} minWidth={300} minHeight={200} />

      <div className="ai-node-header">
        <span>🤖 AI 이미지 생성기</span>
        {hasConnections && <span className="connection-badge">🔗 {connectedSources.length}</span>}
      </div>

      <div className="ai-node-content nodrag" onMouseDown={(e) => e.stopPropagation()}>
        {hasConnections && (
          <div className="ai-node-connections">
            <div className="connections-title">📥 연결된 노드 ({connectedSources.length}):</div>
            {connectedSources
              .filter((n) => n?.type?.startsWith('prompt'))
              .map((n, i) => (
                <div key={`prompt-${i}`} className="connection-item prompt-connection">
                  <span className="conn-icon">🎨</span>
                  <span className="conn-label">{n?.type?.replace('prompt', '')}</span>
                  <span className="conn-status">{n?.data?.combinedPrompt ? '✓' : '⚠️'}</span>
                  {n?.data?.combinedPrompt && (
                    <div className="conn-preview">{n.data.combinedPrompt.slice(0, 30)}...</div>
                  )}
                </div>
              ))}
            {connectedCharMakers.map((n, i) => (
              <div key={`char-${i}`} className="connection-item charmaker-connection">
                <span className="conn-icon">🎭</span>
                <span className="conn-label">캐릭터 메이커</span>
                <span className="conn-status">{n?.data?.combinedPrompt ? '✓' : '⚠️'}</span>
                {n?.data?.combinedPrompt && (
                  <div className="conn-preview">{n.data.combinedPrompt.slice(0, 30)}...</div>
                )}
              </div>
            ))}
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

        {/* 생성된 이미지 갤러리 */}
        {generatedImages.length > 0 && (
          <div className="ai-node-gallery">
            <label>🖼️ 생성된 이미지 ({generatedImages.length})</label>
            <div className="ai-node-gallery-grid">
              {generatedImages.map((img, idx) => (
                <div key={idx} className="ai-node-gallery-item">
                  <img
                    src={img.url}
                    alt={`생성 ${idx + 1}`}
                    onClick={() => window.open(img.url, '_blank')}
                    title={img.prompt}
                  />
                  <button
                    className="ai-node-download-btn"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = img.url
                      link.download = `generated-${Date.now()}.png`
                      link.click()
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    ⬇️
                  </button>
                </div>
              ))}
            </div>
            <button
              className="ai-node-clear-btn"
              onClick={() => setGeneratedImages([])}
              onMouseDown={(e) => e.stopPropagation()}
            >
              🗑️ 목록 비우기
            </button>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="image-out" />
    </div>
  )
}
