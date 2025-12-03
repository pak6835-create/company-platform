import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import './WebtoonAI.css'

interface OutputType {
  key: string
  label: string
  highlight?: boolean
}

const outputTypes: OutputType[] = [
  { key: 'original', label: '원본' },
  { key: 'lineArt', label: '선화' },
  { key: 'flatColor', label: '밑색' },
  { key: 'materialId', label: '머티리얼ID' },
  { key: 'transparent', label: 'PNG', highlight: true },
]

function WebtoonAI() {
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [model, setModel] = useState('gemini-2.0-flash-exp')
  const [prompt, setPrompt] = useState('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ text: '', percent: 0 })
  const [error, setError] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const generateImage = async (promptText: string, inputImage: string | null = null): Promise<string> => {
    const response = await fetch('/api/gemini/v1beta/models/' + model + ':generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: inputImage ? [
            { text: promptText },
            { inline_data: { mime_type: 'image/png', data: inputImage.split(',')[1] } }
          ] : [
            { text: promptText }
          ]
        }],
        generationConfig: {
          responseModalities: ['image', 'text'],
          responseMimeType: 'image/png'
        }
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'API 오류 발생')
    }

    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData?.data
    )

    if (!imagePart) {
      throw new Error('이미지 생성 실패')
    }

    return 'data:image/png;base64,' + imagePart.inlineData.data
  }

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const getImageData = (img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  const extractAlpha = (whiteData: Uint8ClampedArray, blackData: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    const output = new Uint8ClampedArray(width * height * 4)

    for (let i = 0; i < width * height; i++) {
      const offset = i * 4
      const rW = whiteData[offset], gW = whiteData[offset+1], bW = whiteData[offset+2]
      const rB = blackData[offset], gB = blackData[offset+1], bB = blackData[offset+2]

      let alpha = ((1 - (rW - rB) / 255) + (1 - (gW - gB) / 255) + (1 - (bW - bB) / 255)) / 3
      alpha = Math.max(0, Math.min(1, alpha))

      let rOut = 0, gOut = 0, bOut = 0
      if (alpha > 0.01) {
        rOut = Math.min(255, rB / alpha)
        gOut = Math.min(255, gB / alpha)
        bOut = Math.min(255, bB / alpha)
      }

      output[offset] = Math.round(rOut)
      output[offset + 1] = Math.round(gOut)
      output[offset + 2] = Math.round(bOut)
      output[offset + 3] = Math.round(alpha * 255)
    }
    return output
  }

  const processTransparentPng = async (whiteSrc: string, blackSrc: string): Promise<string> => {
    const whiteImg = await loadImage(whiteSrc)
    const blackImg = await loadImage(blackSrc)
    const whiteData = getImageData(whiteImg)
    const blackData = getImageData(blackImg)
    const { width, height } = whiteImg

    const transparentData = extractAlpha(whiteData.data, blackData.data, width, height)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(new ImageData(transparentData, width, height), 0, 0)

    return canvas.toDataURL('image/png')
  }

  const handleGenerate = async () => {
    if (!apiKey) { setError('API 키를 입력해주세요.'); return }
    if (!apiKey.startsWith('AIza')) { setError('API 키 형식이 올바르지 않습니다.'); return }
    if (!prompt && !referenceImage) { setError('프롬프트를 입력하거나 참고 이미지를 업로드해주세요.'); return }

    setError('')
    setResults({})
    setIsGenerating(true)

    try {
      // 1. 원본
      setProgress({ text: '1/5 원본 이미지 생성 중...', percent: 10 })
      let originalPrompt = prompt
      if (referenceImage) {
        originalPrompt = prompt
          ? `Based on this reference image, create: ${prompt}. Keep the same style.`
          : `Recreate this image with high quality, keeping the same composition.`
      }
      const original = await generateImage(originalPrompt, referenceImage)
      setResults(prev => ({ ...prev, original }))

      // 2. 선화
      setProgress({ text: '2/5 선화 생성 중...', percent: 30 })
      const lineArt = await generateImage(
        `Convert this image to clean black line art on pure white background. Only black outlines, no fills, no shading, no colors. Clean manga/webtoon style linework.`,
        original
      )
      setResults(prev => ({ ...prev, lineArt }))

      // 3. 밑색
      setProgress({ text: '3/5 밑색 생성 중...', percent: 50 })
      const flatColor = await generateImage(
        `Convert this image to flat colors only. No shading, no gradients. Simple solid colors for each area. Webtoon flat coloring style.`,
        original
      )
      setResults(prev => ({ ...prev, flatColor }))

      // 4. 머티리얼 ID
      setProgress({ text: '4/5 머티리얼 ID 생성 중...', percent: 70 })
      const materialId = await generateImage(
        `Convert this image into a material ID map. Each different material should be a distinct solid color. Skin, Hair, Clothes each different colors. Use bright distinguishable colors.`,
        original
      )
      setResults(prev => ({ ...prev, materialId }))

      // 5. 투명 PNG
      setProgress({ text: '5/5 투명 PNG 생성 중 (흰 배경)...', percent: 85 })
      const whiteVersion = await generateImage(
        `Place this exact subject on a pure solid white (#FFFFFF) background. Keep the subject exactly the same.`,
        original
      )

      setProgress({ text: '5/5 투명 PNG 생성 중 (검정 배경)...', percent: 92 })
      const blackVersion = await generateImage(
        `Change the background to pure solid black (#000000). Keep the main subject exactly the same.`,
        whiteVersion
      )

      setProgress({ text: '5/5 알파 채널 추출 중...', percent: 98 })
      const transparent = await processTransparentPng(whiteVersion, blackVersion)
      setResults(prev => ({ ...prev, transparent }))

      setProgress({ text: '완료', percent: 100 })

    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.click()
  }

  const downloadAll = () => {
    const timestamp = Date.now()
    outputTypes.forEach((type, idx) => {
      if (results[type.key]) {
        setTimeout(() => downloadImage(results[type.key], `${type.key}_${timestamp}.png`), idx * 300)
      }
    })
  }

  const hasResults = Object.keys(results).length > 0

  return (
    <div className="webtoon-ai">
      <header className="tool-header">
        <p>WEBTOON AI</p>
        <h1>웹툰 에셋 생성기</h1>
        <span className="tool-description">원본 → 선화 → 밑색 → 머티리얼ID → 투명PNG 한번에 생성</span>
      </header>

      <div className="tool-grid">
        {/* 왼쪽: 설정 */}
        <div className="tool-panel">
          <div className="input-group">
            <label>Google AI API 키</label>
            <div className="input-row">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
              />
              <button className="btn-toggle" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? '숨김' : '보기'}
              </button>
            </div>
            <a className="link" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              API 키 발급받기 →
            </a>
          </div>

          <div className="input-group">
            <label>모델</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (무료)</option>
              <option value="imagen-3.0-generate-002">Imagen 3.0 (유료)</option>
            </select>
          </div>

          <div className="input-group">
            <label>프롬프트</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="생성할 이미지 설명...&#10;예: A cute anime girl character, full body"
            />
          </div>
        </div>

        {/* 오른쪽: 이미지 업로드 */}
        <div className="tool-panel">
          <label>참고 이미지 (선택사항)</label>
          {!referenceImage ? (
            <div
              className={`dropzone ${isDragging ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <p className="dropzone-text">드래그 또는 클릭하여 업로드</p>
              <span className="dropzone-hint">PNG, JPG, WEBP</span>
            </div>
          ) : (
            <div className="preview-container">
              <img src={referenceImage} alt="Preview" className="preview-img" />
              <button className="preview-remove" onClick={() => setReferenceImage(null)}>×</button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <p className="hint">참고 이미지 + 프롬프트로 새 이미지 생성</p>
        </div>
      </div>

      <button
        className="btn-generate"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        5가지 버전 생성하기
      </button>

      {/* 진행 상태 */}
      {isGenerating && (
        <div className="progress-bar">
          <div className="progress-header">
            <span>{progress.text}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && <div className="error-message">{error}</div>}

      {/* 결과 */}
      {hasResults && (
        <div className="tool-panel results-panel">
          <div className="results-header">
            <h3>생성 완료</h3>
            <button className="btn-download-all" onClick={downloadAll}>전체 다운로드</button>
          </div>
          <div className="results-grid">
            {outputTypes.map(type => (
              <div key={type.key} className={`result-card ${type.highlight ? 'highlight' : ''}`}>
                <div className="result-header">
                  <span>{type.label}</span>
                </div>
                <div className={`result-image ${type.key === 'transparent' ? 'transparent-bg' : ''}`}>
                  {results[type.key] ? (
                    <img src={results[type.key]} alt={type.label} />
                  ) : (
                    <span className="loading">생성 중...</span>
                  )}
                </div>
                <button
                  className="result-btn"
                  disabled={!results[type.key]}
                  onClick={() => results[type.key] && downloadImage(results[type.key], `${type.key}_${Date.now()}.png`)}
                >
                  다운로드
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 가이드 */}
      {!hasResults && (
        <div className="tool-panel guide-panel">
          <h3>OUTPUT</h3>
          <h4>출력물 설명</h4>
          <div className="guide-grid">
            <div className="guide-item"><strong>원본</strong><p>프롬프트 기반 생성</p></div>
            <div className="guide-item"><strong>선화</strong><p>깔끔한 라인아트</p></div>
            <div className="guide-item"><strong>밑색</strong><p>플랫 컬러</p></div>
            <div className="guide-item"><strong>머티리얼ID</strong><p>영역별 컬러맵</p></div>
            <div className="guide-item highlight"><strong>투명PNG</strong><p>알파 채널 포함</p></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebtoonAI
