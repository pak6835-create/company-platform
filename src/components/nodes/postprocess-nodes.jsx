import React, { useState, useCallback } from 'react';

// 후처리 노드 데이터 (AI 필수 기능만)
const POSTPROCESS_NODE_DATA = {
  removeBackground: {
    title: '🔲 배경 제거',
    icon: '🔲',
    description: '배경을 제거하고 투명 PNG로 변환',
    color: '#E91E63',
    options: [
      { id: 'bg_auto', label: '자동감지', prompt: 'automatic background removal' },
      { id: 'bg_subject', label: '주요피사체', prompt: 'keep main subject only' },
      { id: 'bg_person', label: '인물만', prompt: 'keep person/character only' },
      { id: 'bg_object', label: '물체만', prompt: 'keep object only' },
      { id: 'bg_soft', label: '부드러운엣지', prompt: 'soft edge background removal' },
      { id: 'bg_sharp', label: '날카로운엣지', prompt: 'sharp edge background removal' },
    ],
    outputFormat: 'PNG (투명)',
  },
  extractLine: {
    title: '✏️ 라인 추출',
    icon: '✏️',
    description: '선화만 추출',
    color: '#607D8B',
    options: [
      { id: 'line_thin', label: '가는선', prompt: 'thin line art extraction' },
      { id: 'line_medium', label: '중간선', prompt: 'medium line art extraction' },
      { id: 'line_thick', label: '굵은선', prompt: 'thick line art extraction' },
      { id: 'line_sketch', label: '스케치풍', prompt: 'sketchy line extraction' },
      { id: 'line_clean', label: '깔끔한선', prompt: 'clean line art' },
      { id: 'line_detail', label: '디테일유지', prompt: 'detailed line extraction' },
    ],
    outputFormat: 'PNG (흑백/투명)',
  },
  materialID: {
    title: '🏷️ 재질맵',
    icon: '🏷️',
    description: '재질별로 색상 분리 (Material ID)',
    color: '#9C27B0',
    options: [
      { id: 'mat_skin', label: '피부', prompt: 'skin material separation' },
      { id: 'mat_hair', label: '머리카락', prompt: 'hair material separation' },
      { id: 'mat_cloth', label: '옷', prompt: 'clothing material separation' },
      { id: 'mat_metal', label: '금속', prompt: 'metal material separation' },
      { id: 'mat_glass', label: '유리', prompt: 'glass material separation' },
      { id: 'mat_all', label: '전체분리', prompt: 'full material ID map' },
    ],
    outputFormat: 'PNG (컬러맵)',
  },
  upscale: {
    title: '🔍 업스케일',
    icon: '🔍',
    description: 'AI로 해상도 확대',
    color: '#2196F3',
    options: [
      { id: 'up_2x', label: '2배', prompt: '2x upscale' },
      { id: 'up_4x', label: '4배', prompt: '4x upscale' },
      { id: 'up_anime', label: '애니메이션', prompt: 'anime style upscale' },
      { id: 'up_photo', label: '사진', prompt: 'photorealistic upscale' },
      { id: 'up_art', label: '아트', prompt: 'artistic upscale' },
      { id: 'up_detail', label: '디테일강화', prompt: 'detail enhancement upscale' },
    ],
    outputFormat: '원본 형식 (고해상도)',
  },
  stylize: {
    title: '✨ 스타일 변환',
    icon: '✨',
    description: 'AI로 다른 스타일로 변환',
    color: '#FF9800',
    options: [
      { id: 'sty_anime', label: '애니메이션', prompt: 'convert to anime style' },
      { id: 'sty_cartoon', label: '카툰', prompt: 'convert to cartoon style' },
      { id: 'sty_watercolor', label: '수채화', prompt: 'convert to watercolor style' },
      { id: 'sty_oil', label: '유화', prompt: 'convert to oil painting style' },
      { id: 'sty_pixel', label: '픽셀', prompt: 'convert to pixel art' },
      { id: 'sty_sketch', label: '스케치', prompt: 'convert to sketch style' },
    ],
    outputFormat: '원본 형식',
  },
};

// 개별 후처리 노드 컴포넌트
const PostProcessNode = ({ 
  nodeType, 
  activeOptions, 
  onToggle, 
  order,
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
  intensity,
  onIntensityChange,
}) => {
  const nodeData = POSTPROCESS_NODE_DATA[nodeType];
  
  if (!nodeData) return null;

  return (
    <div style={{
      width: '100%',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: `2px solid ${nodeData.color}`,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* 노드 헤더 */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: nodeData.color,
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            {order}
          </span>
          <div>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              {nodeData.title}
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', opacity: 0.8 }}>
              출력: {nodeData.outputFormat}
            </p>
          </div>
        </div>
        
        {/* 순서 조절 버튼 */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: isFirst ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)',
              color: '#fff',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: isLast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)',
              color: '#fff',
              cursor: isLast ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.4)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* 강도 슬라이더 */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #eee' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#666',
          marginBottom: '4px',
        }}>
          <span>적용 강도</span>
          <span>{Math.round(intensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={intensity}
          onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: nodeData.color,
          }}
        />
      </div>

      {/* 옵션 버튼들 */}
      <div style={{
        padding: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
      }}>
        {nodeData.options.map(option => (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: activeOptions.includes(option.id) 
                ? `2px solid ${nodeData.color}` 
                : '2px solid #ddd',
              backgroundColor: activeOptions.includes(option.id) 
                ? `${nodeData.color}20` 
                : '#fff',
              color: activeOptions.includes(option.id) ? nodeData.color : '#666',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeOptions.includes(option.id) ? '600' : '400',
              transition: 'all 0.2s ease',
            }}
          >
            {activeOptions.includes(option.id) && '✓ '}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// 노드 추가 버튼 컴포넌트
const AddNodeButton = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '12px',
          border: '2px dashed #ccc',
          backgroundColor: '#fafafa',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '20px' }}>+</span>
        후처리 노드 추가
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          padding: '8px',
          zIndex: 100,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}>
          {Object.entries(POSTPROCESS_NODE_DATA).map(([key, node]) => (
            <button
              key={key}
              onClick={() => {
                onAdd(key);
                setIsOpen(false);
              }}
              style={{
                padding: '12px 8px',
                borderRadius: '8px',
                border: `2px solid ${node.color}`,
                backgroundColor: `${node.color}10`,
                cursor: 'pointer',
                fontSize: '12px',
                color: node.color,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '20px' }}>{node.icon}</span>
              <span style={{ fontWeight: '500' }}>{node.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 전체 후처리 파이프라인 시스템
const PostProcessPipeline = () => {
  // 파이프라인에 추가된 노드들 (순서대로)
  const [pipeline, setPipeline] = useState([]);

  // 각 노드별 옵션 및 강도
  const [nodeSettings, setNodeSettings] = useState({});

  // 노드 추가
  const handleAddNode = useCallback((nodeType) => {
    const newId = `${nodeType}_${Date.now()}`;
    setPipeline(prev => [...prev, { id: newId, type: nodeType }]);
    setNodeSettings(prev => ({
      ...prev,
      [newId]: { options: [], intensity: 1.0 }
    }));
  }, []);

  // 노드 제거
  const handleRemoveNode = useCallback((nodeId) => {
    setPipeline(prev => prev.filter(node => node.id !== nodeId));
    setNodeSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[nodeId];
      return newSettings;
    });
  }, []);

  // 순서 변경
  const handleMoveUp = useCallback((index) => {
    if (index === 0) return;
    setPipeline(prev => {
      const newPipeline = [...prev];
      [newPipeline[index - 1], newPipeline[index]] = [newPipeline[index], newPipeline[index - 1]];
      return newPipeline;
    });
  }, []);

  const handleMoveDown = useCallback((index) => {
    setPipeline(prev => {
      if (index === prev.length - 1) return prev;
      const newPipeline = [...prev];
      [newPipeline[index], newPipeline[index + 1]] = [newPipeline[index + 1], newPipeline[index]];
      return newPipeline;
    });
  }, []);

  // 옵션 토글
  const handleToggleOption = useCallback((nodeId, optionId) => {
    setNodeSettings(prev => {
      const current = prev[nodeId]?.options || [];
      const newOptions = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      return {
        ...prev,
        [nodeId]: { ...prev[nodeId], options: newOptions }
      };
    });
  }, []);

  // 강도 변경
  const handleIntensityChange = useCallback((nodeId, value) => {
    setNodeSettings(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], intensity: value }
    }));
  }, []);

  // 파이프라인 실행 (시뮬레이션)
  const handleExecute = useCallback(() => {
    const steps = pipeline.map((node, index) => {
      const settings = nodeSettings[node.id];
      const nodeData = POSTPROCESS_NODE_DATA[node.type];
      return `${index + 1}. ${nodeData.title} (강도: ${Math.round(settings.intensity * 100)}%)`;
    });
    
    alert('후처리 파이프라인 실행!\n\n' + steps.join('\n'));
  }, [pipeline, nodeSettings]);

  // 파이프라인 초기화
  const handleClear = useCallback(() => {
    setPipeline([]);
    setNodeSettings({});
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFF5F5',
      padding: '30px',
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '10px',
        fontSize: '24px',
      }}>
        🔧 후처리 파이프라인
      </h1>
      <p style={{
        textAlign: 'center',
        color: '#666',
        marginBottom: '30px',
        fontSize: '14px',
      }}>
        노드를 추가하고 순서를 조절하여 후처리 과정을 설정하세요
      </p>

      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        {/* 입력 표시 */}
        <div style={{
          padding: '16px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '2px solid #4CAF50',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '24px' }}>🖼️</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#4CAF50', fontWeight: '600' }}>
            입력 이미지
          </p>
        </div>

        {/* 연결선 */}
        {pipeline.length > 0 && (
          <div style={{
            width: '2px',
            height: '20px',
            backgroundColor: '#ddd',
            margin: '0 auto',
          }} />
        )}

        {/* 파이프라인 노드들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pipeline.map((node, index) => (
            <React.Fragment key={node.id}>
              <PostProcessNode
                nodeType={node.type}
                activeOptions={nodeSettings[node.id]?.options || []}
                onToggle={(optionId) => handleToggleOption(node.id, optionId)}
                order={index + 1}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                onRemove={() => handleRemoveNode(node.id)}
                isFirst={index === 0}
                isLast={index === pipeline.length - 1}
                intensity={nodeSettings[node.id]?.intensity || 1.0}
                onIntensityChange={(val) => handleIntensityChange(node.id, val)}
              />
              
              {/* 연결선 */}
              <div style={{
                width: '2px',
                height: '20px',
                backgroundColor: '#ddd',
                margin: '0 auto',
              }} />
            </React.Fragment>
          ))}
        </div>

        {/* 노드 추가 버튼 */}
        <AddNodeButton onAdd={handleAddNode} />

        {/* 출력 표시 */}
        {pipeline.length > 0 && (
          <>
            <div style={{
              width: '2px',
              height: '20px',
              backgroundColor: '#ddd',
              margin: '16px auto',
            }} />
            <div style={{
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '2px solid #E91E63',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '24px' }}>✨</span>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#E91E63', fontWeight: '600' }}>
                출력 이미지
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>
                {pipeline.length}개 처리 적용됨
              </p>
            </div>
          </>
        )}

        {/* 실행 버튼 */}
        {pipeline.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '24px',
          }}>
            <button
              onClick={handleExecute}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#E91E63',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              🚀 파이프라인 실행
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '14px 20px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                color: '#666',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostProcessPipeline;

// 개별 export
export { PostProcessNode, AddNodeButton, POSTPROCESS_NODE_DATA };
