import { useState, useEffect, useRef, useMemo } from 'react'
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
  const { setNodes, setEdges, getNodes } = useReactFlow()
  const edges = useStore((state) => state.edges) || []

  const poseInputRef = useRef<HTMLInputElement>(null)
  const characterInputRef = useRef<HTMLInputElement>(null)

  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  // 노드 연결 이미지와 업로드 이미지를 분리
  const [connectedImage, setConnectedImage] = useState<string | null>(null)
  const [uploadedCharacter, setUploadedCharacter] = useState<string | null>(null)
  // 포즈 이미지도 노드 연결과 업로드 분리
  const [connectedPose, setConnectedPose] = useState<string | null>(null)
  const [uploadedPose, setUploadedPose] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // 옵션 상태
  const [generateTransparent, setGenerateTransparent] = useState(true)
  const [resolution, setResolution] = useState<ImageSize>('2K')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')

  // 실제 사용할 캐릭터 이미지 (업로드 우선, 없으면 노드 연결)
  const characterImage = uploadedCharacter || connectedImage
  // 실제 사용할 포즈 이미지 (업로드 우선, 없으면 노드 연결)
  const poseImage = uploadedPose || connectedPose

  // API 키 저장
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, apiKey } } : n))
    )
  }, [apiKey, id, setNodes])

  // 연결된 캐릭터 엣지 ID 추적 (안정적인 의존성)
  const connectedCharacterEdgeId = useMemo(() => {
    if (!Array.isArray(edges)) return null
    const edge = edges.find((e) => e.target === id && e.targetHandle === 'character-in')
    return edge?.source || null
  }, [edges, id])

  // 연결된 포즈 엣지 ID 추적 (안정적인 의존성)
  const connectedPoseEdgeId = useMemo(() => {
    if (!Array.isArray(edges)) return null
    const edge = edges.find((e) => e.target === id && e.targetHandle === 'pose-in')
    return edge?.source || null
  }, [edges, id])

  // 연결된 캐릭터 노드에서 이미지 가져오기
  useEffect(() => {
    if (!connectedCharacterEdgeId) {
      setConnectedImage(null)
      return
    }

    const nodes = getNodes()
    const sourceNode = nodes.find((n) => n.id === connectedCharacterEdgeId)
    if (sourceNode) {
      const imageUrl = sourceNode.data?.imageUrl ||
                      sourceNode.data?.url ||
                      sourceNode.data?.resultImage ||
                      sourceNode.data?.generatedImage
      if (imageUrl) {
        setConnectedImage(imageUrl)
        setUploadedCharacter(null)
      }
    }
  }, [connectedCharacterEdgeId, getNodes])

  // 연결된 포즈 노드에서 이미지 가져오기
  useEffect(() => {
    if (!connectedPoseEdgeId) {
      setConnectedPose(null)
      return
    }

    const nodes = getNodes()
    const sourceNode = nodes.find((n) => n.id === connectedPoseEdgeId)
    if (sourceNode) {
      const imageUrl = sourceNode.data?.imageUrl ||
                      sourceNode.data?.url ||
                      sourceNode.data?.resultImage ||
                      sourceNode.data?.generatedImage
      if (imageUrl) {
        setConnectedPose(imageUrl)
        setUploadedPose(null)
      }
    }
  }, [connectedPoseEdgeId, getNodes])

  // 캐릭터 업로드 시 노드 연결 끊기
  const handleCharacterUpload = (imageUrl: string) => {
    setUploadedCharacter(imageUrl)
    // 노드 연결 끊기
    setEdges((eds) => eds.filter((e) => !(e.target === id && e.targetHandle === 'character-in')))
    setConnectedImage(null)
    setResultImage(null)
    setStatusText('')
    setProgress(0)
  }

  // 포즈 업로드 시 노드 연결 끊기
  const handlePoseUpload = (imageUrl: string) => {
    setUploadedPose(imageUrl)
    // 노드 연결 끊기
    setEdges((eds) => eds.filter((e) => !(e.target === id && e.targetHandle === 'pose-in')))
    setConnectedPose(null)
    setResultImage(null)
    setStatusText('')
    setProgress(0)
  }

  // 파일 입력에서 포즈 이미지 업로드
  const handlePoseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      handlePoseUpload(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  // 드래그 앤 드롭 처리 (파일 + 라이브러리 이미지)
  const handleDrop = (e: React.DragEvent, target: 'pose' | 'character') => {
    e.preventDefault()
    e.stopPropagation()

    // 라이브러리에서 드래그한 이미지 처리 (application/json 또는 text/plain)
    const jsonData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData)
        if (parsed.type === 'asset' && parsed.url) {
          if (target === 'pose') {
            // 포즈 드롭 시 노드 연결 끊기
            handlePoseUpload(parsed.url)
          } else {
            // 캐릭터 드롭 시 노드 연결 끊기
            handleCharacterUpload(parsed.url)
          }
          return
        }
      } catch (err) {
        // JSON 파싱 실패 시 파일로 처리
      }
    }

    // 파일 드래그앤드롭 처리
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (target === 'pose') {
          // 포즈 드롭 시 노드 연결 끊기
          handlePoseUpload(dataUrl)
        } else {
          // 캐릭터 드롭 시 노드 연결 끊기
          handleCharacterUpload(dataUrl)
        }
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
    if (!characterImage) {
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
      const characterBase64 = characterImage.split(',')[1]
      const poseBase64 = poseImage.split(',')[1]
      const model = MODELS[0].id

      setProgress(10)
      setStatusText('🔄 캐릭터와 포즈 분석 중...')

      // 배경 지시
      const bgInstruction = generateTransparent
        ? 'Use a pure solid white background (#FFFFFF).'
        : ''

      // 포즈 변경 요청 (옵션 전달)
      const result = await editImage(
        apiKey,
        characterBase64,
        `Keep the character's appearance, clothing, and style from the first image. Change the pose to match the second image. Also match the camera angle from the second image. ${bgInstruction}`,
        model,
        'image/png',
        poseBase64,
        { aspectRatio, imageSize: resolution }
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
          model,
          'image/png',
          undefined,
          { aspectRatio, imageSize: resolution }
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
        minHeight: 600,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={420} minHeight={600} />

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
        {/* 옵션 패널 (항상 표시) */}
        <div style={{
          background: '#2a2a3e',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          border: '1px solid #444',
        }}>
          {/* 투명 배경 옵션 */}
          <div style={{ marginBottom: 10 }}>
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
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              📐 해상도
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {RESOLUTION_OPTIONS.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setResolution(res.id as ImageSize)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: resolution === res.id ? '#f59e0b' : '#3f3f46',
                    color: resolution === res.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
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
            <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
              📏 종횡비
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {ASPECT_RATIO_OPTIONS.map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id as AspectRatio)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: aspectRatio === ar.id ? '#f59e0b' : '#3f3f46',
                    color: aspectRatio === ar.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: aspectRatio === ar.id ? 'bold' : 'normal',
                  }}
                >
                  {ar.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* API 키 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 4 }}>
            Gemini API Key
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API 키 입력"
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#2a2a3e',
                color: 'white',
                fontSize: 11,
              }}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: '#444',
                color: 'white',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* 2열 레이아웃: 캐릭터 | 포즈 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {/* 왼쪽: 캐릭터 이미지 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>👤 캐릭터 {connectedImage ? '(노드 연결)' : uploadedCharacter ? '(업로드)' : ''}</span>
              {characterImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // 업로드 이미지 삭제
                    setUploadedCharacter(null)
                    // 노드 연결도 끊기
                    setEdges((eds) => eds.filter((edge) => !(edge.target === id && edge.targetHandle === 'character-in')))
                    setConnectedImage(null)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '2px 4px',
                  }}
                  title="이미지 삭제"
                >
                  ✕
                </button>
              )}
            </div>
            <div
              onDrop={(e) => handleDrop(e, 'character')}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      // 업로드 시 노드 연결 끊기
                      handleCharacterUpload(ev.target?.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }
                input.click()
              }}
              style={{
                border: `2px dashed ${connectedImage ? '#10b981' : '#f59e0b'}`,
                borderRadius: 6,
                padding: 6,
                textAlign: 'center',
                cursor: 'pointer',
                background: characterImage ? 'transparent' : '#2a2a3e',
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {characterImage ? (
                <img
                  src={characterImage}
                  alt="character"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 70,
                    borderRadius: 4,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ fontSize: 10, color: '#888' }}>
                  클릭/드롭하여 업로드
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 포즈 이미지 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#10b981', marginBottom: 4, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🕺 포즈 참조 {connectedPose ? '(노드 연결)' : uploadedPose ? '(업로드)' : ''}</span>
              {poseImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // 업로드 이미지 삭제
                    setUploadedPose(null)
                    // 노드 연결도 끊기
                    setEdges((eds) => eds.filter((edge) => !(edge.target === id && edge.targetHandle === 'pose-in')))
                    setConnectedPose(null)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '2px 4px',
                  }}
                  title="이미지 삭제"
                >
                  ✕
                </button>
              )}
            </div>
            <div
              onClick={() => poseInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, 'pose')}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              style={{
                border: `2px dashed ${connectedPose ? '#10b981' : '#10b981'}`,
                borderRadius: 6,
                padding: 6,
                textAlign: 'center',
                cursor: 'pointer',
                background: poseImage ? 'transparent' : '#2a2a3e',
                minHeight: 80,
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
                    maxHeight: 70,
                    borderRadius: 4,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ fontSize: 10, color: '#888' }}>
                  클릭/드롭하여 업로드
                </div>
              )}
              <input
                ref={poseInputRef}
                type="file"
                accept="image/*"
                onChange={handlePoseFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* 처리 버튼 */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || !apiKey || !characterImage || !poseImage}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 6,
            border: 'none',
            background: isProcessing
              ? '#555'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: isProcessing ? 'wait' : 'pointer',
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {isProcessing ? '⏳ 처리 중...' : '🎭 포즈 변경 실행'}
        </button>

        {/* 로딩 프로그레스바 */}
        {isProcessing && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: '#aaa',
              marginBottom: 4,
            }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: '#2a2a3e',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #10b981 100%)',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* 완료/에러 상태 */}
        {!isProcessing && statusText && (
          <div
            style={{
              padding: '6px 10px',
              background: statusText.includes('✅') ? '#1a3d1a' : statusText.includes('❌') ? '#3d1a1a' : '#2a2a3e',
              borderRadius: 4,
              fontSize: 11,
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            {statusText}
          </div>
        )}

        {/* 결과 이미지 */}
        {resultImage && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, fontWeight: 'bold' }}>
              ✨ 결과
            </div>
            <div style={{
              background: generateTransparent
                ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px'
                : '#2a2a3e',
              borderRadius: 6,
              padding: 4,
              overflow: 'hidden',
            }}>
              <img
                src={resultImage}
                alt="Result"
                style={{
                  width: '100%',
                  maxHeight: 180,
                  objectFit: 'contain',
                  borderRadius: 4,
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
                marginTop: 6,
                padding: '6px 10px',
                borderRadius: 4,
                border: 'none',
                background: '#f59e0b',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              ⬇️ PNG 다운로드
            </button>
          </div>
        )}
      </div>

      {/* 핸들 - 캐릭터 입력 (왼쪽 상단) */}
      <Handle
        type="target"
        position={Position.Left}
        id="character-in"
        style={{
          top: '30%',
          background: '#f59e0b',
          width: 12,
          height: 12,
        }}
      />
      {/* 핸들 - 포즈 입력 (왼쪽 하단) */}
      <Handle
        type="target"
        position={Position.Left}
        id="pose-in"
        style={{
          top: '60%',
          background: '#10b981',
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
