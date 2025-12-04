import React, { useState, useCallback, useRef } from 'react';

// 참조 노드 데이터
const REFERENCE_NODE_DATA = {
  pose: {
    title: '🏃 포즈 참조',
    icon: '🏃',
    description: '이미지의 포즈만 추출하여 적용',
    color: '#4CAF50',
    options: [
      { id: 'pose_exact', label: '정확히', prompt: 'exact same pose as reference' },
      { id: 'pose_similar', label: '비슷하게', prompt: 'similar pose to reference' },
      { id: 'pose_mirror', label: '좌우반전', prompt: 'mirrored pose from reference' },
      { id: 'pose_dynamic', label: '다이나믹하게', prompt: 'more dynamic version of reference pose' },
    ]
  },
  character: {
    title: '👤 캐릭터 일관성',
    icon: '👤',
    description: '같은 캐릭터를 다른 장면에서 유지',
    color: '#2196F3',
    options: [
      { id: 'char_same', label: '동일인물', prompt: 'same character, consistent appearance' },
      { id: 'char_age_up', label: '성장버전', prompt: 'same character but older' },
      { id: 'char_age_down', label: '어린버전', prompt: 'same character but younger' },
      { id: 'char_outfit', label: '의상만변경', prompt: 'same character, different outfit' },
      { id: 'char_emotion', label: '표정만변경', prompt: 'same character, different expression' },
    ]
  },
  style: {
    title: '🎨 스타일 참조',
    icon: '🎨',
    description: '이미지의 그림체/색감을 참조',
    color: '#9C27B0',
    options: [
      { id: 'style_exact', label: '동일스타일', prompt: 'exact same art style as reference' },
      { id: 'style_color', label: '색감만', prompt: 'same color palette as reference' },
      { id: 'style_lineart', label: '선스타일', prompt: 'same line art style as reference' },
      { id: 'style_shading', label: '명암스타일', prompt: 'same shading style as reference' },
      { id: 'style_texture', label: '질감', prompt: 'same texture style as reference' },
    ]
  },
  composition: {
    title: '📐 구도 참조',
    icon: '📐',
    description: '이미지의 레이아웃/구도를 참조',
    color: '#FF9800',
    options: [
      { id: 'comp_exact', label: '동일구도', prompt: 'exact same composition as reference' },
      { id: 'comp_layout', label: '레이아웃만', prompt: 'same layout as reference' },
      { id: 'comp_perspective', label: '원근법', prompt: 'same perspective as reference' },
      { id: 'comp_framing', label: '프레이밍', prompt: 'same framing as reference' },
      { id: 'comp_depth', label: '깊이감', prompt: 'same depth of field as reference' },
    ]
  },
  background: {
    title: '🏞️ 배경 참조',
    icon: '🏞️',
    description: '이미지의 배경을 참조하여 적용',
    color: '#00BCD4',
    options: [
      { id: 'bg_same', label: '동일배경', prompt: 'exact same background as reference' },
      { id: 'bg_similar', label: '비슷한배경', prompt: 'similar background style' },
      { id: 'bg_time', label: '시간만변경', prompt: 'same background, different time of day' },
      { id: 'bg_weather', label: '날씨만변경', prompt: 'same background, different weather' },
      { id: 'bg_season', label: '계절만변경', prompt: 'same background, different season' },
    ]
  },
  object: {
    title: '📦 오브젝트 참조',
    icon: '📦',
    description: '특정 물체/소품을 참조하여 적용',
    color: '#795548',
    options: [
      { id: 'obj_same', label: '동일물체', prompt: 'exact same object as reference' },
      { id: 'obj_style', label: '스타일만', prompt: 'same object style as reference' },
      { id: 'obj_color', label: '색상만', prompt: 'same object with different color' },
      { id: 'obj_angle', label: '각도변경', prompt: 'same object from different angle' },
      { id: 'obj_damaged', label: '손상버전', prompt: 'same object but damaged/worn' },
    ]
  },
};

// 이미지 드롭존 컴포넌트
const ImageDropZone = ({ image, onImageDrop, onImageRemove, nodeColor }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageDrop(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageDrop(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!image ? handleClick : undefined}
      style={{
        width: '100%',
        height: image ? 'auto' : '100px',
        minHeight: '100px',
        border: `2px dashed ${isDragging ? nodeColor : '#ccc'}`,
        borderRadius: '8px',
        backgroundColor: isDragging ? `${nodeColor}15` : '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: image ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {image ? (
        <>
          <img
            src={image}
            alt="Reference"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '150px',
              objectFit: 'contain',
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageRemove();
            }}
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <span style={{ fontSize: '24px', marginBottom: '8px' }}>📥</span>
          <span style={{ fontSize: '12px', color: '#888' }}>
            이미지를 드롭하거나 클릭
          </span>
        </>
      )}
    </div>
  );
};

// 토글 버튼 컴포넌트
const ToggleButton = ({ option, isActive, onToggle, color }) => {
  return (
    <button
      onClick={() => onToggle(option.id)}
      style={{
        padding: '6px 12px',
        margin: '3px',
        borderRadius: '16px',
        border: isActive ? `2px solid ${color}` : '2px solid #ddd',
        backgroundColor: isActive ? `${color}20` : '#fff',
        color: isActive ? color : '#666',
        cursor: 'pointer',
        fontSize: '12px',
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

// 개별 참조 노드 컴포넌트
const ReferenceNode = ({ 
  nodeType, 
  image, 
  onImageDrop, 
  onImageRemove,
  activeOptions, 
  onToggle, 
  onConnect, 
  isConnected,
  strength,
  onStrengthChange,
}) => {
  const nodeData = REFERENCE_NODE_DATA[nodeType];
  
  if (!nodeData) return null;

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: isConnected 
        ? `0 4px 20px ${nodeData.color}50` 
        : '0 2px 10px rgba(0,0,0,0.1)',
      border: isConnected ? `2px solid ${nodeData.color}` : '2px solid #eee',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* 노드 헤더 */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: isConnected ? nodeData.color : '#f5f5f5',
        color: isConnected ? '#fff' : '#333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>
            {nodeData.title}
          </span>
          <p style={{ 
            margin: '2px 0 0 0', 
            fontSize: '10px', 
            opacity: 0.8,
          }}>
            {nodeData.description}
          </p>
        </div>
        <button
          onClick={() => onConnect(nodeType)}
          style={{
            padding: '4px 10px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isConnected ? '#fff' : nodeData.color,
            color: isConnected ? nodeData.color : '#fff',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
          }}
        >
          {isConnected ? '연결됨' : '연결'}
        </button>
      </div>

      {/* 이미지 드롭존 */}
      <div style={{ padding: '10px' }}>
        <ImageDropZone
          image={image}
          onImageDrop={onImageDrop}
          onImageRemove={onImageRemove}
          nodeColor={nodeData.color}
        />
      </div>

      {/* 참조 강도 슬라이더 */}
      {image && (
        <div style={{ padding: '0 14px 10px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#666',
            marginBottom: '4px',
          }}>
            <span>참조 강도</span>
            <span>{Math.round(strength * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={strength}
            onChange={(e) => onStrengthChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: nodeData.color,
            }}
          />
        </div>
      )}

      {/* 옵션 버튼들 */}
      <div style={{
        padding: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2px',
        borderTop: '1px solid #eee',
      }}>
        {nodeData.options.map(option => (
          <ToggleButton
            key={option.id}
            option={option}
            isActive={activeOptions.includes(option.id)}
            onToggle={(id) => onToggle(nodeType, id)}
            color={nodeData.color}
          />
        ))}
      </div>

      {/* 상태 표시 */}
      <div style={{
        padding: '6px 14px',
        backgroundColor: '#f9f9f9',
        fontSize: '11px',
        color: '#888',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{image ? '✓ 이미지 있음' : '이미지 없음'}</span>
        <span>{activeOptions.length}개 옵션 선택</span>
      </div>
    </div>
  );
};

// 전체 참조 노드 시스템
const ReferenceNodeSystem = () => {
  // 각 노드별 이미지
  const [images, setImages] = useState({
    pose: null,
    character: null,
    style: null,
    composition: null,
    background: null,
    object: null,
  });

  // 각 노드별 참조 강도
  const [strengths, setStrengths] = useState({
    pose: 0.8,
    character: 0.9,
    style: 0.7,
    composition: 0.6,
    background: 0.7,
    object: 0.8,
  });

  // 각 노드별 활성화된 옵션
  const [activeOptions, setActiveOptions] = useState(
    Object.keys(REFERENCE_NODE_DATA).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {})
  );

  // 연결된 노드들
  const [connectedNodes, setConnectedNodes] = useState([]);

  // 핸들러들
  const handleImageDrop = useCallback((nodeType, imageData) => {
    setImages(prev => ({ ...prev, [nodeType]: imageData }));
  }, []);

  const handleImageRemove = useCallback((nodeType) => {
    setImages(prev => ({ ...prev, [nodeType]: null }));
  }, []);

  const handleStrengthChange = useCallback((nodeType, value) => {
    setStrengths(prev => ({ ...prev, [nodeType]: value }));
  }, []);

  const handleToggle = useCallback((nodeType, optionId) => {
    setActiveOptions(prev => {
      const current = prev[nodeType];
      const newOptions = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      return { ...prev, [nodeType]: newOptions };
    });
  }, []);

  const handleConnect = useCallback((nodeType) => {
    setConnectedNodes(prev => 
      prev.includes(nodeType)
        ? prev.filter(t => t !== nodeType)
        : [...prev, nodeType]
    );
  }, []);

  // 조합된 참조 프롬프트 생성
  const getCombinedPrompt = useCallback(() => {
    const parts = [];
    
    connectedNodes.forEach(nodeType => {
      if (images[nodeType]) {
        const nodeData = REFERENCE_NODE_DATA[nodeType];
        const selectedIds = activeOptions[nodeType];
        const strength = strengths[nodeType];
        
        selectedIds.forEach(id => {
          const option = nodeData.options.find(opt => opt.id === id);
          if (option) {
            parts.push(`[${option.prompt}, strength: ${strength}]`);
          }
        });
      }
    });

    return parts.join(', ');
  }, [connectedNodes, images, activeOptions, strengths]);

  // 연결된 이미지들 가져오기 (메인 노드에 전달용)
  const getConnectedImages = useCallback(() => {
    return connectedNodes
      .filter(nodeType => images[nodeType])
      .map(nodeType => ({
        type: nodeType,
        image: images[nodeType],
        strength: strengths[nodeType],
        options: activeOptions[nodeType],
      }));
  }, [connectedNodes, images, strengths, activeOptions]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5FFF5',
      padding: '30px',
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '10px',
        fontSize: '24px',
      }}>
        🖼️ 참조 노드 시스템
      </h1>
      <p style={{
        textAlign: 'center',
        color: '#666',
        marginBottom: '30px',
        fontSize: '14px',
      }}>
        이미지를 드롭하여 포즈, 캐릭터, 스타일 등을 참조할 수 있습니다
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        justifyContent: 'center',
      }}>
        {Object.keys(REFERENCE_NODE_DATA).map(nodeType => (
          <ReferenceNode
            key={nodeType}
            nodeType={nodeType}
            image={images[nodeType]}
            onImageDrop={(img) => handleImageDrop(nodeType, img)}
            onImageRemove={() => handleImageRemove(nodeType)}
            activeOptions={activeOptions[nodeType]}
            onToggle={handleToggle}
            onConnect={handleConnect}
            isConnected={connectedNodes.includes(nodeType)}
            strength={strengths[nodeType]}
            onStrengthChange={(val) => handleStrengthChange(nodeType, val)}
          />
        ))}
      </div>

      {/* 연결 상태 및 프롬프트 미리보기 */}
      <div style={{
        maxWidth: '800px',
        margin: '30px auto 0',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>
          🔗 연결된 참조 노드: {connectedNodes.length}개
        </h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {connectedNodes.map(nodeType => (
            <div key={nodeType} style={{
              padding: '8px 12px',
              backgroundColor: `${REFERENCE_NODE_DATA[nodeType].color}20`,
              color: REFERENCE_NODE_DATA[nodeType].color,
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>{REFERENCE_NODE_DATA[nodeType].title}</span>
              {images[nodeType] && (
                <img 
                  src={images[nodeType]} 
                  alt="" 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }} 
                />
              )}
            </div>
          ))}
          {connectedNodes.length === 0 && (
            <span style={{ fontSize: '12px', color: '#999' }}>
              노드를 연결해주세요
            </span>
          )}
        </div>

        {getCombinedPrompt() && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f0fff0',
            borderRadius: '8px',
            border: '1px solid #90EE90',
          }}>
            <label style={{ fontSize: '12px', color: '#2E7D32', display: 'block', marginBottom: '4px' }}>
              📝 조합된 참조 프롬프트
            </label>
            <p style={{ margin: 0, fontSize: '12px', color: '#333', lineHeight: '1.5' }}>
              {getCombinedPrompt()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceNodeSystem;

// 개별 export
export { ReferenceNode, ImageDropZone, REFERENCE_NODE_DATA };
