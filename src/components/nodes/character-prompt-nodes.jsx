import React, { useState, useCallback } from 'react';

// 캐릭터 노드 데이터
const CHARACTER_NODE_DATA = {
  gender: {
    title: '👤 성별',
    icon: '👤',
    options: [
      { id: 'male', label: '남성', prompt: 'male character, man' },
      { id: 'female', label: '여성', prompt: 'female character, woman' },
      { id: 'boy', label: '소년', prompt: 'young boy, teenage boy' },
      { id: 'girl', label: '소녀', prompt: 'young girl, teenage girl' },
      { id: 'elderly_m', label: '노인(남)', prompt: 'elderly man, old man' },
      { id: 'elderly_f', label: '노인(여)', prompt: 'elderly woman, old woman' },
      { id: 'child_m', label: '남자아이', prompt: 'young boy child' },
      { id: 'child_f', label: '여자아이', prompt: 'young girl child' },
    ]
  },
  ethnicity: {
    title: '🌍 인종/민족',
    icon: '🌍',
    options: [
      { id: 'asian_east', label: '동아시아', prompt: 'East Asian, Korean, Japanese, Chinese appearance' },
      { id: 'asian_south', label: '남아시아', prompt: 'South Asian, Indian appearance' },
      { id: 'asian_southeast', label: '동남아시아', prompt: 'Southeast Asian appearance' },
      { id: 'caucasian', label: '백인', prompt: 'Caucasian, European appearance' },
      { id: 'african', label: '아프리카', prompt: 'African, Black appearance' },
      { id: 'hispanic', label: '히스패닉', prompt: 'Hispanic, Latino appearance' },
      { id: 'middleeast', label: '중동', prompt: 'Middle Eastern appearance' },
      { id: 'mixed', label: '혼혈', prompt: 'mixed race, multiracial' },
    ]
  },
  age: {
    title: '🎂 나이대',
    icon: '🎂',
    options: [
      { id: 'child', label: '어린이', prompt: 'child, 8-12 years old appearance' },
      { id: 'teen', label: '10대', prompt: 'teenager, 13-19 years old appearance' },
      { id: '20s', label: '20대', prompt: '20s, young adult appearance' },
      { id: '30s', label: '30대', prompt: '30s, adult appearance' },
      { id: '40s', label: '40대', prompt: '40s, middle-aged appearance' },
      { id: '50s', label: '50대', prompt: '50s, mature appearance' },
      { id: '60plus', label: '60대+', prompt: '60s or older, elderly appearance' },
    ]
  },
  bodyType: {
    title: '💪 체형',
    icon: '💪',
    options: [
      { id: 'slim', label: '마른', prompt: 'slim body, thin build' },
      { id: 'average', label: '보통', prompt: 'average body type, normal build' },
      { id: 'athletic', label: '운동형', prompt: 'athletic body, fit, muscular' },
      { id: 'muscular', label: '근육질', prompt: 'very muscular, bodybuilder physique' },
      { id: 'chubby', label: '통통', prompt: 'chubby, plump body type' },
      { id: 'tall', label: '키큰', prompt: 'tall height, long legs' },
      { id: 'short', label: '키작은', prompt: 'short height, petite' },
      { id: 'curvy', label: '글래머', prompt: 'curvy body type' },
    ]
  },
  face: {
    title: '😊 얼굴형',
    icon: '😊',
    options: [
      { id: 'oval', label: '계란형', prompt: 'oval face shape' },
      { id: 'round', label: '둥근', prompt: 'round face shape' },
      { id: 'square', label: '각진', prompt: 'square face shape, strong jawline' },
      { id: 'heart', label: '하트형', prompt: 'heart-shaped face' },
      { id: 'long', label: '긴얼굴', prompt: 'long face shape' },
      { id: 'sharp', label: '날카로운', prompt: 'sharp features, defined cheekbones' },
      { id: 'soft', label: '부드러운', prompt: 'soft facial features' },
      { id: 'babyface', label: '동안', prompt: 'baby face, youthful appearance' },
    ]
  },
  hairStyle: {
    title: '💇 헤어스타일',
    icon: '💇',
    options: [
      { id: 'short', label: '숏컷', prompt: 'short hair' },
      { id: 'medium', label: '중간길이', prompt: 'medium length hair' },
      { id: 'long', label: '긴머리', prompt: 'long hair' },
      { id: 'verylong', label: '장발', prompt: 'very long hair, waist-length' },
      { id: 'ponytail', label: '포니테일', prompt: 'ponytail hairstyle' },
      { id: 'twintails', label: '트윈테일', prompt: 'twin tails, pigtails' },
      { id: 'bun', label: '올림머리', prompt: 'hair bun, updo' },
      { id: 'braids', label: '땋은머리', prompt: 'braided hair' },
      { id: 'curly', label: '곱슬', prompt: 'curly hair, wavy hair' },
      { id: 'straight', label: '생머리', prompt: 'straight hair, sleek hair' },
      { id: 'bangs', label: '앞머리', prompt: 'with bangs, fringe' },
      { id: 'bald', label: '민머리', prompt: 'bald head, shaved head' },
    ]
  },
  hairColor: {
    title: '🎨 머리색',
    icon: '🎨',
    options: [
      { id: 'black', label: '검정', prompt: 'black hair' },
      { id: 'brown', label: '갈색', prompt: 'brown hair' },
      { id: 'blonde', label: '금발', prompt: 'blonde hair, golden hair' },
      { id: 'red', label: '빨강', prompt: 'red hair, ginger hair' },
      { id: 'white', label: '흰색', prompt: 'white hair, silver hair' },
      { id: 'gray', label: '회색', prompt: 'gray hair' },
      { id: 'blue', label: '파랑', prompt: 'blue hair' },
      { id: 'pink', label: '분홍', prompt: 'pink hair' },
      { id: 'purple', label: '보라', prompt: 'purple hair' },
      { id: 'green', label: '초록', prompt: 'green hair' },
      { id: 'ombre', label: '옴브레', prompt: 'ombre hair, gradient color' },
      { id: 'highlight', label: '하이라이트', prompt: 'highlighted hair, streaked' },
    ]
  },
  eyes: {
    title: '👁️ 눈',
    icon: '👁️',
    options: [
      { id: 'big', label: '큰눈', prompt: 'big eyes, large eyes' },
      { id: 'small', label: '작은눈', prompt: 'small eyes' },
      { id: 'sharp', label: '날카로운눈', prompt: 'sharp eyes, fierce look' },
      { id: 'gentle', label: '순한눈', prompt: 'gentle eyes, soft gaze' },
      { id: 'monolid', label: '무쌍', prompt: 'monolid eyes, single eyelid' },
      { id: 'doublelid', label: '쌍꺼풀', prompt: 'double eyelid eyes' },
      { id: 'droopy', label: '처진눈', prompt: 'droopy eyes, downturned' },
      { id: 'upturned', label: '올라간눈', prompt: 'upturned eyes, cat eyes' },
    ]
  },
  eyeColor: {
    title: '🔮 눈동자색',
    icon: '🔮',
    options: [
      { id: 'black', label: '검정', prompt: 'black eyes' },
      { id: 'brown', label: '갈색', prompt: 'brown eyes' },
      { id: 'blue', label: '파랑', prompt: 'blue eyes' },
      { id: 'green', label: '초록', prompt: 'green eyes' },
      { id: 'hazel', label: '헤이즐', prompt: 'hazel eyes' },
      { id: 'gray', label: '회색', prompt: 'gray eyes' },
      { id: 'amber', label: '황금색', prompt: 'amber eyes, golden eyes' },
      { id: 'red', label: '빨강', prompt: 'red eyes' },
      { id: 'purple', label: '보라', prompt: 'purple eyes, violet eyes' },
      { id: 'heterochromia', label: '오드아이', prompt: 'heterochromia, different colored eyes' },
    ]
  },
  expression: {
    title: '😄 표정',
    icon: '😄',
    options: [
      { id: 'smile', label: '미소', prompt: 'smiling, happy expression' },
      { id: 'laugh', label: '웃음', prompt: 'laughing, big smile' },
      { id: 'serious', label: '진지', prompt: 'serious expression, stern look' },
      { id: 'angry', label: '화남', prompt: 'angry expression, furious' },
      { id: 'sad', label: '슬픔', prompt: 'sad expression, melancholy' },
      { id: 'surprised', label: '놀람', prompt: 'surprised expression, shocked' },
      { id: 'shy', label: '수줍음', prompt: 'shy expression, bashful' },
      { id: 'confident', label: '자신감', prompt: 'confident expression, smirk' },
      { id: 'neutral', label: '무표정', prompt: 'neutral expression, blank face' },
      { id: 'crying', label: '울음', prompt: 'crying, tears' },
      { id: 'wink', label: '윙크', prompt: 'winking' },
      { id: 'pout', label: '삐짐', prompt: 'pouting, sulking' },
    ]
  },
  pose: {
    title: '🧍 포즈',
    icon: '🧍',
    options: [
      { id: 'standing', label: '서있는', prompt: 'standing pose' },
      { id: 'sitting', label: '앉은', prompt: 'sitting pose' },
      { id: 'walking', label: '걷는', prompt: 'walking pose, in motion' },
      { id: 'running', label: '달리는', prompt: 'running pose, sprinting' },
      { id: 'leaning', label: '기댄', prompt: 'leaning pose' },
      { id: 'crossed_arms', label: '팔짱', prompt: 'arms crossed pose' },
      { id: 'hands_pocket', label: '주머니손', prompt: 'hands in pockets' },
      { id: 'waving', label: '손흔드는', prompt: 'waving hand' },
      { id: 'pointing', label: '가리키는', prompt: 'pointing gesture' },
      { id: 'thinking', label: '생각하는', prompt: 'thinking pose, hand on chin' },
      { id: 'fighting', label: '전투', prompt: 'fighting pose, action stance' },
      { id: 'lying', label: '누운', prompt: 'lying down pose' },
    ]
  },
  clothing: {
    title: '👔 의상 스타일',
    icon: '👔',
    options: [
      { id: 'casual', label: '캐주얼', prompt: 'casual clothing, everyday wear' },
      { id: 'formal', label: '정장', prompt: 'formal attire, suit, business wear' },
      { id: 'uniform_school', label: '교복', prompt: 'school uniform' },
      { id: 'uniform_work', label: '작업복', prompt: 'work uniform, occupational clothing' },
      { id: 'sporty', label: '스포티', prompt: 'sporty clothing, athletic wear' },
      { id: 'traditional', label: '전통의상', prompt: 'traditional clothing, hanbok, kimono' },
      { id: 'fantasy', label: '판타지', prompt: 'fantasy costume, medieval clothing' },
      { id: 'scifi', label: 'SF', prompt: 'sci-fi costume, futuristic clothing' },
      { id: 'streetwear', label: '스트릿', prompt: 'streetwear, urban fashion' },
      { id: 'elegant', label: '우아한', prompt: 'elegant dress, formal gown' },
      { id: 'military', label: '군복', prompt: 'military uniform' },
      { id: 'swimwear', label: '수영복', prompt: 'swimwear, beach attire' },
    ]
  },
  accessories: {
    title: '👓 악세서리',
    icon: '👓',
    options: [
      { id: 'glasses', label: '안경', prompt: 'wearing glasses' },
      { id: 'sunglasses', label: '선글라스', prompt: 'wearing sunglasses' },
      { id: 'earrings', label: '귀걸이', prompt: 'wearing earrings' },
      { id: 'necklace', label: '목걸이', prompt: 'wearing necklace' },
      { id: 'hat', label: '모자', prompt: 'wearing hat' },
      { id: 'cap', label: '캡모자', prompt: 'wearing cap, baseball cap' },
      { id: 'scarf', label: '스카프', prompt: 'wearing scarf' },
      { id: 'watch', label: '시계', prompt: 'wearing wristwatch' },
      { id: 'mask', label: '마스크', prompt: 'wearing face mask' },
      { id: 'headphones', label: '헤드폰', prompt: 'wearing headphones' },
      { id: 'ribbon', label: '리본', prompt: 'hair ribbon, bow' },
      { id: 'piercing', label: '피어싱', prompt: 'facial piercing' },
    ]
  },
  characterView: {
    title: '📐 캐릭터 뷰',
    icon: '📐',
    options: [
      { id: 'fullbody', label: '전신', prompt: 'full body shot, head to toe' },
      { id: 'upperbody', label: '상반신', prompt: 'upper body shot, waist up' },
      { id: 'portrait', label: '초상화', prompt: 'portrait, head and shoulders' },
      { id: 'closeup', label: '클로즈업', prompt: 'close-up face shot' },
      { id: 'profile', label: '옆모습', prompt: 'profile view, side portrait' },
      { id: 'back', label: '뒷모습', prompt: 'back view, from behind' },
      { id: 'threequarter', label: '3/4뷰', prompt: 'three-quarter view' },
      { id: 'dynamic', label: '다이나믹', prompt: 'dynamic angle, action shot' },
    ]
  },
};

// 토글 버튼 컴포넌트
const ToggleButton = ({ option, isActive, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(option.id)}
      style={{
        padding: '6px 12px',
        margin: '3px',
        borderRadius: '16px',
        border: isActive ? '2px solid #9C27B0' : '2px solid #ddd',
        backgroundColor: isActive ? '#F3E5F5' : '#fff',
        color: isActive ? '#7B1FA2' : '#666',
        cursor: 'pointer',
        fontSize: '13px',
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

// 개별 캐릭터 노드 컴포넌트
const CharacterNode = ({ nodeType, activeOptions, onToggle, onConnect, isConnected }) => {
  const nodeData = CHARACTER_NODE_DATA[nodeType];
  
  if (!nodeData) return null;

  return (
    <div style={{
      width: '260px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: isConnected 
        ? '0 4px 20px rgba(156, 39, 176, 0.3)' 
        : '0 2px 10px rgba(0,0,0,0.1)',
      border: isConnected ? '2px solid #9C27B0' : '2px solid #eee',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* 노드 헤더 */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: isConnected ? '#9C27B0' : '#f5f5f5',
        color: isConnected ? '#fff' : '#333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>
          {nodeData.title}
        </span>
        <button
          onClick={() => onConnect(nodeType)}
          style={{
            padding: '4px 10px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isConnected ? '#fff' : '#9C27B0',
            color: isConnected ? '#9C27B0' : '#fff',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
          }}
        >
          {isConnected ? '연결됨' : '연결'}
        </button>
      </div>

      {/* 토글 버튼 영역 */}
      <div style={{
        padding: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2px',
        maxHeight: '150px',
        overflowY: 'auto',
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

      {/* 선택된 항목 수 */}
      <div style={{
        padding: '6px 14px',
        backgroundColor: '#f9f9f9',
        fontSize: '11px',
        color: '#888',
        borderTop: '1px solid #eee',
      }}>
        {activeOptions.length}개 선택됨
      </div>
    </div>
  );
};

// 캐릭터 메인 노드
const CharacterMainNode = ({ userPrompt, setUserPrompt, selectedModel, setSelectedModel, onGenerate, isGenerating, combinedPrompt }) => {
  const models = [
    { id: 'gemini-2.0', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro' },
    { id: 'imagen-3', label: 'Imagen 3' },
  ];

  return (
    <div style={{
      width: '380px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      border: '3px solid #9C27B0',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#9C27B0',
        color: '#fff',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>🧑‍🎨 캐릭터 생성</h3>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 모델 선택 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
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

        {/* 캐릭터 이름/설명 입력 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
            캐릭터 설명
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="캐릭터의 특징이나 상황을 설명하세요..."
            style={{
              width: '100%',
              height: '70px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '13px',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 조합된 프롬프트 미리보기 */}
        {combinedPrompt && (
          <div style={{
            marginBottom: '14px',
            padding: '10px',
            backgroundColor: '#fce4ec',
            borderRadius: '8px',
            border: '1px solid #f8bbd9',
          }}>
            <label style={{ fontSize: '11px', color: '#9C27B0', display: 'block', marginBottom: '4px' }}>
              📝 조합된 프롬프트
            </label>
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#333',
              lineHeight: '1.4',
              maxHeight: '80px',
              overflow: 'auto',
            }}>
              {combinedPrompt}
            </p>
          </div>
        )}

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onGenerate}
            disabled={isGenerating || !userPrompt.trim()}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isGenerating ? '#ccc' : '#9C27B0',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? '⏳ 생성 중...' : '✨ 캐릭터 생성'}
          </button>
          <button
            disabled={!isGenerating}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              color: '#666',
              fontSize: '14px',
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

// 카테고리별 노드 그룹
const NODE_CATEGORIES = {
  basic: {
    title: '👤 기본 정보',
    nodes: ['gender', 'ethnicity', 'age', 'bodyType']
  },
  face: {
    title: '😊 얼굴',
    nodes: ['face', 'eyes', 'eyeColor', 'expression']
  },
  hair: {
    title: '💇 헤어',
    nodes: ['hairStyle', 'hairColor']
  },
  appearance: {
    title: '👔 외형',
    nodes: ['clothing', 'accessories', 'pose', 'characterView']
  }
};

// 전체 캐릭터 생성 시스템
const CharacterPromptSystem = () => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 각 노드별 활성화된 옵션
  const [activeOptions, setActiveOptions] = useState(
    Object.keys(CHARACTER_NODE_DATA).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {})
  );
  
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
      const nodeData = CHARACTER_NODE_DATA[nodeType];
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

  // 생성 핸들러
  const handleGenerate = useCallback(async () => {
    const finalPrompt = getCombinedPrompt();
    console.log('캐릭터 생성 시작!');
    console.log('모델:', selectedModel);
    console.log('최종 프롬프트:', finalPrompt);
    
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      alert('캐릭터 생성 완료!\n\n프롬프트: ' + finalPrompt);
    }, 3000);
  }, [getCombinedPrompt, selectedModel]);

  // 전체 선택/해제
  const handleSelectAllInCategory = useCallback((categoryNodes) => {
    const allConnected = categoryNodes.every(node => connectedNodes.includes(node));
    
    if (allConnected) {
      setConnectedNodes(prev => prev.filter(n => !categoryNodes.includes(n)));
    } else {
      setConnectedNodes(prev => [...new Set([...prev, ...categoryNodes])]);
    }
  }, [connectedNodes]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      padding: '30px',
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '30px',
        fontSize: '24px',
      }}>
        🧑‍🎨 웹툰 캐릭터 생성 노드 시스템
      </h1>

      <div style={{
        display: 'flex',
        gap: '30px',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* 보조 노드들 - 카테고리별 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '600px',
        }}>
          {Object.entries(NODE_CATEGORIES).map(([catKey, category]) => (
            <div key={catKey}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  margin: 0,
                }}>
                  {category.title}
                </h3>
                <button
                  onClick={() => handleSelectAllInCategory(category.nodes)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    color: '#666',
                  }}
                >
                  {category.nodes.every(n => connectedNodes.includes(n)) 
                    ? '전체 해제' 
                    : '전체 연결'}
                </button>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                {category.nodes.map(nodeType => (
                  <CharacterNode
                    key={nodeType}
                    nodeType={nodeType}
                    activeOptions={activeOptions[nodeType]}
                    onToggle={handleToggle}
                    onConnect={handleConnect}
                    isConnected={connectedNodes.includes(nodeType)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 메인 노드 */}
        <div style={{
          position: 'sticky',
          top: '30px',
        }}>
          <h3 style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>
            🎯 메인 노드
          </h3>
          <CharacterMainNode
            userPrompt={userPrompt}
            setUserPrompt={setUserPrompt}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            combinedPrompt={connectedNodes.length > 0 || userPrompt ? getCombinedPrompt() : ''}
          />
          
          {/* 연결 상태 */}
          <div style={{
            marginTop: '14px',
            padding: '12px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #eee',
            maxWidth: '380px',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
              🔗 연결된 노드: {connectedNodes.length}개
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {connectedNodes.map(nodeType => (
                <span key={nodeType} style={{
                  padding: '3px 8px',
                  backgroundColor: '#F3E5F5',
                  color: '#7B1FA2',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}>
                  {CHARACTER_NODE_DATA[nodeType].title}
                </span>
              ))}
              {connectedNodes.length === 0 && (
                <span style={{ fontSize: '11px', color: '#999' }}>
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

export default CharacterPromptSystem;

// 개별 export
export { CharacterNode, CharacterMainNode, ToggleButton, CHARACTER_NODE_DATA, NODE_CATEGORIES };
