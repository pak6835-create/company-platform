import { useState, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { editImage, extractAlpha, loadImageData, imageDataToUrl, MODELS } from '../utils/geminiApi'

/**
 * 이미지 배경 투명화 노드
 *
 * 기술 원리 (Medium 기사 기반):
 * 1단계: 이미지를 흰색(#FFFFFF) 배경으로 변환
 * 2단계: 같은 이미지를 검정(#000000) 배경으로 변환 (순차 처리로 캐릭터 일관성 유지)
 * 3단계: 두 이미지 픽셀 비교로 알파 채널 추출 (차이 매트 방식)
 *
 * 알파 계산 공식:
 * - 완전 불투명 픽셀: 흰배경/검정배경에서 동일하게 보임 (거리 = 0)
 * - 완전 투명 픽셀: 배경색과 동일하게 보임 (거리 = 최대)
 * - alpha = 1 - (pixelDist / bgDist)
 */

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
  const [transparentImage, setTransparentImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0) // 0~100 진행률

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
      setTransparentImage(null)
      setStatusText('')
      setProgress(0)
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
        setTransparentImage(null)
        setStatusText('')
        setProgress(0)
      }
      reader.readAsDataURL(file)
    }
  }

  /**
   * 이미지 크기 구하기
   */
  const getImageSize = (imageUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = () => reject(new Error('이미지 크기 확인 실패'))
      img.src = imageUrl
    })
  }

  /**
   * 투명 배경 처리 (차이 매트 방식)
   * 1. 흰배경으로 변환
   * 2. 같은 크기로 검정배경 변환
   * 3. 알파 추출
   */
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
    setTransparentImage(null)
    setProgress(0)
    setStatusText('🎭 배경 투명화 처리 중...')

    try {
      // base64 추출
      const base64Data = uploadedImage.split(',')[1]
      const mimeType = uploadedImage.split(';')[0].split(':')[1]
      const model = MODELS[0].id // 나노바나나 3 Pro

      // 1단계: 흰배경으로 변환
      setProgress(10)
      const whiteResult = await editImage(
        apiKey,
        base64Data,
        'Change ONLY the background color to pure solid white #FFFFFF. Do NOT modify, redraw, or change the subject in any way. Keep the exact same subject, pose, and details. Only replace the background with white.',
        model,
        mimeType
      )
      setProgress(40)

      // 흰배경 이미지 크기 확인
      const whiteSize = await getImageSize(whiteResult.url)
      console.log(`[TransparentBgNode] 흰배경 이미지 크기: ${whiteSize.width}x${whiteSize.height}`)

      // 2단계: 검정배경으로 변환 (같은 크기 유지 요청)
      const blackResult = await editImage(
        apiKey,
        whiteResult.base64,
        `Change ONLY the background color from white to pure black #000000. Keep the exact same image size (${whiteSize.width}x${whiteSize.height}). Do NOT modify, redraw, or change the subject in any way. Keep the exact same subject, pose, and details. Only replace the white background with black.`,
        model
      )
      setProgress(75)

      // 3단계: 알파 추출 (차이 매트 알고리즘)
      const [whiteData, blackData] = await Promise.all([
        loadImageData(whiteResult.url),
        loadImageData(blackResult.url),
      ])

      // 크기 로그
      console.log(`[TransparentBgNode] 흰배경 로드: ${whiteData.width}x${whiteData.height}`)
      console.log(`[TransparentBgNode] 검정배경 로드: ${blackData.width}x${blackData.height}`)

      setProgress(90)
      const resultData = extractAlpha(whiteData, blackData)
      const transparentUrl = imageDataToUrl(resultData)

      setTransparentImage(transparentUrl)
      setProgress(100)
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
        width: '100%',
        height: '100%',
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
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #00d4ff 100%)',
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

        {/* 최종 결과만 표시 */}
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

      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  )
}
