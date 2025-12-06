import { useState, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { editImage, extractAlpha, loadImageData, imageDataToUrl, MODELS, AspectRatio, ImageSize } from '../utils/geminiApi'

/**
 * 이미지 배경 투명화 노드
 *
 * 기술 원리 (Medium 기사 기반):
 * 1단계: 이미지를 흰색(#FFFFFF) 배경으로 변환
 * 2단계: 같은 이미지를 검정(#000000) 배경으로 변환 (순차 처리로 캐릭터 일관성 유지)
 * 3단계: 두 이미지 픽셀 비교로 알파 채널 추출 (차이 매트 방식)
 */

interface TransparentBgNodeData {
  apiKey?: string
  connectedImage?: string
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
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

export function TransparentBgNode({ data, selected, id }: NodeProps<TransparentBgNodeData>) {
  const { setNodes } = useReactFlow()
  const edges = useStore((state) => state.edges) || []
  const nodes = useStore((state) => state.getNodes()) || []
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [connectedImage, setConnectedImage] = useState<string | null>(data.connectedImage || null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [transparentImage, setTransparentImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // 옵션 상태
  const [resolution, setResolution] = useState<ImageSize>('2K')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')

  // API 키 저장
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, apiKey } } : n))
    )
  }, [apiKey, id, setNodes])

  // 연결된 이미지 노드에서 이미지 가져오기
  useEffect(() => {
    if (!Array.isArray(edges) || !Array.isArray(nodes)) return

    const incomingEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === 'image-in'
    )

    if (incomingEdge) {
      const sourceNode = nodes.find((n) => n.id === incomingEdge.source)
      if (sourceNode) {
        const imageUrl = sourceNode.data?.imageUrl ||
                        sourceNode.data?.url ||
                        sourceNode.data?.resultImage ||
                        sourceNode.data?.generatedImage
        if (imageUrl) {
          setConnectedImage(imageUrl)
          setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, connectedImage: imageUrl } } : n))
          )
        }
      }
    } else {
      setConnectedImage(null)
    }
  }, [edges, nodes, id, setNodes])

  // 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedImage(dataUrl)
      setTransparentImage(null)
      setStatusText('')
      setProgress(0)
    }
    reader.readAsDataURL(file)
  }

  // 드래그 앤 드롭 처리 (파일 + 라이브러리 이미지)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // 라이브러리에서 드래그한 이미지 처리 (application/json 또는 text/plain)
    const jsonData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData)
        if (parsed.type === 'asset' && parsed.url) {
          setUploadedImage(parsed.url)
          setTransparentImage(null)
          setStatusText('')
          setProgress(0)
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
        setUploadedImage(dataUrl)
        setTransparentImage(null)
        setStatusText('')
        setProgress(0)
      }
      reader.readAsDataURL(file)
    }
  }

  // 사용할 이미지 (연결된 이미지 우선, 없으면 업로드 이미지)
  const sourceImage = connectedImage || uploadedImage

  /**
   * 투명 배경 처리 (차이 매트 방식)
   */
  const handleProcess = async () => {
    if (!apiKey) {
      setStatusText('⚠️ API 키를 입력하세요')
      return
    }
    if (!sourceImage) {
      setStatusText('⚠️ 이미지를 연결하거나 업로드하세요')
      return
    }

    setIsProcessing(true)
    setTransparentImage(null)
    setProgress(0)
    setStatusText('🎭 배경 투명화 처리 중...')

    try {
      const base64Data = sourceImage.split(',')[1]
      const mimeType = sourceImage.split(';')[0].split(':')[1] || 'image/png'
      const model = MODELS[0].id

      // 1단계: 흰배경으로 변환
      setProgress(10)
      setStatusText('🔄 흰배경으로 변환 중...')
      const whiteResult = await editImage(
        apiKey,
        base64Data,
        'Change ONLY the background color to pure solid white #FFFFFF. Do NOT modify, redraw, or change the subject in any way. Keep the exact same subject, pose, and details. Only replace the background with white.',
        model,
        mimeType,
        undefined,
        { aspectRatio, imageSize: resolution }
      )
      setProgress(40)

      // 2단계: 검정배경으로 변환
      setStatusText('🔄 검정배경으로 변환 중...')
      const blackResult = await editImage(
        apiKey,
        whiteResult.base64,
        'Change ONLY the background color from white to pure black #000000. Do NOT modify, redraw, or change the subject in any way. Keep the exact same subject, pose, and details. Only replace the white background with black.',
        model,
        'image/png',
        undefined,
        { aspectRatio, imageSize: resolution }
      )
      setProgress(75)

      // 3단계: 알파 추출
      setStatusText('✨ 투명 배경 생성 중...')
      const [whiteData, blackData] = await Promise.all([
        loadImageData(whiteResult.url),
        loadImageData(blackResult.url),
      ])

      setProgress(90)
      const resultData = extractAlpha(whiteData, blackData)
      const transparentUrl = imageDataToUrl(resultData)

      setTransparentImage(transparentUrl)
      setProgress(100)
      setStatusText('✅ 완료!')

      emitAssetAdd({
        url: transparentUrl,
        prompt: '투명 배경 변환',
        timestamp: Date.now(),
      })
    } catch (err) {
      console.error('처리 오류:', err)
      setStatusText(`❌ ${err instanceof Error ? err.message : '처리 실패'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className={`transparent-bg-node ${selected ? 'selected' : ''}`}
      style={{
        background: '#1a1a2e',
        borderRadius: 12,
        border: selected ? '2px solid #00d4ff' : '2px solid #333',
        width: '100%',
        height: '100%',
        minHeight: 550,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={380} minHeight={550} />

      {/* 헤더 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '12px 16px',
          borderRadius: '10px 10px 0 0',
          fontWeight: 'bold',
          fontSize: 14,
        }}
      >
        🖼️ 이미지 배경 투명화
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
                    background: resolution === res.id ? '#667eea' : '#3f3f46',
                    color: resolution === res.id ? '#fff' : '#fff',
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
                    background: aspectRatio === ar.id ? '#667eea' : '#3f3f46',
                    color: aspectRatio === ar.id ? '#fff' : '#fff',
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

        {/* 이미지 입력 영역 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#667eea', marginBottom: 4, fontWeight: 'bold' }}>
            🖼️ 원본 이미지 {connectedImage ? '(노드 연결됨)' : '(연결 또는 업로드)'}
          </div>
          <div
            onClick={() => !connectedImage && fileInputRef.current?.click()}
            onDrop={handleDrop}
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
              border: `2px dashed ${connectedImage ? '#10b981' : '#667eea'}`,
              borderRadius: 6,
              padding: 12,
              textAlign: 'center',
              cursor: connectedImage ? 'default' : 'pointer',
              background: sourceImage ? 'transparent' : '#2a2a3e',
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {sourceImage ? (
              <img
                src={sourceImage}
                alt="source"
                style={{
                  maxWidth: '100%',
                  maxHeight: 100,
                  borderRadius: 4,
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div>
                <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                <div style={{ fontSize: 10, color: '#888' }}>
                  노드 연결 또는 클릭하여 업로드
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* 처리 버튼 */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || !apiKey || !sourceImage}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 6,
            border: 'none',
            background: isProcessing
              ? '#555'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: isProcessing ? 'wait' : 'pointer',
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {isProcessing ? '⏳ 처리 중...' : '🎭 배경 투명화'}
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
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #00d4ff 100%)',
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
        {transparentImage && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: '#00d4ff', marginBottom: 4, fontWeight: 'bold' }}>
              ✨ 결과 (투명 배경)
            </div>
            <div style={{
              background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px',
              borderRadius: 6,
              padding: 4,
              overflow: 'hidden',
            }}>
              <img
                src={transparentImage}
                alt="Transparent"
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
                link.href = transparentImage
                link.download = `transparent-${Date.now()}.png`
                link.click()
              }}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '6px 10px',
                borderRadius: 4,
                border: 'none',
                background: '#00d4ff',
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

      {/* 핸들 - 이미지 입력 (왼쪽) */}
      <Handle
        type="target"
        position={Position.Left}
        id="image-in"
        style={{
          background: '#667eea',
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
          background: '#00d4ff',
          width: 12,
          height: 12,
        }}
      />
    </div>
  )
}
