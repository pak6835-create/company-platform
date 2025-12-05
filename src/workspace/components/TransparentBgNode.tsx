import { useState, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { editImage, extractAlpha, loadImageData, imageDataToUrl, MODELS } from '../utils/geminiApi'

// 기존 이미지를 투명 배경으로 변환하는 노드
// AI를 사용하여 흰배경/검정배경 버전을 생성하고 비교하여 알파 추출

interface TransparentBgNodeData {
  apiKey?: string
}

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

export function TransparentBgNode({ data, selected, id }: NodeProps<TransparentBgNodeData>) {
  const { setNodes } = useReactFlow()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [whiteImage, setWhiteImage] = useState<string | null>(null)
  const [blackImage, setBlackImage] = useState<string | null>(null)
  const [transparentImage, setTransparentImage] = useState<string | null>(null)

  // API 키 저장
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, apiKey } } : n))
    )
  }, [apiKey, id, setNodes])

  // 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedImage(dataUrl)
      setWhiteImage(null)
      setBlackImage(null)
      setTransparentImage(null)
      setStatusText('')
    }
    reader.readAsDataURL(file)
  }

  // 드래그 앤 드롭 처리
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setUploadedImage(dataUrl)
        setWhiteImage(null)
        setBlackImage(null)
        setTransparentImage(null)
        setStatusText('')
      }
      reader.readAsDataURL(file)
    }
  }

  // 투명 배경 처리 (순차 처리 방식 - 캐릭터 일관성 유지)
  const handleProcess = async () => {
    if (!apiKey) {
      setStatusText('⚠️ API 키를 입력하세요')
      return
    }
    if (!uploadedImage) {
      setStatusText('⚠️ 이미지를 업로드하세요')
      return
    }

    setIsProcessing(true)
    setStatusText('1/3 흰배경으로 변환 중...')
    setWhiteImage(null)
    setBlackImage(null)
    setTransparentImage(null)

    try {
      // base64 추출
      const base64Data = uploadedImage.split(',')[1]
      const mimeType = uploadedImage.split(';')[0].split(':')[1]
      const model = MODELS[0].id // 안정 모델 사용

      // 1단계: 흰배경으로 변환
      const whiteResult = await editImage(
        apiKey,
        base64Data,
        'Change ONLY the background color to pure solid white #FFFFFF. Do NOT modify, redraw, or change the subject in any way. Keep the exact same subject, pose, and details. Only replace the background with white.',
        model,
        mimeType
      )
      setWhiteImage(whiteResult.url)

      // 2단계: 검정배경으로 변환 (순차 처리로 캐릭터 일관성 유지)
      setStatusText('2/3 검정배경으로 변환 중...')
      const blackResult = await editImage(
        apiKey,
        whiteResult.base64,
        'Change ONLY the background color from white to pure black #000000. Do NOT modify, redraw, or change the subject in any way. Keep the exact same subject, pose, and details. Only replace the white background with black.',
        model
      )
      setBlackImage(blackResult.url)

      // 3단계: 알파 추출 (공통 유틸리티 사용)
      setStatusText('3/3 투명 배경 생성 중...')
      const [whiteData, blackData] = await Promise.all([
        loadImageData(whiteResult.url),
        loadImageData(blackResult.url),
      ])

      const resultData = extractAlpha(whiteData, blackData)
      const transparentUrl = imageDataToUrl(resultData)

      setTransparentImage(transparentUrl)
      setStatusText('✅ 완료!')

      // 어셋에 추가
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
        width: 380,
        minHeight: 450,
        color: 'white',
        position: 'relative',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={350} minHeight={400} />

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

        {/* 이미지 업로드 영역 */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: '2px dashed #444',
            borderRadius: 8,
            padding: 20,
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: 12,
            background: uploadedImage ? 'transparent' : '#2a2a3e',
          }}
        >
          {uploadedImage ? (
            <img
              src={uploadedImage}
              alt="uploaded"
              style={{
                maxWidth: '100%',
                maxHeight: 150,
                borderRadius: 6,
              }}
            />
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                클릭하거나 이미지를 드래그해서 업로드
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* 처리 버튼 */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || !apiKey || !uploadedImage}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: 'none',
            background: isProcessing
              ? '#555'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: isProcessing ? 'wait' : 'pointer',
            marginBottom: 12,
          }}
        >
          {isProcessing ? '⏳ 처리 중...' : '🎭 배경 투명화'}
        </button>

        {/* 상태 */}
        {statusText && (
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

        {/* 결과 이미지들 */}
        {(whiteImage || blackImage || transparentImage) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* 중간 과정 (작게) */}
            <div style={{ display: 'flex', gap: 8 }}>
              {whiteImage && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>흰배경</div>
                  <img
                    src={whiteImage}
                    alt="White BG"
                    style={{ width: '100%', borderRadius: 4, border: '1px solid #333' }}
                  />
                </div>
              )}
              {blackImage && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>검정배경</div>
                  <img
                    src={blackImage}
                    alt="Black BG"
                    style={{ width: '100%', borderRadius: 4, border: '1px solid #333' }}
                  />
                </div>
              )}
            </div>

            {/* 최종 결과 */}
            {transparentImage && (
              <div>
                <div style={{ fontSize: 12, color: '#00d4ff', marginBottom: 4, fontWeight: 'bold' }}>
                  ✨ 결과 (투명 배경)
                </div>
                <img
                  src={transparentImage}
                  alt="Transparent"
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px',
                  }}
                />
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = transparentImage
                    link.download = `transparent-${Date.now()}.png`
                    link.click()
                  }}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#00d4ff',
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
        )}
      </div>

      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  )
}
