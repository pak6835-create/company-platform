import { useState, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { editImage, MODELS } from '../utils/geminiApi'

/**
 * 포즈 변경 노드
 *
 * 기능:
 * - 왼쪽 핸들: 캐릭터 노드 연결 (자동으로 캐릭터 이미지 참조)
 * - 오른쪽: 포즈 이미지 업로드
 * - 버튼 클릭 시 캐릭터를 새로운 포즈로 변경
 */

interface PoseChangeNodeData {
  apiKey?: string
  characterImage?: string // 연결된 캐릭터 이미지
}

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number; category?: string }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

export function PoseChangeNode({ data, selected, id }: NodeProps<PoseChangeNodeData>) {
  const { setNodes, getNodes } = useReactFlow()
  const edges = useStore((state) => state.edges) || []
  const nodes = useStore((state) => state.getNodes()) || []

  const poseInputRef = useRef<HTMLInputElement>(null)

  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [connectedCharacter, setConnectedCharacter] = useState<string | null>(data.characterImage || null)
  const [poseImage, setPoseImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // API 키 저장
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, apiKey } } : n))
    )
  }, [apiKey, id, setNodes])

  // 연결된 캐릭터 노드에서 이미지 가져오기
  useEffect(() => {
    if (!Array.isArray(edges) || !Array.isArray(nodes)) return

    // 이 노드의 왼쪽 핸들에 연결된 엣지 찾기
    const incomingEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === 'character-in'
    )

    if (incomingEdge) {
      const sourceNode = nodes.find((n) => n.id === incomingEdge.source)
      if (sourceNode) {
        // 이미지 노드나 다른 노드에서 이미지 URL 가져오기
        const imageUrl = sourceNode.data?.imageUrl ||
                        sourceNode.data?.url ||
                        sourceNode.data?.resultImage ||
                        sourceNode.data?.generatedImage
        if (imageUrl) {
          setConnectedCharacter(imageUrl)
          // 노드 데이터에도 저장
          setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, characterImage: imageUrl } } : n))
          )
        }
      }
    } else {
      setConnectedCharacter(null)
    }
  }, [edges, nodes, id, setNodes])

  // 포즈 이미지 업로드
  const handlePoseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setPoseImage(dataUrl)
      setResultImage(null)
      setStatusText('')
      setProgress(0)
    }
    reader.readAsDataURL(file)
  }

  // 드래그 앤 드롭 처리
  const handleDrop = (e: React.DragEvent, target: 'pose' | 'character') => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (target === 'pose') {
          setPoseImage(dataUrl)
        } else {
          setConnectedCharacter(dataUrl)
        }
        setResultImage(null)
        setStatusText('')
        setProgress(0)
      }
      reader.readAsDataURL(file)
    }
  }

  // 포즈 변경 처리
  const handleProcess = async () => {
    if (!apiKey) {
      setStatusText('⚠️ API 키를 입력하세요')
      return
    }
    if (!connectedCharacter) {
      setStatusText('⚠️ 캐릭터 이미지를 연결하거나 업로드하세요')
      return
    }
    if (!poseImage) {
      setStatusText('⚠️ 포즈 이미지를 업로드하세요')
      return
    }

    setIsProcessing(true)
    setResultImage(null)
    setProgress(0)
    setStatusText('🎭 포즈 변경 중...')

    try {
      // base64 추출
      const characterBase64 = connectedCharacter.split(',')[1]
      const poseBase64 = poseImage.split(',')[1]
      const model = MODELS[0].id // 나노바나나 3 Pro

      setProgress(20)
      setStatusText('🔄 캐릭터와 포즈 분석 중...')

      // 포즈 변경 요청 (두 이미지를 조합)
      // Gemini API에 두 이미지를 함께 보내서 캐릭터의 포즈를 변경
      const result = await editImage(
        apiKey,
        characterBase64,
        `Look at the second reference image showing a pose. Redraw the character from the first image in that exact pose from the reference. Keep the character's appearance, clothing, and style exactly the same. Only change the pose to match the reference pose image. Maintain the same art style and quality.`,
        model,
        undefined,
        poseBase64 // 포즈 참조 이미지
      )

      setProgress(90)
      setStatusText('✨ 결과 생성 중...')

      setResultImage(result.url)
      setProgress(100)
      setStatusText('✅ 포즈 변경 완료!')

      // 어셋에 추가
      emitAssetAdd({
        url: result.url,
        prompt: '포즈 변경',
        timestamp: Date.now(),
        category: 'character',
      })
    } catch (err) {
      console.error('포즈 변경 오류:', err)
      setStatusText(`❌ ${err instanceof Error ? err.message : '처리 실패'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className={`pose-change-node ${selected ? 'selected' : ''}`}
      style={{
        background: '#1a1a2e',
        borderRadius: 12,
        border: selected ? '2px solid #f59e0b' : '2px solid #333',
        width: '100%',
        height: '100%',
        minHeight: 500,
        color: 'white',
        position: 'relative',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={400} minHeight={500} />

      {/* 헤더 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          padding: '12px 16px',
          borderRadius: '10px 10px 0 0',
          fontWeight: 'bold',
          fontSize: 14,
        }}
      >
        🎭 포즈 변경
      </div>

      <div className="nodrag" style={{ padding: 16 }} onMouseDown={(e) => e.stopPropagation()}>
        {/* API 키 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 4 }}>
            Gemini API Key
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API 키 입력"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#2a2a3e',
                color: 'white',
                fontSize: 12,
              }}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#444',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* 2열 레이아웃: 캐릭터 | 포즈 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {/* 왼쪽: 캐릭터 이미지 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 6, fontWeight: 'bold' }}>
              👤 캐릭터 (연결 또는 업로드)
            </div>
            <div
              onDrop={(e) => handleDrop(e, 'character')}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => {
                if (!connectedCharacter) {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        setConnectedCharacter(ev.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }
                  input.click()
                }
              }}
              style={{
                border: '2px dashed #f59e0b',
                borderRadius: 8,
                padding: 12,
                textAlign: 'center',
                cursor: 'pointer',
                background: connectedCharacter ? 'transparent' : '#2a2a3e',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {connectedCharacter ? (
                <img
                  src={connectedCharacter}
                  alt="character"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 100,
                    borderRadius: 6,
                  }}
                />
              ) : (
                <div style={{ fontSize: 11, color: '#888' }}>
                  노드 연결 또는<br/>클릭하여 업로드
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 포즈 이미지 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#10b981', marginBottom: 6, fontWeight: 'bold' }}>
              🕺 포즈 참조
            </div>
            <div
              onClick={() => poseInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, 'pose')}
              onDragOver={(e) => e.preventDefault()}
              style={{
                border: '2px dashed #10b981',
                borderRadius: 8,
                padding: 12,
                textAlign: 'center',
                cursor: 'pointer',
                background: poseImage ? 'transparent' : '#2a2a3e',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {poseImage ? (
                <img
                  src={poseImage}
                  alt="pose"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 100,
                    borderRadius: 6,
                  }}
                />
              ) : (
                <div style={{ fontSize: 11, color: '#888' }}>
                  클릭하거나<br/>드래그하여 업로드
                </div>
              )}
              <input
                ref={poseInputRef}
                type="file"
                accept="image/*"
                onChange={handlePoseUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* 처리 버튼 */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || !apiKey || !connectedCharacter || !poseImage}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: 'none',
            background: isProcessing
              ? '#555'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: isProcessing ? 'wait' : 'pointer',
            marginBottom: 12,
          }}
        >
          {isProcessing ? '⏳ 처리 중...' : '🎭 포즈 변경 실행'}
        </button>

        {/* 로딩 프로그레스바 */}
        {isProcessing && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#aaa',
              marginBottom: 6,
            }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#2a2a3e',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #10b981 100%)',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* 완료/에러 상태 */}
        {!isProcessing && statusText && (
          <div
            style={{
              padding: '8px 12px',
              background: statusText.includes('✅') ? '#1a3d1a' : statusText.includes('❌') ? '#3d1a1a' : '#2a2a3e',
              borderRadius: 6,
              fontSize: 12,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {statusText}
          </div>
        )}

        {/* 결과 이미지 */}
        {resultImage && (
          <div>
            <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 4, fontWeight: 'bold' }}>
              ✨ 결과
            </div>
            <img
              src={resultImage}
              alt="Result"
              style={{
                width: '100%',
                borderRadius: 8,
                background: '#2a2a3e',
              }}
            />
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = resultImage
                link.download = `pose-changed-${Date.now()}.png`
                link.click()
              }}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: '#f59e0b',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ⬇️ PNG 다운로드
            </button>
          </div>
        )}
      </div>

      {/* 핸들 - 캐릭터 입력 (왼쪽) */}
      <Handle
        type="target"
        position={Position.Left}
        id="character-in"
        style={{
          background: '#f59e0b',
          width: 12,
          height: 12,
        }}
      />
      {/* 핸들 - 결과 출력 (오른쪽) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          background: '#10b981',
          width: 12,
          height: 12,
        }}
      />
    </div>
  )
}
