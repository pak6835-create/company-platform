import { useState, useEffect, useMemo } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow, useStore } from 'reactflow'
import { PostProcessNodeData, ProcessType } from '../types'

// 흰색 배경을 투명하게 변환하는 함수 (API 키 없을 때 사용)
const removeWhiteBackground = (imageData: ImageData, threshold: number = 240): ImageData => {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // 흰색에 가까운 픽셀을 투명하게
    if (r > threshold && g > threshold && b > threshold) {
      data[i + 3] = 0
    }
  }
  return imageData
}

// 원본(흰배경)과 변환된(검정배경) 이미지를 비교해서 배경만 투명하게
// 핵심: 원본에서 밝았고 + 변환 후 어두우면 = 배경 영역
const removeBackgroundByComparison = (
  originalData: ImageData,  // 흰 배경 원본
  blackBgData: ImageData,   // 검정 배경 변환본
  whiteThreshold: number = 200,  // 더 낮춰서 밝은 회색도 포함
  blackThreshold: number = 50    // 더 높여서 어두운 회색도 포함
): ImageData => {
  const width = originalData.width
  const height = originalData.height
  const origPixels = originalData.data
  const blackPixels = blackBgData.data

  // 1단계: 배경 마스크 생성 (1 = 배경, 0 = 캐릭터)
  const mask = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4

      const origR = origPixels[i]
      const origG = origPixels[i + 1]
      const origB = origPixels[i + 2]
      const origBrightness = (origR + origG + origB) / 3

      const blackR = blackPixels[i]
      const blackG = blackPixels[i + 1]
      const blackB = blackPixels[i + 2]
      const blackBrightness = (blackR + blackG + blackB) / 3

      // 원본에서 밝았고, 변환 후 어두워졌으면 = 배경
      // 밝기 차이도 고려 (배경은 큰 변화, 캐릭터는 작은 변화)
      const brightnessDiff = origBrightness - blackBrightness
      const isBackground =
        origBrightness > whiteThreshold &&
        blackBrightness < blackThreshold &&
        brightnessDiff > 100  // 밝기가 크게 변한 부분만

      mask[y * width + x] = isBackground ? 1 : 0
    }
  }

  // 2단계: 배경 마스크 확장 (Dilation) - 경계 잔여물 제거
  // 주변 픽셀 중 하나라도 배경이면 배경으로 처리
  const expandedMask = new Uint8Array(mask)
  const dilationRadius = 2  // 2픽셀 확장

  for (let y = dilationRadius; y < height - dilationRadius; y++) {
    for (let x = dilationRadius; x < width - dilationRadius; x++) {
      const idx = y * width + x
      if (mask[idx] === 0) {
        // 캐릭터 픽셀인데, 주변에 배경이 많으면 배경으로 처리
        let bgCount = 0
        let totalCount = 0

        for (let dy = -dilationRadius; dy <= dilationRadius; dy++) {
          for (let dx = -dilationRadius; dx <= dilationRadius; dx++) {
            const nIdx = (y + dy) * width + (x + dx)
            if (mask[nIdx] === 1) bgCount++
            totalCount++
          }
        }

        // 주변의 60% 이상이 배경이면 이 픽셀도 배경으로
        if (bgCount > totalCount * 0.6) {
          // 추가로 이 픽셀이 밝은 색인지 확인 (실제 캐릭터가 아닌 잔여물)
          const i = idx * 4
          const brightness = (origPixels[i] + origPixels[i + 1] + origPixels[i + 2]) / 3
          if (brightness > 180) {  // 밝은 픽셀만 확장 대상
            expandedMask[idx] = 1
          }
        }
      }
    }
  }

  // 3단계: 결과 이미지 생성
  const result = new Uint8ClampedArray(origPixels.length)

  for (let i = 0; i < origPixels.length; i += 4) {
    const maskIdx = i / 4

    if (expandedMask[maskIdx] === 1) {
      // 배경이므로 투명하게
      result[i] = 0
      result[i + 1] = 0
      result[i + 2] = 0
      result[i + 3] = 0
    } else {
      // 캐릭터 영역: 원본 색상 유지
      result[i] = origPixels[i]
      result[i + 1] = origPixels[i + 1]
      result[i + 2] = origPixels[i + 2]
      result[i + 3] = 255
    }
  }

  return new ImageData(result, width, height)
}

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

export function PostProcessNode({ data, selected, id }: NodeProps<PostProcessNodeData>) {
  const [processType, setProcessType] = useState<ProcessType>(data.processType || 'removeBackground')
  const [intensity, setIntensity] = useState(data.intensity || 0.8)
  const [inputImage, setInputImage] = useState<string | null>(null)
  const [outputImage, setOutputImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const { setNodes, getNodes, getEdges } = useReactFlow()

  // 연결 상태 변화 감지를 위한 트리거
  const storeEdges = useStore((s) => s.edges || [])
  const storeNodes = useStore((s) => s.nodes || [])

  // 연결된 데이터 가져오기 (useReactFlow 사용)
  const connectedData = useMemo(() => {
    const edges = getEdges()
    const nodes = getNodes()

    console.log('[PostProcess] 현재 노드 ID:', id)
    console.log('[PostProcess] getEdges() 결과:', edges.length, '개')
    console.log('[PostProcess] getNodes() 결과:', nodes.length, '개')

    const sourceEdge = edges.find((e) => e && e.target === id)
    if (!sourceEdge) {
      console.log('[PostProcess] 연결된 edge 없음')
      return null
    }
    console.log('[PostProcess] 찾은 edge:', sourceEdge.source, '->', sourceEdge.target)

    const sourceNode = nodes.find((n) => n && n.id === sourceEdge.source)
    if (!sourceNode) {
      console.log('[PostProcess] source 노드를 찾을 수 없음, 찾는 ID:', sourceEdge.source)
      console.log('[PostProcess] 사용 가능한 노드 ID들:', nodes.map(n => n.id))
      return null
    }
    console.log('[PostProcess] 연결된 노드:', sourceNode.type, 'data:', Object.keys(sourceNode.data || {}))

    // AI 생성기 노드에서 정보 가져오기
    if (sourceNode.type === 'aiGenerator') {
      const result = {
        image: sourceNode.data?.lastGeneratedImage || null,
        apiKey: sourceNode.data?.apiKey || null,
        model: sourceNode.data?.model || null,
      }
      console.log('[PostProcess] aiGenerator에서 가져온 데이터:', {
        hasImage: !!result.image,
        hasApiKey: !!result.apiKey,
        model: result.model
      })
      return result
    }
    // 이미지 노드에서 이미지 가져오기
    if (sourceNode.type === 'image') {
      return {
        image: sourceNode.data?.imageUrl || sourceNode.data?.image || null,
        apiKey: null,
        model: null,
      }
    }
    return null
  }, [storeEdges, storeNodes, id, getEdges, getNodes])

  // 연결된 이미지가 변경되면 자동으로 입력 이미지 설정
  useEffect(() => {
    if (connectedData?.image) {
      setInputImage(connectedData.image)
      setOutputImage(null)
      setStatusText('')
    }
  }, [connectedData?.image])

  // 후처리 타입별 색상
  const typeColors: Record<string, string> = {
    removeBackground: '#E91E63',
    extractLine: '#607D8B',
    upscale: '#2196F3',
    stylize: '#FF9800',
  }
  const themeColor = typeColors[processType] || '#E91E63'

  // 노드 데이터 업데이트
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, processType, intensity, outputImage } }
        }
        return n
      })
    )
  }, [processType, intensity, outputImage, id, setNodes])

  // 후처리 실행
  const handleProcess = async () => {
    if (!inputImage) {
      setStatusText('이미지가 없습니다')
      return
    }

    setIsProcessing(true)
    setStatusText('처리 중...')

    try {
      if (processType === 'removeBackground') {
        const apiKey = connectedData?.apiKey
        const model = connectedData?.model || 'gemini-2.5-flash-image'

        if (apiKey) {
          // Gemini API로 검은 배경 버전 생성
          setStatusText('AI로 배경 변환 중...')

          const base64Image = inputImage.replace(/^data:image\/\w+;base64,/, '')

          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
          const requestBody = {
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: base64Image
                  }
                },
                {
                  text: 'Change the background to solid black color. Keep the character exactly the same, only change the white background to pure black (#000000). Output the image.'
                }
              ]
            }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE']
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

          // 응답에서 이미지 추출
          let blackBgImage: string | null = null
          const parts = result.candidates?.[0]?.content?.parts || []
          for (const part of parts) {
            if (part.inlineData?.data) {
              blackBgImage = `data:image/png;base64,${part.inlineData.data}`
              break
            }
          }

          if (blackBgImage) {
            // 원본(흰배경)과 변환된(검정배경) 이미지를 비교해서 배경만 투명하게
            setStatusText('배경 비교 분석 중...')

            // 원본 이미지 로드
            const origImg = new Image()
            const blackImg = new Image()

            await new Promise<void>((resolve, reject) => {
              let loadedCount = 0
              const checkBothLoaded = () => {
                loadedCount++
                if (loadedCount === 2) {
                  // 두 이미지 모두 로드됨
                  const canvas = document.createElement('canvas')
                  canvas.width = origImg.width
                  canvas.height = origImg.height
                  const ctx = canvas.getContext('2d')
                  if (!ctx) {
                    reject(new Error('Canvas 생성 실패'))
                    return
                  }

                  // 원본 이미지 데이터 추출
                  ctx.drawImage(origImg, 0, 0)
                  const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height)

                  // 검정 배경 이미지 데이터 추출
                  ctx.clearRect(0, 0, canvas.width, canvas.height)
                  ctx.drawImage(blackImg, 0, 0, canvas.width, canvas.height)
                  const blackBgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

                  // 강도에 따른 임계값 조정
                  // intensity 높을수록: 더 공격적으로 배경 제거 (임계값 낮춤)
                  const whiteThreshold = Math.round(240 - intensity * 80)  // 160~240
                  const blackThreshold = Math.round(20 + intensity * 60)   // 20~80

                  // 비교해서 배경만 투명하게
                  const processed = removeBackgroundByComparison(
                    originalData,
                    blackBgData,
                    whiteThreshold,
                    blackThreshold
                  )
                  ctx.putImageData(processed, 0, 0)

                  setOutputImage(canvas.toDataURL('image/png'))
                  resolve()
                }
              }

              origImg.onload = checkBothLoaded
              blackImg.onload = checkBothLoaded
              origImg.onerror = () => reject(new Error('원본 이미지 로드 실패'))
              blackImg.onerror = () => reject(new Error('변환 이미지 로드 실패'))

              origImg.src = inputImage
              blackImg.src = blackBgImage!
            })
          } else {
            throw new Error('AI 응답에 이미지가 없습니다')
          }
        } else {
          // API 키 없으면 흰색 배경 직접 제거
          setStatusText('흰색 배경 제거 중...')
          const img = new Image()

          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')
              if (!ctx) {
                reject(new Error('Canvas 생성 실패'))
                return
              }

              ctx.drawImage(img, 0, 0)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

              const threshold = Math.round(200 + intensity * 55)
              const processed = removeWhiteBackground(imageData, threshold)
              ctx.putImageData(processed, 0, 0)

              setOutputImage(canvas.toDataURL('image/png'))
              resolve()
            }
            img.onerror = () => reject(new Error('이미지 로드 실패'))
            img.src = inputImage
          })
        }
      } else {
        // 다른 후처리는 미구현
        setStatusText('준비 중인 기능입니다')
        await new Promise(r => setTimeout(r, 500))
        setOutputImage(inputImage)
      }

      setStatusText('✅ 완료!')
    } catch (err) {
      console.error('후처리 오류:', err)
      setStatusText(`❌ ${err instanceof Error ? err.message : '처리 실패'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 캔버스에 이미지 추가
  const addToCanvas = () => {
    if (!outputImage) return

    const currentNodes = getNodes()
    const newId = `node-${Date.now()}`

    // 현재 노드 위치 기준으로 오른쪽에 배치
    const currentNode = currentNodes.find(n => n.id === id)
    const position = currentNode
      ? { x: currentNode.position.x + 300, y: currentNode.position.y }
      : { x: 100, y: 100 }

    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: 'image',
        position,
        data: { imageUrl: outputImage, label: '배경 제거됨' },
        style: { width: 200, height: 200 },
      },
    ])

    // 어셋 라이브러리에도 추가
    emitAssetAdd({
      url: outputImage,
      prompt: `${processType} 처리됨`,
      timestamp: Date.now(),
    })

    setStatusText('📌 캔버스에 추가됨!')
  }

  return (
    <div
      className={`postprocess-node ${selected ? 'selected' : ''}`}
      style={{ '--pp-color': themeColor } as React.CSSProperties}
    >
      <Handle type="target" position={Position.Left} id="pp-in" />
      <NodeResizer isVisible={selected} minWidth={300} minHeight={500} />

      <div className="pp-node-header" style={{ backgroundColor: themeColor }}>
        <span>✨ 후처리</span>
        {connectedData?.apiKey && <span className="pp-api-badge">AI</span>}
      </div>

      <div className="pp-node-content pp-scrollable nodrag" onMouseDown={(e) => e.stopPropagation()}>
        {/* 후처리 타입 선택 */}
        <div className="pp-type-selector">
          <label>후처리 타입</label>
          <select
            value={processType}
            onChange={(e) => setProcessType(e.target.value as ProcessType)}
            style={{ borderColor: themeColor }}
          >
            <option value="removeBackground">🔲 배경 제거</option>
            <option value="extractLine">✏️ 라인 추출 (준비중)</option>
            <option value="upscale">🔍 업스케일 (준비중)</option>
            <option value="stylize">✨ 스타일 변환 (준비중)</option>
          </select>
        </div>

        {/* 강도 슬라이더 */}
        <div className="pp-intensity">
          <div className="pp-intensity-label">
            <span>제거 강도</span>
            <span>{Math.round(intensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            style={{ accentColor: themeColor }}
          />
          <div className="pp-intensity-hint">
            {intensity < 0.7 ? '약하게 (일부만 제거)' : intensity < 0.9 ? '보통' : '강하게 (더 많이 제거)'}
          </div>
        </div>

        {/* 입력 이미지 */}
        {inputImage ? (
          <div className="pp-image-preview">
            <label>📥 입력</label>
            <img src={inputImage} alt="Input" />
          </div>
        ) : (
          <div className="pp-help">
            💡 캐릭터 메이커와 연결하세요
            <br />
            <small>노드를 선으로 연결하면 이미지가 자동으로 들어옵니다</small>
          </div>
        )}

        {/* 처리 버튼 */}
        <button
          className="pp-process-btn"
          onClick={handleProcess}
          disabled={!inputImage || isProcessing}
          style={{ backgroundColor: inputImage ? themeColor : '#ccc' }}
        >
          {isProcessing ? '⏳ 처리 중...' : '🔲 배경 제거 실행'}
        </button>

        {/* 상태 텍스트 */}
        {statusText && (
          <div className="pp-status">{statusText}</div>
        )}

        {/* 출력 이미지 */}
        {outputImage && (
          <div className="pp-image-preview output">
            <label>📤 결과 (투명 배경)</label>
            <img src={outputImage} alt="Output" style={{ background: 'repeating-conic-gradient(#ddd 0% 25%, white 0% 50%) 50% / 16px 16px' }} />
            <div className="pp-output-actions">
              <button
                className="pp-action-btn"
                onClick={addToCanvas}
              >
                📌 캔버스에 추가
              </button>
              <button
                className="pp-action-btn download"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = outputImage
                  link.download = `transparent-${Date.now()}.png`
                  link.click()
                }}
              >
                ⬇️ PNG 다운로드
              </button>
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="pp-out" />
    </div>
  )
}
