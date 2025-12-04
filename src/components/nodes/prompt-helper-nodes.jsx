import React, { useState, useCallback } from 'react';

// 노드별 옵션 데이터
const NODE_DATA = {
  style: {
    title: '🎨 스타일',
    icon: '🎨',
    options: [
      { id: 'webtoon', label: '웹툰', prompt: 'webtoon style, manhwa style, clean lines' },
      { id: 'anime', label: '애니메이션', prompt: 'anime style, japanese animation' },
      { id: 'watercolor', label: '수채화', prompt: 'watercolor painting style, soft edges' },
      { id: 'oil', label: '유화', prompt: 'oil painting style, textured brushstrokes' },
      { id: 'penink', label: '펜화', prompt: 'pen and ink drawing, line art style' },
      { id: 'pixel', label: '픽셀', prompt: 'pixel art style, 8-bit aesthetic' },
      { id: 'realistic', label: '사실적', prompt: 'realistic, photorealistic rendering' },
      { id: 'flat', label: '플랫', prompt: 'flat design, minimal shading, vector style' },
    ]
  },
  background: {
    title: '🏠 배경 타입',
    icon: '🏠',
    options: [
      { id: 'indoor', label: '실내', prompt: 'indoor scene, interior' },
      { id: 'outdoor', label: '실외', prompt: 'outdoor scene, exterior' },
      { id: 'city', label: '도시', prompt: 'urban cityscape, buildings, streets' },
      { id: 'nature', label: '자연', prompt: 'natural environment, trees, grass' },
      { id: 'fantasy', label: '판타지', prompt: 'fantasy setting, magical environment' },
      { id: 'scifi', label: 'SF', prompt: 'sci-fi setting, futuristic environment' },
      { id: 'school', label: '학교', prompt: 'school setting, classroom, hallway' },
      { id: 'cafe', label: '카페', prompt: 'cafe interior, coffee shop ambiance' },
    ]
  },
  time: {
    title: '🌅 시간대',
    icon: '🌅',
    options: [
      { id: 'day', label: '낮', prompt: 'daytime, bright daylight' },
      { id: 'night', label: '밤', prompt: 'nighttime, dark sky, moonlight' },
      { id: 'dawn', label: '새벽', prompt: 'dawn, early morning light, soft pink sky' },
      { id: 'sunset', label: '황혼', prompt: 'sunset, golden hour, orange sky' },
      { id: 'cloudy', label: '흐림', prompt: 'overcast sky, cloudy weather, diffused light' },
      { id: 'rain', label: '비', prompt: 'rainy weather, wet surfaces, rain drops' },
      { id: 'snow', label: '눈', prompt: 'snowy weather, snow falling, winter' },
      { id: 'fog', label: '안개', prompt: 'foggy atmosphere, misty, low visibility' },
    ]
  },
  camera: {
    title: '📷 카메라 앵글',
    icon: '📷',
    options: [
      { id: 'front', label: '정면', prompt: 'front view, straight-on angle' },
      { id: 'side', label: '측면', prompt: 'side view, profile angle' },
      { id: 'above', label: '위에서', prompt: 'high angle shot, birds eye view' },
      { id: 'below', label: '아래에서', prompt: 'low angle shot, looking up' },
      { id: 'wide', label: '광각', prompt: 'wide angle lens, panoramic view' },
      { id: 'closeup', label: '클로즈업', prompt: 'close-up shot, detailed view' },
      { id: 'dutch', label: '더치앵글', prompt: 'dutch angle, tilted camera' },
      { id: 'over', label: '오버숄더', prompt: 'over the shoulder shot' },
    ]
  },
  quality: {
    title: '✨ 품질',
    icon: '✨',
    options: [
      { id: 'highquality', label: '고품질', prompt: 'high quality, best quality' },
      { id: 'detailed', label: '디테일', prompt: 'highly detailed, intricate details' },
      { id: '4k', label: '4K', prompt: '4K resolution, ultra HD' },
      { id: 'simple', label: '심플', prompt: 'simple, minimal detail' },
      { id: 'sharp', label: '선명', prompt: 'sharp focus, crisp edges' },
      { id: 'soft', label: '부드러움', prompt: 'soft focus, gentle blur' },
      { id: 'dramatic', label: '드라마틱', prompt: 'dramatic lighting, high contrast' },
      { id: 'vibrant', label: '비비드', prompt: 'vibrant colors, saturated' },
    ]
  }
};

// 개별 토글 버튼 컴포넌트
const ToggleButton = ({ option, isActive, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(option.id)}
      style={{
        padding: '8px 16px',
        margin: '4px',
        borderRadius: '20px',
        border: isActive ? '2px solid #4A90D9' : '2px solid #ddd',
        backgroundColor: isActive ? '#E3F2FD' : '#fff',
        color: isActive ? '#1565C0' : '#666',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: isActive ? '600' : '400',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {isActive && <span>✓</span>}
      {option.label}
    </button>
  );
};

// 단일 노드 컴포넌트
const PromptNode = ({ nodeType, activeOptions, onToggle, onConnect, isConnected }) => {
  const nodeData = NODE_DATA[nodeType];
  
  if (!nodeData) return null;

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: isConnected 
        ? '0 4px 20px rgba(74, 144, 217, 0.3)' 
        : '0 2px 10px rgba(0,0,0,0.1)',
      border: isConnected ? '2px solid #4A90D9' : '2px solid #eee',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* 노드 헤더 */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: isConnected ? '#4A90D9' : '#f5f5f5',
        color: isConnected ? '#fff' : '#333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: '600', fontSize: '15px' }}>
          {nodeData.title}
        </span>
        <button
          onClick={() => onConnect(nodeType)}
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: isConnected ? '#fff' : '#4A90D9',
            color: isConnected ? '#4A90D9' : '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          {isConnected ? '연결됨' : '연결'}
        </button>
      </div>

      {/* 토글 버튼 영역 */}
      <div style={{
        padding: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
      }}>
        {nodeData.options.map(option => (
          <ToggleButton
            key={option.id}
            option={option}
            isActive={activeOptions.includes(option.id)}
            onToggle={(id) => onToggle(nodeType, id)}
          />
        ))}
      </div>

      {/* 선택된 항목 수 표시 */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#f9f9f9',
        fontSize: '12px',
        color: '#888',
        borderTop: '1px solid #eee',
      }}>
        {activeOptions.length}개 선택됨
      </div>
    </div>
  );
};

// 메인 노드 (프롬프트 입력 + 모델 선택 + 실행)
const MainNode = ({ userPrompt, setUserPrompt, selectedModel, setSelectedModel, onGenerate, isGenerating, combinedPrompt }) => {
  const models = [
    { id: 'gemini-2.0', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro' },
    { id: 'imagen-3', label: 'Imagen 3' },
  ];

  return (
    <div style={{
      width: '350px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      border: '3px solid #4A90D9',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#4A90D9',
        color: '#fff',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>🚀 AI 이미지 생성</h3>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 모델 선택 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '8px' }}>
            모델 선택
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              backgroundColor: '#fff',
            }}
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.label}</option>
            ))}
          </select>
        </div>

        {/* 프롬프트 입력 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '8px' }}>
            프롬프트 입력
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="생성하고 싶은 이미지를 설명하세요..."
            style={{
              width: '100%',
              height: '80px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 조합된 프롬프트 미리보기 */}
        {combinedPrompt && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f0f7ff',
            borderRadius: '8px',
            border: '1px solid #d0e3ff',
          }}>
            <label style={{ fontSize: '12px', color: '#4A90D9', display: 'block', marginBottom: '4px' }}>
              📝 조합된 프롬프트
            </label>
            <p style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: '#333',
              lineHeight: '1.5',
              maxHeight: '60px',
              overflow: 'auto',
            }}>
              {combinedPrompt}
            </p>
          </div>
        )}

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onGenerate}
            disabled={isGenerating || !userPrompt.trim()}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isGenerating ? '#ccc' : '#4A90D9',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {isGenerating ? '⏳ 생성 중...' : '✨ 생성하기'}
          </button>
          <button
            disabled={!isGenerating}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              color: '#666',
              fontSize: '15px',
              cursor: isGenerating ? 'pointer' : 'not-allowed',
              opacity: isGenerating ? 1 : 0.5,
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

// 전체 시스템 컴포넌트
const PromptHelperSystem = () => {
  // 상태 관리
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 각 노드별 활성화된 옵션들
  const [activeOptions, setActiveOptions] = useState({
    style: [],
    background: [],
    time: [],
    camera: [],
    quality: [],
  });
  
  // 연결된 노드들
  const [connectedNodes, setConnectedNodes] = useState([]);

  // 토글 핸들러
  const handleToggle = useCallback((nodeType, optionId) => {
    setActiveOptions(prev => {
      const current = prev[nodeType];
      const newOptions = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      return { ...prev, [nodeType]: newOptions };
    });
  }, []);

  // 노드 연결 핸들러
  const handleConnect = useCallback((nodeType) => {
    setConnectedNodes(prev => 
      prev.includes(nodeType)
        ? prev.filter(t => t !== nodeType)
        : [...prev, nodeType]
    );
  }, []);

  // 조합된 프롬프트 생성
  const getCombinedPrompt = useCallback(() => {
    const parts = [userPrompt];
    
    connectedNodes.forEach(nodeType => {
      const nodeData = NODE_DATA[nodeType];
      const selectedIds = activeOptions[nodeType];
      
      selectedIds.forEach(id => {
        const option = nodeData.options.find(opt => opt.id === id);
        if (option) {
          parts.push(option.prompt);
        }
      });
    });

    return parts.filter(p => p.trim()).join(', ');
  }, [userPrompt, connectedNodes, activeOptions]);

  // 이미지 생성 핸들러
  const handleGenerate = useCallback(async () => {
    const finalPrompt = getCombinedPrompt();
    console.log('생성 시작!');
    console.log('모델:', selectedModel);
    console.log('최종 프롬프트:', finalPrompt);
    
    setIsGenerating(true);
    
    // 여기에 실제 API 호출 로직 추가
    // 예: await generateImage(selectedModel, finalPrompt);
    
    // 시뮬레이션 (3초 후 완료)
    setTimeout(() => {
      setIsGenerating(false);
      alert('이미지 생성 완료!\n\n프롬프트: ' + finalPrompt);
    }, 3000);
  }, [getCombinedPrompt, selectedModel]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      padding: '40px',
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '40px',
      }}>
        🎨 웹툰 AI 이미지 생성 노드 시스템
      </h1>

      <div style={{
        display: 'flex',
        gap: '40px',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* 보조 노드들 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <h2 style={{ fontSize: '16px', color: '#666', margin: '0 0 10px 0' }}>
            📦 프롬프트 보조 노드
          </h2>
          {Object.keys(NODE_DATA).map(nodeType => (
            <PromptNode
              key={nodeType}
              nodeType={nodeType}
              activeOptions={activeOptions[nodeType]}
              onToggle={handleToggle}
              onConnect={handleConnect}
              isConnected={connectedNodes.includes(nodeType)}
            />
          ))}
        </div>

        {/* 메인 노드 */}
        <div style={{
          position: 'sticky',
          top: '40px',
        }}>
          <h2 style={{ fontSize: '16px', color: '#666', margin: '0 0 10px 0' }}>
            🎯 메인 노드
          </h2>
          <MainNode
            userPrompt={userPrompt}
            setUserPrompt={setUserPrompt}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            combinedPrompt={connectedNodes.length > 0 || userPrompt ? getCombinedPrompt() : ''}
          />
          
          {/* 연결 상태 표시 */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #eee',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>
              🔗 연결된 노드: {connectedNodes.length}개
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {connectedNodes.map(nodeType => (
                <span key={nodeType} style={{
                  padding: '4px 8px',
                  backgroundColor: '#E3F2FD',
                  color: '#1565C0',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  {NODE_DATA[nodeType].title}
                </span>
              ))}
              {connectedNodes.length === 0 && (
                <span style={{ fontSize: '12px', color: '#999' }}>
                  노드를 연결해주세요
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptHelperSystem;

// 개별 export (필요한 컴포넌트만 가져다 쓸 수 있도록)
export { PromptNode, MainNode, ToggleButton, NODE_DATA };
