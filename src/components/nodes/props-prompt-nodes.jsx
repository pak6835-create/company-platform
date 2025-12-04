import React, { useState, useCallback } from 'react';

// 소품/아이템 노드 데이터
const PROPS_NODE_DATA = {
  weapon: {
    title: '⚔️ 무기',
    icon: '⚔️',
    options: [
      { id: 'sword', label: '검', prompt: 'sword, blade weapon' },
      { id: 'katana', label: '카타나', prompt: 'katana, japanese sword' },
      { id: 'dagger', label: '단검', prompt: 'dagger, knife' },
      { id: 'spear', label: '창', prompt: 'spear, lance' },
      { id: 'axe', label: '도끼', prompt: 'axe, battle axe' },
      { id: 'hammer', label: '해머', prompt: 'hammer, war hammer' },
      { id: 'bow', label: '활', prompt: 'bow and arrow' },
      { id: 'crossbow', label: '석궁', prompt: 'crossbow' },
      { id: 'staff', label: '지팡이', prompt: 'magic staff, wizard staff' },
      { id: 'wand', label: '마법봉', prompt: 'magic wand' },
      { id: 'scythe', label: '낫', prompt: 'scythe, death scythe' },
      { id: 'shield', label: '방패', prompt: 'shield, defensive gear' },
    ]
  },
  firearm: {
    title: '🔫 총기류',
    icon: '🔫',
    options: [
      { id: 'pistol', label: '권총', prompt: 'pistol, handgun' },
      { id: 'revolver', label: '리볼버', prompt: 'revolver' },
      { id: 'rifle', label: '소총', prompt: 'rifle' },
      { id: 'sniper', label: '저격총', prompt: 'sniper rifle' },
      { id: 'shotgun', label: '샷건', prompt: 'shotgun' },
      { id: 'machinegun', label: '기관총', prompt: 'machine gun' },
      { id: 'lasergun', label: '레이저건', prompt: 'laser gun, sci-fi weapon' },
      { id: 'plasmagun', label: '플라즈마건', prompt: 'plasma gun, futuristic weapon' },
    ]
  },
  electronics: {
    title: '📱 전자기기',
    icon: '📱',
    options: [
      { id: 'smartphone', label: '스마트폰', prompt: 'smartphone, mobile phone' },
      { id: 'tablet', label: '태블릿', prompt: 'tablet device, iPad' },
      { id: 'laptop', label: '노트북', prompt: 'laptop computer' },
      { id: 'desktop', label: '데스크탑', prompt: 'desktop computer, PC monitor' },
      { id: 'camera', label: '카메라', prompt: 'camera, DSLR' },
      { id: 'headphones', label: '헤드폰', prompt: 'headphones, over-ear' },
      { id: 'earbuds', label: '이어폰', prompt: 'earbuds, wireless earphones' },
      { id: 'gamepad', label: '게임패드', prompt: 'game controller, gamepad' },
      { id: 'vr', label: 'VR헤드셋', prompt: 'VR headset, virtual reality' },
      { id: 'smartwatch', label: '스마트워치', prompt: 'smartwatch' },
      { id: 'drone', label: '드론', prompt: 'drone, quadcopter' },
      { id: 'robot', label: '로봇', prompt: 'robot, android' },
    ]
  },
  vehicle: {
    title: '🚗 탈것',
    icon: '🚗',
    options: [
      { id: 'car', label: '자동차', prompt: 'car, automobile' },
      { id: 'sportscar', label: '스포츠카', prompt: 'sports car, supercar' },
      { id: 'suv', label: 'SUV', prompt: 'SUV, crossover vehicle' },
      { id: 'truck', label: '트럭', prompt: 'truck, pickup truck' },
      { id: 'motorcycle', label: '오토바이', prompt: 'motorcycle, motorbike' },
      { id: 'bicycle', label: '자전거', prompt: 'bicycle, bike' },
      { id: 'scooter', label: '스쿠터', prompt: 'scooter, electric scooter' },
      { id: 'bus', label: '버스', prompt: 'bus, public transport' },
      { id: 'train', label: '기차', prompt: 'train, railway' },
      { id: 'airplane', label: '비행기', prompt: 'airplane, aircraft' },
      { id: 'helicopter', label: '헬리콥터', prompt: 'helicopter' },
      { id: 'ship', label: '배', prompt: 'ship, boat, vessel' },
      { id: 'submarine', label: '잠수함', prompt: 'submarine' },
      { id: 'spaceship', label: '우주선', prompt: 'spaceship, spacecraft' },
    ]
  },
  fantasyVehicle: {
    title: '🐉 판타지 탈것',
    icon: '🐉',
    options: [
      { id: 'dragon', label: '드래곤', prompt: 'riding dragon, dragon mount' },
      { id: 'horse', label: '말', prompt: 'horse, horseback' },
      { id: 'pegasus', label: '페가수스', prompt: 'pegasus, winged horse' },
      { id: 'unicorn', label: '유니콘', prompt: 'unicorn' },
      { id: 'griffin', label: '그리핀', prompt: 'griffin, gryphon mount' },
      { id: 'phoenix', label: '피닉스', prompt: 'phoenix, fire bird' },
      { id: 'carpet', label: '양탄자', prompt: 'flying carpet, magic carpet' },
      { id: 'broom', label: '빗자루', prompt: 'flying broomstick, witch broom' },
      { id: 'chariot', label: '마차', prompt: 'chariot, horse-drawn carriage' },
      { id: 'golem', label: '골렘', prompt: 'riding golem, golem mount' },
    ]
  },
  bag: {
    title: '👜 가방',
    icon: '👜',
    options: [
      { id: 'backpack', label: '백팩', prompt: 'backpack, rucksack' },
      { id: 'schoolbag', label: '책가방', prompt: 'school bag, student bag' },
      { id: 'handbag', label: '핸드백', prompt: 'handbag, purse' },
      { id: 'totebag', label: '토트백', prompt: 'tote bag' },
      { id: 'crossbody', label: '크로스백', prompt: 'crossbody bag, shoulder bag' },
      { id: 'clutch', label: '클러치', prompt: 'clutch bag' },
      { id: 'briefcase', label: '서류가방', prompt: 'briefcase, business bag' },
      { id: 'suitcase', label: '캐리어', prompt: 'suitcase, luggage, travel bag' },
      { id: 'dufflebag', label: '더플백', prompt: 'duffle bag, gym bag' },
      { id: 'messenger', label: '메신저백', prompt: 'messenger bag' },
    ]
  },
  headwear: {
    title: '🎩 모자/머리장식',
    icon: '🎩',
    options: [
      { id: 'cap', label: '캡모자', prompt: 'baseball cap' },
      { id: 'beanie', label: '비니', prompt: 'beanie, knit cap' },
      { id: 'fedora', label: '페도라', prompt: 'fedora hat' },
      { id: 'tophat', label: '탑햇', prompt: 'top hat' },
      { id: 'beret', label: '베레모', prompt: 'beret' },
      { id: 'sunhat', label: '선햇', prompt: 'sun hat, wide brim hat' },
      { id: 'helmet', label: '헬멧', prompt: 'helmet' },
      { id: 'crown', label: '왕관', prompt: 'crown, royal crown' },
      { id: 'tiara', label: '티아라', prompt: 'tiara, princess crown' },
      { id: 'hairpin', label: '머리핀', prompt: 'hairpin, hair clip' },
      { id: 'ribbon', label: '리본', prompt: 'hair ribbon, bow' },
      { id: 'headband', label: '헤어밴드', prompt: 'headband' },
      { id: 'flowers', label: '꽃장식', prompt: 'flower crown, floral headpiece' },
      { id: 'horns', label: '뿔', prompt: 'horns, demon horns, fantasy horns' },
      { id: 'ears', label: '동물귀', prompt: 'animal ears, cat ears, fox ears' },
      { id: 'halo', label: '천사고리', prompt: 'halo, angel ring' },
    ]
  },
  jewelry: {
    title: '💍 장신구',
    icon: '💍',
    options: [
      { id: 'necklace', label: '목걸이', prompt: 'necklace' },
      { id: 'pendant', label: '펜던트', prompt: 'pendant necklace' },
      { id: 'choker', label: '초커', prompt: 'choker necklace' },
      { id: 'earrings', label: '귀걸이', prompt: 'earrings' },
      { id: 'ring', label: '반지', prompt: 'ring, finger ring' },
      { id: 'bracelet', label: '팔찌', prompt: 'bracelet' },
      { id: 'watch', label: '손목시계', prompt: 'wristwatch' },
      { id: 'anklet', label: '발찌', prompt: 'anklet' },
      { id: 'brooch', label: '브로치', prompt: 'brooch, pin' },
      { id: 'cufflinks', label: '커프스', prompt: 'cufflinks' },
      { id: 'amulet', label: '부적', prompt: 'amulet, talisman' },
      { id: 'rosary', label: '묵주', prompt: 'rosary, prayer beads' },
    ]
  },
  eyewear: {
    title: '👓 안경류',
    icon: '👓',
    options: [
      { id: 'glasses', label: '안경', prompt: 'glasses, eyeglasses' },
      { id: 'roundglasses', label: '동그란안경', prompt: 'round glasses' },
      { id: 'squareglasses', label: '각진안경', prompt: 'square glasses, rectangular' },
      { id: 'sunglasses', label: '선글라스', prompt: 'sunglasses' },
      { id: 'aviator', label: '에비에이터', prompt: 'aviator sunglasses' },
      { id: 'goggles', label: '고글', prompt: 'goggles' },
      { id: 'monocle', label: '모노클', prompt: 'monocle, single eyeglass' },
      { id: 'eyepatch', label: '안대', prompt: 'eyepatch' },
    ]
  },
  food: {
    title: '🍔 음식',
    icon: '🍔',
    options: [
      { id: 'coffee', label: '커피', prompt: 'coffee cup, coffee drink' },
      { id: 'tea', label: '차', prompt: 'tea cup, tea drink' },
      { id: 'boba', label: '버블티', prompt: 'bubble tea, boba drink' },
      { id: 'soda', label: '탄산음료', prompt: 'soda, soft drink' },
      { id: 'beer', label: '맥주', prompt: 'beer, beer glass' },
      { id: 'wine', label: '와인', prompt: 'wine, wine glass' },
      { id: 'burger', label: '햄버거', prompt: 'hamburger, burger' },
      { id: 'pizza', label: '피자', prompt: 'pizza slice' },
      { id: 'ramen', label: '라면', prompt: 'ramen, noodles' },
      { id: 'sushi', label: '초밥', prompt: 'sushi' },
      { id: 'icecream', label: '아이스크림', prompt: 'ice cream, gelato' },
      { id: 'cake', label: '케이크', prompt: 'cake, dessert' },
      { id: 'candy', label: '사탕', prompt: 'candy, lollipop' },
      { id: 'apple', label: '사과', prompt: 'apple, fruit' },
    ]
  },
  tools: {
    title: '🔧 도구',
    icon: '🔧',
    options: [
      { id: 'pen', label: '펜', prompt: 'pen, ballpoint pen' },
      { id: 'pencil', label: '연필', prompt: 'pencil' },
      { id: 'brush', label: '붓', prompt: 'paint brush, artist brush' },
      { id: 'book', label: '책', prompt: 'book, reading book' },
      { id: 'notebook', label: '노트', prompt: 'notebook, journal' },
      { id: 'umbrella', label: '우산', prompt: 'umbrella' },
      { id: 'flashlight', label: '손전등', prompt: 'flashlight, torch' },
      { id: 'key', label: '열쇠', prompt: 'key, keys' },
      { id: 'scissors', label: '가위', prompt: 'scissors' },
      { id: 'hammer', label: '망치', prompt: 'hammer, tool' },
      { id: 'wrench', label: '렌치', prompt: 'wrench, spanner' },
      { id: 'magnifier', label: '돋보기', prompt: 'magnifying glass' },
    ]
  },
  music: {
    title: '🎸 악기',
    icon: '🎸',
    options: [
      { id: 'guitar', label: '기타', prompt: 'guitar, acoustic guitar' },
      { id: 'electricguitar', label: '일렉기타', prompt: 'electric guitar' },
      { id: 'bass', label: '베이스', prompt: 'bass guitar' },
      { id: 'piano', label: '피아노', prompt: 'piano, keyboard' },
      { id: 'violin', label: '바이올린', prompt: 'violin' },
      { id: 'cello', label: '첼로', prompt: 'cello' },
      { id: 'drums', label: '드럼', prompt: 'drums, drum set' },
      { id: 'flute', label: '플루트', prompt: 'flute' },
      { id: 'saxophone', label: '색소폰', prompt: 'saxophone' },
      { id: 'trumpet', label: '트럼펫', prompt: 'trumpet' },
      { id: 'microphone', label: '마이크', prompt: 'microphone, singing mic' },
      { id: 'tambourine', label: '탬버린', prompt: 'tambourine' },
    ]
  },
  sports: {
    title: '⚽ 스포츠용품',
    icon: '⚽',
    options: [
      { id: 'soccer', label: '축구공', prompt: 'soccer ball, football' },
      { id: 'basketball', label: '농구공', prompt: 'basketball' },
      { id: 'baseball', label: '야구공', prompt: 'baseball' },
      { id: 'bat', label: '야구배트', prompt: 'baseball bat' },
      { id: 'tennis', label: '테니스', prompt: 'tennis racket and ball' },
      { id: 'badminton', label: '배드민턴', prompt: 'badminton racket' },
      { id: 'golf', label: '골프', prompt: 'golf club' },
      { id: 'skateboard', label: '스케이트보드', prompt: 'skateboard' },
      { id: 'surfboard', label: '서핑보드', prompt: 'surfboard' },
      { id: 'snowboard', label: '스노보드', prompt: 'snowboard' },
      { id: 'skis', label: '스키', prompt: 'skis, skiing equipment' },
      { id: 'boxing', label: '복싱글러브', prompt: 'boxing gloves' },
    ]
  },
  furniture: {
    title: '🪑 가구',
    icon: '🪑',
    options: [
      { id: 'chair', label: '의자', prompt: 'chair' },
      { id: 'armchair', label: '안락의자', prompt: 'armchair, comfortable chair' },
      { id: 'sofa', label: '소파', prompt: 'sofa, couch' },
      { id: 'bed', label: '침대', prompt: 'bed' },
      { id: 'desk', label: '책상', prompt: 'desk, work desk' },
      { id: 'table', label: '테이블', prompt: 'table' },
      { id: 'shelf', label: '선반', prompt: 'bookshelf, shelf' },
      { id: 'lamp', label: '램프', prompt: 'lamp, desk lamp' },
      { id: 'mirror', label: '거울', prompt: 'mirror' },
      { id: 'clock', label: '시계', prompt: 'clock, wall clock' },
      { id: 'plant', label: '화분', prompt: 'potted plant, houseplant' },
      { id: 'rug', label: '러그', prompt: 'rug, carpet' },
    ]
  },
  magicItems: {
    title: '✨ 마법 아이템',
    icon: '✨',
    options: [
      { id: 'crystalball', label: '수정구', prompt: 'crystal ball, fortune telling orb' },
      { id: 'potion', label: '포션', prompt: 'potion bottle, magic potion' },
      { id: 'spellbook', label: '마법서', prompt: 'spellbook, magic tome' },
      { id: 'scroll', label: '두루마리', prompt: 'magic scroll' },
      { id: 'orb', label: '오브', prompt: 'magic orb, glowing sphere' },
      { id: 'gem', label: '보석', prompt: 'magic gem, enchanted jewel' },
      { id: 'mirror', label: '마법거울', prompt: 'magic mirror, enchanted mirror' },
      { id: 'lantern', label: '랜턴', prompt: 'magic lantern, glowing lantern' },
      { id: 'compass', label: '나침반', prompt: 'magic compass' },
      { id: 'hourglass', label: '모래시계', prompt: 'hourglass, sand timer' },
      { id: 'feather', label: '깃펜', prompt: 'magic feather, quill pen' },
      { id: 'chest', label: '보물상자', prompt: 'treasure chest' },
    ]
  },
  propsStyle: {
    title: '🎭 소품 스타일',
    icon: '🎭',
    options: [
      { id: 'realistic', label: '사실적', prompt: 'realistic style prop, detailed' },
      { id: 'cartoon', label: '카툰', prompt: 'cartoon style, stylized' },
      { id: 'anime', label: '애니메이션', prompt: 'anime style prop' },
      { id: 'pixel', label: '픽셀', prompt: 'pixel art style' },
      { id: 'lowpoly', label: '로우폴리', prompt: 'low poly style, 3D geometric' },
      { id: 'handdrawn', label: '손그림', prompt: 'hand-drawn style, sketchy' },
      { id: 'vintage', label: '빈티지', prompt: 'vintage style, retro, antique' },
      { id: 'futuristic', label: '미래적', prompt: 'futuristic style, sci-fi design' },
      { id: 'steampunk', label: '스팀펑크', prompt: 'steampunk style, brass and gears' },
      { id: 'cyberpunk', label: '사이버펑크', prompt: 'cyberpunk style, neon, high-tech' },
      { id: 'fantasy', label: '판타지', prompt: 'fantasy style, magical, ornate' },
      { id: 'minimalist', label: '미니멀', prompt: 'minimalist design, simple, clean' },
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
        border: isActive ? '2px solid #FF6B35' : '2px solid #ddd',
        backgroundColor: isActive ? '#FFF3E0' : '#fff',
        color: isActive ? '#E65100' : '#666',
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

// 개별 소품 노드 컴포넌트
const PropsNode = ({ nodeType, activeOptions, onToggle, onConnect, isConnected }) => {
  const nodeData = PROPS_NODE_DATA[nodeType];
  
  if (!nodeData) return null;

  return (
    <div style={{
      width: '260px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: isConnected 
        ? '0 4px 20px rgba(255, 107, 53, 0.3)' 
        : '0 2px 10px rgba(0,0,0,0.1)',
      border: isConnected ? '2px solid #FF6B35' : '2px solid #eee',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* 노드 헤더 */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: isConnected ? '#FF6B35' : '#f5f5f5',
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
            backgroundColor: isConnected ? '#fff' : '#FF6B35',
            color: isConnected ? '#FF6B35' : '#fff',
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

// 소품 메인 노드
const PropsMainNode = ({ userPrompt, setUserPrompt, selectedModel, setSelectedModel, onGenerate, isGenerating, combinedPrompt }) => {
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
      border: '3px solid #FF6B35',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#FF6B35',
        color: '#fff',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>🎒 소품/아이템 생성</h3>
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

        {/* 소품 설명 입력 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
            소품 설명
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="소품의 특징이나 디테일을 설명하세요..."
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
            backgroundColor: '#FFF3E0',
            borderRadius: '8px',
            border: '1px solid #FFCC80',
          }}>
            <label style={{ fontSize: '11px', color: '#E65100', display: 'block', marginBottom: '4px' }}>
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
              backgroundColor: isGenerating ? '#ccc' : '#FF6B35',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? '⏳ 생성 중...' : '✨ 소품 생성'}
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
const PROPS_CATEGORIES = {
  weapons: {
    title: '⚔️ 무기류',
    nodes: ['weapon', 'firearm']
  },
  tech: {
    title: '📱 전자기기',
    nodes: ['electronics']
  },
  transport: {
    title: '🚗 탈것',
    nodes: ['vehicle', 'fantasyVehicle']
  },
  fashion: {
    title: '👜 패션 소품',
    nodes: ['bag', 'headwear', 'jewelry', 'eyewear']
  },
  daily: {
    title: '🍔 일상 소품',
    nodes: ['food', 'tools', 'music', 'sports']
  },
  interior: {
    title: '🪑 가구/인테리어',
    nodes: ['furniture']
  },
  fantasy: {
    title: '✨ 판타지/스타일',
    nodes: ['magicItems', 'propsStyle']
  }
};

// 전체 소품 생성 시스템
const PropsPromptSystem = () => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 각 노드별 활성화된 옵션
  const [activeOptions, setActiveOptions] = useState(
    Object.keys(PROPS_NODE_DATA).reduce((acc, key) => {
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
      const nodeData = PROPS_NODE_DATA[nodeType];
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
    console.log('소품 생성 시작!');
    console.log('모델:', selectedModel);
    console.log('최종 프롬프트:', finalPrompt);
    
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      alert('소품 생성 완료!\n\n프롬프트: ' + finalPrompt);
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
      backgroundColor: '#FFFAF5',
      padding: '30px',
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '30px',
        fontSize: '24px',
      }}>
        🎒 웹툰 소품/아이템 생성 노드 시스템
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
          maxWidth: '800px',
        }}>
          {Object.entries(PROPS_CATEGORIES).map(([catKey, category]) => (
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
                  <PropsNode
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
          <PropsMainNode
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
                  backgroundColor: '#FFF3E0',
                  color: '#E65100',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}>
                  {PROPS_NODE_DATA[nodeType].title}
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

export default PropsPromptSystem;

// 개별 export
export { PropsNode, PropsMainNode, ToggleButton, PROPS_NODE_DATA, PROPS_CATEGORIES };
