import { useState, useEffect, useRef } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'

// 기존 이미지를 투명 배경으로 변환하는 노드
// AI를 사용하여 흰배경/검정배경 버전을 생성하고 비교하여 알파 추출

interface TransparentBgNodeData {
  apiKey?: string
}

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

// 알파 추출 함수 (Medium 기사 방식)
const extractAlpha = (whiteImageData: ImageData, blackImageData: ImageData): ImageData => {
  const width = whiteImageData.width
  const height = whiteImageData.height
  const whitePixels = whiteImageData.data
  const blackPixels = blackImageData.data
  const result = new Uint8ClampedArray(whitePixels.length)

  const bgDist = Math.sqrt(3 * 255 * 255)

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4

    const rW = whitePixels[offset]
    const gW = whitePixels[offset + 1]
    const bW = whitePixels[offset + 2]

    const rB = blackPixels[offset]
    const gB = blackPixels[offset + 1]
    const bB = blackPixels[offset + 2]

    const pixelDist = Math.sqrt(
      Math.pow(rW - rB, 2) +
      Math.pow(gW - gB, 2) +
      Math.pow(bW - bB, 2)
    )

    let alpha = 1 - (pixelDist / bgDist)
    alpha = Math.max(0, Math.min(1, alpha))

    let rOut = 0, gOut = 0, bOut = 0
    if (alpha > 0.01) {
      rOut = rB / alpha
      gOut = gB / alpha
      bOut = bB / alpha
    }

    result[offset] = Math.round(Math.min(255, rOut))
    result[offset + 1] = Math.round(Math.min(255, gOut))
    result[offset + 2] = Math.round(Math.min(255, bOut))
    result[offset + 3] = Math.round(alpha * 255)
  }

  return new ImageData(result, width, height)
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

  // 투명 배경 처리
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
    setStatusText('1/2 흰배경 + 검정배경 변환 중...')
    setWhiteImage(null)
    setBlackImage(null)
    setTransparentImage(null)

    try {
      // base64 추출
      const base64Data = uploadedImage.split(',')[1]
      const mimeType = uploadedImage.split(';')[0].split(':')[1]

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`

      // 병렬로 흰배경/검정배경 변환
      const [whiteResponse, blackResponse] = await Promise.all([
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: 'Change the background to pure solid white #FFFFFF. Keep the subject exactly the same. Only change the background color to white.' }
              ]
            }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }),
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: 'Change the background to pure solid black #000000. Keep the subject exactly the same. Only change the background color to black.' }
              ]
            }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }),
      ])

      const [whiteResult, blackResult] = await Promise.all([
        whiteResponse.json(),
        blackResponse.json(),
      ])

      if (whiteResult.error) throw new Error(whiteResult.error.message)
      if (blackResult.error) throw new Error(blackResult.error.message)

      let whiteImageBase64: string | null = null
      let blackImageBase64: string | null = null

      for (const part of whiteResult.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          whiteImageBase64 = part.inlineData.data
          break
        }
      }
      for (const part of blackResult.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          blackImageBase64 = part.inlineData.data
          break
        }
      }

      if (!whiteImageBase64) throw new Error('흰배경 변환 실패')
      if (!blackImageBase64) throw new Error('검정배경 변환 실패')

      const whiteUrl = `data:image/png;base64,${whiteImageBase64}`
      const blackUrl = `data:image/png;base64,${blackImageBase64}`

      setWhiteImage(whiteUrl)
      setBlackImage(blackUrl)
      setStatusText('2/2 투명 배경 생성 중...')

      // 알파 추출
      const transparentUrl = await new Promise<string>((resolve, reject) => {
        const whiteImg = new Image()
        const blackImg = new Image()
        let loadedCount = 0

        const checkBothLoaded = () => {
          loadedCount++
          if (loadedCount === 2) {
            const canvas = document.createElement('canvas')
            canvas.width = whiteImg.width
            canvas.height = whiteImg.height
            const ctx = canvas.getContext('2d')!

            ctx.drawImage(whiteImg, 0, 0)
            const whiteData = ctx.getImageData(0, 0, canvas.width, canvas.height)

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(blackImg, 0, 0)
            const blackData = ctx.getImageData(0, 0, canvas.width, canvas.height)

            const resultData = extractAlpha(whiteData, blackData)
            ctx.putImageData(resultData, 0, 0)

            resolve(canvas.toDataURL('image/png'))
          }
        }

        whiteImg.onload = checkBothLoaded
        blackImg.onload = checkBothLoaded
        whiteImg.onerror = () => reject(new Error('이미지 로드 실패'))
        blackImg.onerror = () => reject(new Error('이미지 로드 실패'))

        whiteImg.src = whiteUrl
        blackImg.src = blackUrl
      })

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
        minWidth: 380,
        color: 'white',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={380} minHeight={450} />

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
