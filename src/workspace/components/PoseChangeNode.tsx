import { useState, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { editImage, MODELS, extractAlpha, loadImageData, imageDataToUrl, AspectRatio, ImageSize } from '../utils/geminiApi'

/**
 * 포즈 변경 노드
 *
 * 기능:
 * - 왼쪽 핸들: 캐릭터 노드 연결 (자동으로 캐릭터 이미지 참조)
 * - 오른쪽: 포즈 이미지 업로드
 * - 버튼 클릭 시 캐릭터를 새로운 포즈로 변경
 * - 투명 배경, 해상도, 종횡비 옵션
 */

interface PoseChangeNodeData {
  apiKey?: string
  characterImage?: string
}

// 해상도 옵션
const RESOLUTION_OPTIONS = [
  { id: '1K', name: '1K' },
  { id: '2K', name: '2K' },
  { id: '4K', name: '4K' },
]

// 종횡비 옵션
const ASPECT_RATIO_OPTIONS = [
  { id: '16:9', name: '16:9' },
  { id: '1:1', name: '1:1' },
  { id: '9:16', name: '9:16' },
]

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number; category?: string }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

export function PoseChangeNode({ data, selected, id }: NodeProps<PoseChangeNodeData>) {
  const { setNodes } = useReactFlow()
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

  // 옵션 상태
  const [generateTransparent, setGenerateTransparent] = useState(true)
  const [resolution, setResolution] = useState('2K')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [showOptions, setShowOptions] = useState(false)

  // API 키 저장
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, apiKey } } : n))
    )
  }, [apiKey, id, setNodes])

  // 연결된 캐릭터 노드에서 이미지 가져오기
  useEffect(() => {
    if (!Array.isArray(edges) || !Array.isArray(nodes)) return

    const incomingEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === 'character-in'
    )

    if (incomingEdge) {
      const sourceNode = nodes.find((n) => n.id === incomingEdge.source)
      if (sourceNode) {
        const imageUrl = sourceNode.data?.imageUrl ||
                        sourceNode.data?.url ||
                        sourceNode.data?.resultImage ||
                        sourceNode.data?.generatedImage
        if (imageUrl) {
          setConnectedCharacter(imageUrl)
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
      const characterBase64 = connectedCharacter.split(',')[1]
      const poseBase64 = poseImage.split(',')[1]
      const model = MODELS[0].id

      setProgress(10)
      setStatusText('🔄 캐릭터와 포즈 분석 중...')

      // 배경 색상 결정
      const bgColor = generateTransparent ? 'pure white #FFFFFF' : 'appropriate'
      const bgInstruction = generateTransparent
        ? 'Use a pure solid white background (#FFFFFF).'
        : ''

      // 포즈 변경 요청
      const result = await editImage(
        apiKey,
        characterBase64,
        `Look at the second reference image showing a pose. Redraw the character from the first image in that exact pose from the reference. Keep the character's appearance, clothing, and style exactly the same. Only change the pose to match the reference pose image. Maintain the same art style and quality. ${bgInstruction} Output aspect ratio: ${aspectRatio}. Output resolution: ${resolution}.`,
        model,
        undefined,
        poseBase64
      )

      let finalImage = result.url

      // 투명 배경 처리
      if (generateTransparent) {
        setProgress(50)
        setStatusText('🎭 검정 배경 변환 중...')

        // 검정 배경으로 변환
        const blackResult = await editImage(
          apiKey,
          result.base64,
          'Change ONLY the background color from white to pure black #000000. Do NOT modify the character at all. Keep everything else exactly the same.',
          model
        )

        setProgress(80)
        setStatusText('✨ 투명 배경 생성 중...')

        // 알파 추출
        const [whiteData, blackData] = await Promise.all([
          loadImageData(result.url),
          loadImageData(blackResult.url),
        ])

        const resultData = extractAlpha(whiteData, blackData)
        finalImage = imageDataToUrl(resultData)
      }

      setProgress(100)
      setResultImage(finalImage)
      setStatusText('✅ 포즈 변경 완료!')

      emitAssetAdd({
        url: finalImage,
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
        overflow: 'hidden',
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>🎭 포즈 변경</span>
        <button
          onClick={() => setShowOptions(!showOptions)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ⚙️ 옵션
        </button>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div
        className="nodrag"
        style={{
          padding: 16,
          height: 'calc(100% - 48px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 옵션 패널 */}
        {showOptions && (
          <div style={{
            background: '#2a2a3e',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            border: '1px solid #444',
          }}>
            {/* 투명 배경 옵션 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={generateTransparent}
                  onChange={(e) => setGenerateTransparent(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span>🎭 투명 배경으로 생성</span>
              </label>
              <p style={{ fontSize: 10, color: '#888', margin: '4px 0 0 24px' }}>
                {generateTransparent ? 'API 2회 호출' : 'API 1회 호출'}
              </p>
            </div>

            {/* 해상도 옵션 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 6 }}>
                📐 해상도
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {RESOLUTION_OPTIONS.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setResolution(res.id)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: resolution === res.id ? '#f59e0b' : '#3f3f46',
                      color: resolution === res.id ? '#000' : '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: resolution === res.id ? 'bold' : 'normal',
                    }}
                  >
                    {res.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 종횡비 옵션 */}
            <div>
              <label style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 6 }}>
                📏 종횡비
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {ASPECT_RATIO_OPTIONS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: aspectRatio === ar.id ? '#f59e0b' : '#3f3f46',
                      color: aspectRatio === ar.id ? '#000' : '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: aspectRatio === ar.id ? 'bold' : 'normal',
                    }}
                  >
                    {ar.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 6, fontWeight: 'bold' }}>
              👤 캐릭터
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
                padding: 8,
                textAlign: 'center',
                cursor: 'pointer',
                background: connectedCharacter ? 'transparent' : '#2a2a3e',
                minHeight: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {connectedCharacter ? (
                <img
                  src={connectedCharacter}
                  alt="character"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 90,
                    borderRadius: 6,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ fontSize: 10, color: '#888' }}>
                  연결 또는 업로드
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 포즈 이미지 */}
          <div style={{ flex: 1, minWidth: 0 }}>
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
                padding: 8,
                textAlign: 'center',
                cursor: 'pointer',
                background: poseImage ? 'transparent' : '#2a2a3e',
                minHeight: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {poseImage ? (
                <img
                  src={poseImage}
                  alt="pose"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 90,
                    borderRadius: 6,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ fontSize: 10, color: '#888' }}>
                  클릭하여 업로드
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
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 4, fontWeight: 'bold' }}>
              ✨ 결과
            </div>
            <div style={{
              background: generateTransparent
                ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px'
                : '#2a2a3e',
              borderRadius: 8,
              padding: 4,
              overflow: 'hidden',
            }}>
              <img
                src={resultImage}
                alt="Result"
                style={{
                  width: '100%',
                  maxHeight: 200,
                  objectFit: 'contain',
                  borderRadius: 6,
                  display: 'block',
                }}
              />
            </div>
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
