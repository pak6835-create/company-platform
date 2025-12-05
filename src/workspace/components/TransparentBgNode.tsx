import { useState, useEffect } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'

// Medium 기사 방식: 흰배경/검정배경 이미지를 한번에 생성하고 비교
// https://jidefr.medium.com/generating-transparent-background-images-with-nano-banana-pro-2-1866c88a33c5

interface TransparentBgNodeData {
  apiKey?: string
  prompt?: string
}

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

// 두 이미지를 비교해서 투명 배경 생성 (Medium 기사 방식)
const createTransparentImage = (
  whiteCanvas: HTMLCanvasElement,
  blackCanvas: HTMLCanvasElement
): string => {
  const width = whiteCanvas.width
  const height = blackCanvas.height

  const whiteCtx = whiteCanvas.getContext('2d')!
  const blackCtx = blackCanvas.getContext('2d')!

  const whiteData = whiteCtx.getImageData(0, 0, width, height)
  const blackData = blackCtx.getImageData(0, 0, width, height)

  const whitePixels = whiteData.data
  const blackPixels = blackData.data

  // 결과 캔버스
  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = width
  resultCanvas.height = height
  const resultCtx = resultCanvas.getContext('2d')!
  const resultData = resultCtx.createImageData(width, height)
  const resultPixels = resultData.data

  for (let i = 0; i < whitePixels.length; i += 4) {
    const wR = whitePixels[i]
    const wG = whitePixels[i + 1]
    const wB = whitePixels[i + 2]

    const bR = blackPixels[i]
    const bG = blackPixels[i + 1]
    const bB = blackPixels[i + 2]

    // 알파값 계산: 흰배경과 검정배경의 차이로 계산
    // 배경: 흰배경=255, 검정배경=0 -> 차이=255 -> alpha=0 (투명)
    // 캐릭터: 흰배경=색상, 검정배경=같은색상 -> 차이=0 -> alpha=255 (불투명)
    const diffR = wR - bR
    const diffG = wG - bG
    const diffB = wB - bB

    // 평균 차이로 알파 계산 (차이가 클수록 배경 = 투명)
    const avgDiff = (diffR + diffG + diffB) / 3
    const alpha = Math.round(255 - avgDiff)

    if (alpha < 10) {
      // 완전 투명 (배경)
      resultPixels[i] = 0
      resultPixels[i + 1] = 0
      resultPixels[i + 2] = 0
      resultPixels[i + 3] = 0
    } else if (alpha > 245) {
      // 완전 불투명 (캐릭터) - 검정배경 이미지의 색상 사용
      resultPixels[i] = bR
      resultPixels[i + 1] = bG
      resultPixels[i + 2] = bB
      resultPixels[i + 3] = 255
    } else {
      // 반투명 (경계) - 알파 블렌딩으로 원본 색상 복원
      // 흰배경 이미지: C = alpha * original + (1-alpha) * 255
      // 검정배경 이미지: C = alpha * original + (1-alpha) * 0 = alpha * original
      // 따라서: original = blackPixel / alpha (alpha > 0일 때)
      const a = alpha / 255
      if (a > 0.01) {
        resultPixels[i] = Math.min(255, Math.round(bR / a))
        resultPixels[i + 1] = Math.min(255, Math.round(bG / a))
        resultPixels[i + 2] = Math.min(255, Math.round(bB / a))
      } else {
        resultPixels[i] = bR
        resultPixels[i + 1] = bG
        resultPixels[i + 2] = bB
      }
      resultPixels[i + 3] = alpha
    }
  }

  resultCtx.putImageData(resultData, 0, 0)
  return resultCanvas.toDataURL('image/png')
}

export function TransparentBgNode({ data, selected, id }: NodeProps<TransparentBgNodeData>) {
  const { setNodes } = useReactFlow()

  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [prompt, setPrompt] = useState(data.prompt || 'a cute cartoon cat sitting, simple design')
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [whiteImage, setWhiteImage] = useState<string | null>(null)
  const [blackImage, setBlackImage] = useState<string | null>(null)
  const [transparentImage, setTransparentImage] = useState<string | null>(null)

  // API 키 저장
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, apiKey, prompt } } : n))
    )
  }, [apiKey, prompt, id, setNodes])

  // Medium 기사 방식: 한번에 두 이미지 생성
  const handleGenerate = async () => {
    if (!apiKey) {
      setStatusText('API 키를 입력하세요')
      return
    }

    setIsGenerating(true)
    setStatusText('이미지 생성 중... (2장)')
    setWhiteImage(null)
    setBlackImage(null)
    setTransparentImage(null)

    try {
      // 핵심: 한 번의 API 호출로 흰배경 + 검정배경 동시 요청
      const fullPrompt = `Generate two images side by side in a single image:
LEFT HALF: ${prompt}, on a pure white background (#FFFFFF)
RIGHT HALF: exactly the same image, but on a pure black background (#000000)

IMPORTANT:
- Both halves must show EXACTLY the same subject in the same pose and position
- The ONLY difference should be the background color
- Make sure the subject is centered in each half
- No border or separator between the halves`

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`
      const requestBody = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error.message)
      }

      // 이미지 추출
      let combinedImageUrl: string | null = null
      const parts = result.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (part.inlineData?.data) {
          combinedImageUrl = `data:image/png;base64,${part.inlineData.data}`
          break
        }
      }

      if (!combinedImageUrl) {
        throw new Error('이미지 생성 실패')
      }

      setStatusText('이미지 분리 중...')

      // 이미지 로드 후 좌우 분리
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const halfWidth = Math.floor(img.width / 2)
          const height = img.height

          // 왼쪽 절반 (흰배경)
          const whiteCanvas = document.createElement('canvas')
          whiteCanvas.width = halfWidth
          whiteCanvas.height = height
          const whiteCtx = whiteCanvas.getContext('2d')!
          whiteCtx.drawImage(img, 0, 0, halfWidth, height, 0, 0, halfWidth, height)

          // 오른쪽 절반 (검정배경)
          const blackCanvas = document.createElement('canvas')
          blackCanvas.width = halfWidth
          blackCanvas.height = height
          const blackCtx = blackCanvas.getContext('2d')!
          blackCtx.drawImage(img, halfWidth, 0, halfWidth, height, 0, 0, halfWidth, height)

          const whiteUrl = whiteCanvas.toDataURL('image/png')
          const blackUrl = blackCanvas.toDataURL('image/png')

          setWhiteImage(whiteUrl)
          setBlackImage(blackUrl)

          setStatusText('투명 배경 생성 중...')

          // 두 이미지 비교해서 투명 배경 생성
          const transparentUrl = createTransparentImage(whiteCanvas, blackCanvas)
          setTransparentImage(transparentUrl)

          // 어셋 라이브러리에 추가
          emitAssetAdd({
            url: transparentUrl,
            prompt: prompt,
            timestamp: Date.now(),
          })

          resolve()
        }
        img.onerror = () => reject(new Error('이미지 로드 실패'))
        img.src = combinedImageUrl!
      })

      setStatusText('✅ 완료!')
    } catch (err) {
      console.error('생성 오류:', err)
      setStatusText(`❌ ${err instanceof Error ? err.message : '생성 실패'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className={`transparent-bg-node ${selected ? 'selected' : ''}`}
      style={{
        background: '#1a1a2e',
        borderRadius: 12,
        border: selected ? '2px solid #00d4ff' : '2px solid #333',
        minWidth: 350,
        color: 'white',
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
        🎭 투명 배경 생성기 (Medium 방식)
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
              {showApiKey ? '숨김' : '보기'}
            </button>
          </div>
        </div>

        {/* 프롬프트 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#aaa', display: 'block', marginBottom: 4 }}>
            프롬프트 (배경 제외하고 주제만)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: a cute cartoon cat sitting"
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #444',
              background: '#2a2a3e',
              color: 'white',
              fontSize: 12,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: 'none',
            background: isGenerating
              ? '#555'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold',
            cursor: isGenerating ? 'wait' : 'pointer',
            marginBottom: 12,
          }}
        >
          {isGenerating ? '⏳ 생성 중...' : '🚀 투명 배경 이미지 생성'}
        </button>

        {/* 상태 */}
        {statusText && (
          <div
            style={{
              padding: '8px 12px',
              background: '#2a2a3e',
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

            {/* 최종 결과 (크게) */}
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
                    background:
                      'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = transparentImage
                      link.download = `transparent-${Date.now()}.png`
                      link.click()
                    }}
                    style={{
                      flex: 1,
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
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="out" />
    </div>
  )
}
