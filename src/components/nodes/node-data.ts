// 노드 데이터 통합 파일

// 장면 노드 데이터
export const SCENE_NODE_DATA = {
  style: {
    title: '🎨 스타일',
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
    options: [
      { id: 'day', label: '낮', prompt: 'daytime, bright daylight' },
      { id: 'night', label: '밤', prompt: 'nighttime, dark sky, moonlight' },
      { id: 'dawn', label: '새벽', prompt: 'dawn, early morning light, soft pink sky' },
      { id: 'sunset', label: '황혼', prompt: 'sunset, golden hour, orange sky' },
      { id: 'cloudy', label: '흐림', prompt: 'overcast sky, cloudy weather, diffused light' },
      { id: 'rain', label: '비', prompt: 'rainy weather, wet surfaces, rain drops' },
      { id: 'snow', label: '눈', prompt: 'snowy weather, snow falling, winter' },
    ]
  },
  camera: {
    title: '📷 카메라',
    options: [
      { id: 'front', label: '정면', prompt: 'front view, straight-on angle' },
      { id: 'side', label: '측면', prompt: 'side view, profile angle' },
      { id: 'above', label: '위에서', prompt: 'high angle shot, birds eye view' },
      { id: 'below', label: '아래에서', prompt: 'low angle shot, looking up' },
      { id: 'wide', label: '광각', prompt: 'wide angle lens, panoramic view' },
      { id: 'closeup', label: '클로즈업', prompt: 'close-up shot, detailed view' },
    ]
  },
  quality: {
    title: '✨ 품질',
    options: [
      { id: 'highquality', label: '고품질', prompt: 'high quality, best quality' },
      { id: 'detailed', label: '디테일', prompt: 'highly detailed, intricate details' },
      { id: '4k', label: '4K', prompt: '4K resolution, ultra HD' },
      { id: 'dramatic', label: '드라마틱', prompt: 'dramatic lighting, high contrast' },
      { id: 'vibrant', label: '비비드', prompt: 'vibrant colors, saturated' },
    ]
  }
}

// 캐릭터 노드 데이터
export const CHARACTER_NODE_DATA = {
  gender: {
    title: '👤 성별',
    options: [
      { id: 'male', label: '남성', prompt: 'male character, man' },
      { id: 'female', label: '여성', prompt: 'female character, woman' },
      { id: 'boy', label: '소년', prompt: 'young boy, teenage boy' },
      { id: 'girl', label: '소녀', prompt: 'young girl, teenage girl' },
    ]
  },
  age: {
    title: '🎂 나이대',
    options: [
      { id: 'child', label: '어린이', prompt: 'child, 8-12 years old appearance' },
      { id: 'teen', label: '10대', prompt: 'teenager, 13-19 years old appearance' },
      { id: '20s', label: '20대', prompt: '20s, young adult appearance' },
      { id: '30s', label: '30대', prompt: '30s, adult appearance' },
      { id: '40plus', label: '40대+', prompt: '40s or older appearance' },
    ]
  },
  bodyType: {
    title: '💪 체형',
    options: [
      { id: 'slim', label: '마른', prompt: 'slim body, thin build' },
      { id: 'average', label: '보통', prompt: 'average body type, normal build' },
      { id: 'athletic', label: '운동형', prompt: 'athletic body, fit, muscular' },
      { id: 'tall', label: '키큰', prompt: 'tall height, long legs' },
      { id: 'short', label: '키작은', prompt: 'short height, petite' },
    ]
  },
  hairStyle: {
    title: '💇 헤어스타일',
    options: [
      { id: 'short', label: '숏컷', prompt: 'short hair' },
      { id: 'medium', label: '중간길이', prompt: 'medium length hair' },
      { id: 'long', label: '긴머리', prompt: 'long hair' },
      { id: 'ponytail', label: '포니테일', prompt: 'ponytail hairstyle' },
      { id: 'curly', label: '곱슬', prompt: 'curly hair, wavy hair' },
      { id: 'straight', label: '생머리', prompt: 'straight hair, sleek hair' },
    ]
  },
  hairColor: {
    title: '🎨 머리색',
    options: [
      { id: 'black', label: '검정', prompt: 'black hair' },
      { id: 'brown', label: '갈색', prompt: 'brown hair' },
      { id: 'blonde', label: '금발', prompt: 'blonde hair, golden hair' },
      { id: 'white', label: '흰색', prompt: 'white hair, silver hair' },
      { id: 'blue', label: '파랑', prompt: 'blue hair' },
      { id: 'pink', label: '분홍', prompt: 'pink hair' },
    ]
  },
  expression: {
    title: '😄 표정',
    options: [
      { id: 'smile', label: '미소', prompt: 'smiling, happy expression' },
      { id: 'serious', label: '진지', prompt: 'serious expression, stern look' },
      { id: 'angry', label: '화남', prompt: 'angry expression, furious' },
      { id: 'sad', label: '슬픔', prompt: 'sad expression, melancholy' },
      { id: 'surprised', label: '놀람', prompt: 'surprised expression, shocked' },
      { id: 'neutral', label: '무표정', prompt: 'neutral expression, blank face' },
    ]
  },
  pose: {
    title: '🧍 포즈',
    options: [
      { id: 'standing', label: '서있는', prompt: 'standing pose' },
      { id: 'sitting', label: '앉은', prompt: 'sitting pose' },
      { id: 'walking', label: '걷는', prompt: 'walking pose, in motion' },
      { id: 'running', label: '달리는', prompt: 'running pose, sprinting' },
      { id: 'crossed_arms', label: '팔짱', prompt: 'arms crossed pose' },
      { id: 'fighting', label: '전투', prompt: 'fighting pose, action stance' },
    ]
  },
  clothing: {
    title: '👔 의상',
    options: [
      { id: 'casual', label: '캐주얼', prompt: 'casual clothing, everyday wear' },
      { id: 'formal', label: '정장', prompt: 'formal attire, suit, business wear' },
      { id: 'uniform_school', label: '교복', prompt: 'school uniform' },
      { id: 'sporty', label: '스포티', prompt: 'sporty clothing, athletic wear' },
      { id: 'fantasy', label: '판타지', prompt: 'fantasy costume, medieval clothing' },
      { id: 'streetwear', label: '스트릿', prompt: 'streetwear, urban fashion' },
    ]
  },
  characterView: {
    title: '📐 캐릭터 뷰',
    options: [
      { id: 'fullbody', label: '전신', prompt: 'full body shot, head to toe' },
      { id: 'upperbody', label: '상반신', prompt: 'upper body shot, waist up' },
      { id: 'portrait', label: '초상화', prompt: 'portrait, head and shoulders' },
      { id: 'closeup', label: '클로즈업', prompt: 'close-up face shot' },
      { id: 'profile', label: '옆모습', prompt: 'profile view, side portrait' },
    ]
  },
}

// 소품 노드 데이터
export const PROPS_NODE_DATA = {
  weapon: {
    title: '⚔️ 무기',
    options: [
      { id: 'sword', label: '검', prompt: 'sword, blade weapon' },
      { id: 'katana', label: '카타나', prompt: 'katana, japanese sword' },
      { id: 'bow', label: '활', prompt: 'bow and arrow' },
      { id: 'staff', label: '지팡이', prompt: 'magic staff, wizard staff' },
      { id: 'shield', label: '방패', prompt: 'shield, defensive gear' },
    ]
  },
  electronics: {
    title: '📱 전자기기',
    options: [
      { id: 'smartphone', label: '스마트폰', prompt: 'smartphone, mobile phone' },
      { id: 'laptop', label: '노트북', prompt: 'laptop computer' },
      { id: 'camera', label: '카메라', prompt: 'camera, DSLR' },
      { id: 'headphones', label: '헤드폰', prompt: 'headphones, over-ear' },
    ]
  },
  vehicle: {
    title: '🚗 탈것',
    options: [
      { id: 'car', label: '자동차', prompt: 'car, automobile' },
      { id: 'motorcycle', label: '오토바이', prompt: 'motorcycle, motorbike' },
      { id: 'bicycle', label: '자전거', prompt: 'bicycle, bike' },
      { id: 'horse', label: '말', prompt: 'horse, horseback' },
    ]
  },
  food: {
    title: '🍔 음식',
    options: [
      { id: 'coffee', label: '커피', prompt: 'coffee cup, coffee drink' },
      { id: 'burger', label: '햄버거', prompt: 'hamburger, burger' },
      { id: 'ramen', label: '라면', prompt: 'ramen, noodles' },
      { id: 'cake', label: '케이크', prompt: 'cake, dessert' },
    ]
  },
  music: {
    title: '🎸 악기',
    options: [
      { id: 'guitar', label: '기타', prompt: 'guitar, acoustic guitar' },
      { id: 'piano', label: '피아노', prompt: 'piano, keyboard' },
      { id: 'violin', label: '바이올린', prompt: 'violin' },
      { id: 'drums', label: '드럼', prompt: 'drums, drum set' },
    ]
  },
  magicItems: {
    title: '✨ 마법 아이템',
    options: [
      { id: 'crystalball', label: '수정구', prompt: 'crystal ball, fortune telling orb' },
      { id: 'potion', label: '포션', prompt: 'potion bottle, magic potion' },
      { id: 'spellbook', label: '마법서', prompt: 'spellbook, magic tome' },
      { id: 'chest', label: '보물상자', prompt: 'treasure chest' },
    ]
  },
}

// 노드 옵션 타입
export interface NodeOption {
  id: string
  label: string
  prompt: string
}

export interface NodeCategory {
  title: string
  options: NodeOption[]
}

export type NodeData = {
  [key: string]: NodeCategory
}

// 노드 카테고리 색상
export const NODE_COLORS = {
  scene: '#4A90D9',      // 파랑
  character: '#9C27B0',  // 보라
  props: '#FF6B35',      // 주황
}
