import { useState, useCallback, useMemo, useEffect } from 'react'
import { NodeProps, NodeResizer, Handle, Position, useReactFlow } from 'reactflow'
import { AIGeneratorNodeData } from '../types'
import { generateImage, editImage, extractAlpha, loadImageData, imageDataToUrl, MODELS, IMAGE_SIZES, ASPECT_RATIOS } from '../utils/geminiApi'
import type { ImageSize, AspectRatio } from '../utils/geminiApi'

// ==================== 카테고리 및 옵션 데이터 ====================

const CATEGORIES = [
  { id: 'style', name: '스타일', icon: '🎨' },
  { id: 'race', name: '종족', icon: '🧬' },
  { id: 'base', name: '베이스', icon: '👤' },
  { id: 'face', name: '얼굴', icon: '👦' },
  { id: 'hair', name: '머리카락', icon: '💇' },
  { id: 'top', name: '상의', icon: '👕' },
  { id: 'bottom', name: '하의', icon: '👖' },
  { id: 'shoes', name: '신발', icon: '👟' },
  { id: 'accessory', name: '악세서리', icon: '💍' },
  { id: 'weapon', name: '무기', icon: '⚔️' },
  { id: 'pose', name: '포즈', icon: '🏃' },
  { id: 'settings', name: '설정', icon: '⚙️' },
]

// 스타일 옵션 (웹툰, 애니메이션 등)
const STYLE_OPTIONS = [
  { id: 'korean_webtoon', name: '한국 웹툰', desc: '깔끔한 선, 셀 셰이딩' },
  { id: 'japanese_anime', name: '일본 애니메이션', desc: '큰 눈, 선명한 색상' },
  { id: 'ghibli', name: '지브리 스타일', desc: '부드러운 색감, 자연스러운 분위기' },
  { id: 'disney', name: '디즈니/픽사', desc: '3D 느낌의 2D, 생동감 있는 표정' },
  { id: 'manhwa_action', name: '액션 만화', desc: '다이나믹, 강렬한 명암' },
  { id: 'shoujo', name: '소녀만화', desc: '섬세한 선, 꽃/반짝임 효과' },
  { id: 'chibi', name: '치비/SD', desc: '2~3등신, 귀여운 과장' },
  { id: 'semi_realistic', name: '세미 리얼', desc: '사실적이지만 만화적 요소' },
  { id: 'watercolor', name: '수채화', desc: '부드러운 색 번짐, 투명감' },
  { id: 'flat_design', name: '플랫 디자인', desc: '단순화된 형태, 그래픽적' },
]

// 종족 옵션
const RACE_OPTIONS = [
  { id: 'human', name: '인간', features: '' },
  { id: 'elf', name: '엘프', features: 'pointed elf ears, elegant features' },
  { id: 'dark_elf', name: '다크엘프', features: 'pointed elf ears, dark skin, white hair' },
  { id: 'dwarf', name: '드워프', features: 'short and stocky build, thick beard' },
  { id: 'orc', name: '오크', features: 'green skin, tusks, muscular build' },
  { id: 'vampire', name: '뱀파이어', features: 'pale skin, red eyes, fangs' },
  { id: 'demon', name: '악마', features: 'horns, red or dark skin, demonic features' },
  { id: 'angel', name: '천사', features: 'white wings, glowing halo, divine aura' },
  { id: 'beastkin_cat', name: '수인(고양이)', features: 'cat ears, cat tail, slit pupils' },
  { id: 'beastkin_wolf', name: '수인(늑대)', features: 'wolf ears, wolf tail, sharp canines' },
  { id: 'beastkin_fox', name: '수인(여우)', features: 'fox ears, fluffy fox tail' },
  { id: 'beastkin_rabbit', name: '수인(토끼)', features: 'long rabbit ears, fluffy tail' },
  { id: 'dragon_hybrid', name: '용인', features: 'dragon horns, dragon tail, scales on skin' },
  { id: 'fairy', name: '요정', features: 'small wings, glowing aura, delicate features' },
  { id: 'robot', name: '로봇/안드로이드', features: 'mechanical parts, glowing eyes, metallic skin' },
]

const OPTIONS_DATA: Record<string, Record<string, string[] | Record<string, string[]>>> = {
  base: {
    gender: ['남성', '여성', '중성'],
    bodyType: ['마름', '보통', '건장', '근육질', '통통', '글래머'],
    height: ['3등신', '5등신', '6등신', '7등신', '8등신'],
    age: ['어린이', '10대', '20대', '30대', '40대+', '노인'],
  },
  face: {
    style: ['날카로운', '부드러운', '귀여운', '강인한', '차가운', '따뜻한', '신비로운', '무표정', '장난기'],
    eyes: ['큰 눈', '작은 눈', '날카로운 눈', '처진 눈', '올라간 눈', '반짝이는 눈', '무기력한 눈'],
    skinTone: ['밝은', '보통', '어두운', '창백한', '황금빛', '올리브'],
    expression: ['무표정', '미소', '웃음', '진지', '화남', '슬픔', '놀람'],
  },
  hair: {
    style: ['짧은 머리', '단발', '중발', '장발', '포니테일', '트윈테일', '땋은머리', '올림머리', '덮은머리', '대머리', '스파이키'],
    color: ['검정', '갈색', '금발', '빨강', '파랑', '은색', '분홍', '초록', '보라', '흰색', '그라데이션'],
    texture: ['직모', '웨이브', '곱슬', '뻣뻣한'],
  },
  top: {
    category: ['일상', '정장', '전투', '판타지', '학교', '전통', 'SF'],
    items: {
      '일상': ['티셔츠', '셔츠', '후드티', '니트', '자켓', '크롭탑', '탱크탑'],
      '정장': ['정장 상의', '조끼', '블라우스', '턱시도'],
      '전투': ['전투복', '갑옷', '가죽 아머', '검은 코트', '군복'],
      '판타지': ['로브', '망토', '마법사 복', '성직자복', '기사갑옷'],
      '학교': ['교복 상의', '체육복', '세일러복'],
      '전통': ['한복 저고리', '기모노', '치파오', '사리'],
      'SF': ['우주복', '사이버 아머', '홀로그램 슈트'],
    },
  },
  bottom: {
    category: ['일상', '정장', '전투', '판타지', '학교', '전통', 'SF'],
    items: {
      '일상': ['청바지', '면바지', '반바지', '치마', '레깅스', '조거팬츠'],
      '정장': ['정장 바지', '정장 치마', '슬랙스'],
      '전투': ['전투 바지', '갑옷 하의', '군용 바지'],
      '판타지': ['로브 하의', '판타지 치마', '기사 하의'],
      '학교': ['교복 바지', '교복 치마', '플리츠 스커트'],
      '전통': ['한복 치마', '한복 바지', '하카마'],
      'SF': ['우주복 하의', '사이버 레깅스', '홀로그램 팬츠'],
    },
  },
  shoes: {
    item: ['운동화', '구두', '부츠', '샌들', '슬리퍼', '맨발', '전투화', '하이힐', '로퍼', '사이버 부츠'],
  },
  accessory: {
    head: ['없음', '모자', '왕관', '머리띠', '안경', '선글라스', '귀걸이', '헤드셋', '후드', '베레모', '리본'],
    neck: ['없음', '목걸이', '스카프', '넥타이', '초커', '보타이', '망토'],
    hands: ['없음', '반지', '장갑', '팔찌', '시계', '건틀릿', '붕대'],
    other: ['없음', '가방', '배낭', '날개', '꼬리', '벨트', '어깨보호대', '홀스터'],
  },
  weapon: {
    category: ['없음', '검/도', '창/봉', '활/총', '마법', '현대무기', '기타'],
    items: {
      '검/도': ['장검', '단검', '대검', '이도류', '카타나', '레이피어', '세이버'],
      '창/봉': ['창', '봉', '삼지창', '할버드', '낫창'],
      '활/총': ['활', '석궁', '권총', '라이플', '기관총'],
      '마법': ['지팡이', '마법봉', '오브', '마법책', '룬문양'],
      '현대무기': ['권총', '소총', '샷건', 'SMG', '스나이퍼'],
      '기타': ['방패', '도끼', '낫', '채찍', '해머', '너클'],
    },
    position: ['오른손', '왼손', '양손', '등에', '허리에'],
  },
  pose: {
    angle: ['정면', '측면', '후면', '3/4 앵글'],
  },
}

// 해상도 옵션 (대문자 K 필수 - Gemini API 공식 문서 기준)
const RESOLUTION_OPTIONS = [
  { id: '1K', name: '1K (1024px)', size: 1024 },
  { id: '2K', name: '2K (2048px)', size: 2048 },
  { id: '4K', name: '4K (4096px)', size: 4096 },
]

// 종횡비 옵션
const ASPECT_RATIO_OPTIONS = [
  { id: '16:9', name: '16:9 (가로)', width: 16, height: 9 },
  { id: '1:1', name: '1:1 (정사각)', width: 1, height: 1 },
  { id: '9:16', name: '9:16 (세로)', width: 9, height: 16 },
]

// MODELS는 utils/geminiApi.ts에서 import

// 기본 캐릭터 데이터
const DEFAULT_CHARACTER = {
  style: { artStyle: 'korean_webtoon' },
  race: { type: 'human' },
  base: { gender: '남성', bodyType: '보통', height: '7등신', age: '20대' },
  face: { style: '날카로운', eyes: '날카로운 눈', skinTone: '보통', expression: '무표정' },
  hair: { style: '단발', color: '검정', texture: '직모' },
  top: { category: '일상', item: '티셔츠' },
  bottom: { category: '일상', item: '청바지' },
  shoes: { item: '운동화' },
  accessory: { head: '없음', neck: '없음', hands: '없음', other: '없음' },
  weapon: { category: '없음', item: '', position: '오른손' },
  pose: { angle: '정면' },
}

// 어셋 라이브러리 이벤트
const emitAssetAdd = (asset: { url: string; prompt: string; timestamp: number }) => {
  window.dispatchEvent(new CustomEvent('asset-add', { detail: asset }))
}

// ==================== 메인 컴포넌트 ====================

export function AIGeneratorNode({ data, selected, id }: NodeProps<AIGeneratorNodeData>) {
  const { setNodes } = useReactFlow()

  // API 설정
  const [apiKey, setApiKey] = useState(data.apiKey || '')
  const [model, setModel] = useState(data.model || MODELS[0].id)
  const [showApiKey, setShowApiKey] = useState(false)

  // 캐릭터 설정
  const [character, setCharacter] = useState<typeof DEFAULT_CHARACTER>(
    data.character || DEFAULT_CHARACTER
  )
  const [selectedCategory, setSelectedCategory] = useState('base')

  // UI 상태
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; prompt: string }>>([])
  const [generateTransparent, setGenerateTransparent] = useState(true) // 투명 배경 생성 옵션
  const [generationStatus, setGenerationStatus] = useState('')
  const [resolution, setResolution] = useState('2K') // 해상도 (대문자 K)
  const [aspectRatio, setAspectRatio] = useState('1:1') // 종횡비 (캐릭터는 정사각형 추천)
  const [copied, setCopied] = useState(false) // 프롬프트 복사 상태
  // 직접 프롬프트 입력 모드
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')

  // 노드 데이터 업데이트 (API 키와 모델만 저장 - 이미지는 메모리에만)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              apiKey,
              model,
              // 주의: 이미지 base64는 저장하지 않음 (localStorage 용량 초과 방지)
            },
          }
        }
        return n
      })
    )
  }, [apiKey, model, id, setNodes])

  // ==================== 프롬프트 자동 생성 ====================

  // 스타일별 프롬프트
  const stylePrompts: Record<string, string> = {
    korean_webtoon: 'Korean webtoon style, clean bold outlines, cel-shaded coloring, vibrant colors',
    japanese_anime: 'Japanese anime style, big expressive eyes, detailed hair, vibrant saturated colors',
    ghibli: 'Studio Ghibli style, soft watercolor-like colors, gentle lighting, whimsical atmosphere',
    disney: 'Disney/Pixar style, 3D-like 2D rendering, expressive features, polished look',
    manhwa_action: 'Action manhwa style, dynamic shading, sharp contrasts, intense dramatic lighting',
    shoujo: 'Shoujo manga style, delicate linework, sparkles and flower effects, soft pastel colors',
    chibi: 'Chibi/SD style, 2-3 head tall proportions, oversized head, cute exaggerated features',
    semi_realistic: 'Semi-realistic style, detailed anatomy with stylized features, subtle shading',
    watercolor: 'Watercolor illustration style, soft color bleeding, transparent layers, artistic texture',
    flat_design: 'Flat design style, minimal shading, bold graphic shapes, limited color palette',
  }

  // 한국어 → 영어 변환 맵 (대폭 확장)
  const translations: Record<string, Record<string, string>> = {
    gender: { '남성': 'male', '여성': 'female', '중성': 'androgynous' },
    bodyType: { '마름': 'slim', '보통': 'average', '건장': 'athletic', '근육질': 'muscular', '통통': 'chubby', '글래머': 'curvy' },
    height: { '3등신': '3 head tall chibi', '5등신': '5 head tall', '6등신': '6 head tall', '7등신': '7 head tall', '8등신': '8 head tall realistic proportions' },
    age: { '어린이': 'child', '10대': 'teenager', '20대': 'young adult in 20s', '30대': 'adult in 30s', '40대+': 'middle-aged', '노인': 'elderly' },
    faceStyle: { '날카로운': 'sharp angular', '부드러운': 'soft gentle', '귀여운': 'cute round', '강인한': 'strong determined', '차가운': 'cold aloof', '따뜻한': 'warm friendly', '신비로운': 'mysterious ethereal', '무표정': 'stoic expressionless', '장난기': 'playful mischievous' },
    eyes: { '큰 눈': 'large expressive eyes', '작은 눈': 'small narrow eyes', '날카로운 눈': 'sharp piercing eyes', '처진 눈': 'droopy gentle eyes', '올라간 눈': 'upturned fox eyes', '반짝이는 눈': 'sparkling bright eyes', '무기력한 눈': 'tired half-lidded eyes' },
    skinTone: { '밝은': 'fair pale skin', '보통': 'medium skin tone', '어두운': 'dark skin', '창백한': 'very pale ghostly skin', '황금빛': 'golden tan skin', '올리브': 'olive skin tone' },
    expression: { '무표정': 'neutral expression', '미소': 'gentle smile', '웃음': 'laughing happily', '진지': 'serious expression', '화남': 'angry scowling', '슬픔': 'sad melancholic', '놀람': 'surprised shocked' },
    hairStyle: { '짧은 머리': 'very short hair', '단발': 'short bob hair', '중발': 'medium length hair', '장발': 'long flowing hair', '포니테일': 'ponytail', '트윈테일': 'twin tails pigtails', '땋은머리': 'braided hair', '올림머리': 'updo bun', '덮은머리': 'hair covering one eye', '대머리': 'bald', '스파이키': 'spiky messy hair' },
    hairColor: { '검정': 'black', '갈색': 'brown', '금발': 'blonde golden', '빨강': 'red crimson', '파랑': 'blue', '은색': 'silver gray', '분홍': 'pink', '초록': 'green', '보라': 'purple violet', '흰색': 'white', '그라데이션': 'gradient ombre colored' },
    hairTexture: { '직모': 'straight', '웨이브': 'wavy', '곱슬': 'curly', '뻣뻣한': 'stiff spiky' },
    angle: { '정면': 'front view', '측면': 'side profile view', '후면': 'back view', '3/4 앵글': 'three-quarter view' },
    // 의상 (확장)
    top: { '티셔츠': 't-shirt', '셔츠': 'button-up shirt', '후드티': 'hoodie', '니트': 'knit sweater', '자켓': 'jacket', '크롭탑': 'crop top', '탱크탑': 'tank top', '정장 상의': 'suit jacket blazer', '조끼': 'vest', '블라우스': 'blouse', '턱시도': 'tuxedo', '전투복': 'tactical combat uniform', '갑옷': 'plate armor', '가죽 아머': 'leather armor', '검은 코트': 'long black coat', '군복': 'military uniform', '로브': 'wizard robe', '망토': 'hooded cape', '마법사 복': 'mage robes', '성직자복': 'priest robes', '기사갑옷': 'knight full armor', '교복 상의': 'school uniform blazer', '체육복': 'gym clothes', '세일러복': 'sailor uniform', '한복 저고리': 'hanbok jeogori', '기모노': 'japanese kimono', '치파오': 'chinese cheongsam', '사리': 'indian sari', '우주복': 'space suit', '사이버 아머': 'cyberpunk armor', '홀로그램 슈트': 'holographic bodysuit' },
    bottom: { '청바지': 'blue jeans', '면바지': 'cotton pants', '반바지': 'shorts', '치마': 'skirt', '레깅스': 'leggings', '조거팬츠': 'jogger pants', '정장 바지': 'dress pants', '정장 치마': 'pencil skirt', '슬랙스': 'slacks', '전투 바지': 'tactical combat pants', '갑옷 하의': 'armored leg guards', '군용 바지': 'military cargo pants', '로브 하의': 'long robe skirt', '판타지 치마': 'fantasy layered skirt', '기사 하의': 'knight leg armor', '교복 바지': 'school uniform pants', '교복 치마': 'school uniform skirt', '플리츠 스커트': 'pleated skirt', '한복 치마': 'hanbok chima skirt', '한복 바지': 'hanbok baji pants', '하카마': 'japanese hakama', '우주복 하의': 'space suit pants', '사이버 레깅스': 'cyber leggings', '홀로그램 팬츠': 'holographic pants' },
    shoes: { '운동화': 'sneakers', '구두': 'dress shoes', '부츠': 'boots', '샌들': 'sandals', '슬리퍼': 'slippers', '맨발': 'barefoot', '전투화': 'combat boots', '하이힐': 'high heels', '로퍼': 'loafers', '사이버 부츠': 'cyberpunk boots' },
    accessory: { '없음': '', '모자': 'hat cap', '왕관': 'royal crown', '머리띠': 'headband', '안경': 'glasses', '선글라스': 'sunglasses', '귀걸이': 'earrings', '헤드셋': 'headset headphones', '후드': 'hood up', '베레모': 'beret', '리본': 'hair ribbon bow', '목걸이': 'necklace pendant', '스카프': 'scarf', '넥타이': 'necktie', '초커': 'choker collar', '보타이': 'bow tie', '망토': 'flowing cape', '반지': 'ring', '장갑': 'gloves', '팔찌': 'bracelet', '시계': 'wristwatch', '건틀릿': 'armored gauntlets', '붕대': 'wrapped bandages', '가방': 'shoulder bag', '배낭': 'backpack', '날개': 'wings', '꼬리': 'tail', '벨트': 'utility belt', '어깨보호대': 'shoulder pads pauldrons', '홀스터': 'weapon holster' },
    weapon: { '장검': 'longsword', '단검': 'dagger', '대검': 'greatsword claymore', '이도류': 'dual wielding swords', '카타나': 'japanese katana', '레이피어': 'rapier', '세이버': 'saber', '창': 'spear lance', '봉': 'bo staff', '삼지창': 'trident', '할버드': 'halberd', '낫창': 'scythe polearm', '활': 'bow and arrow', '석궁': 'crossbow', '권총': 'pistol handgun', '라이플': 'rifle', '기관총': 'machine gun', '지팡이': 'magic staff', '마법봉': 'magic wand', '오브': 'magical orb', '마법책': 'spellbook grimoire', '룬문양': 'glowing runes', '소총': 'assault rifle', '샷건': 'shotgun', 'SMG': 'submachine gun', '스나이퍼': 'sniper rifle', '방패': 'shield', '도끼': 'battle axe', '낫': 'scythe', '채찍': 'whip', '해머': 'war hammer', '너클': 'brass knuckles' },
  }

  const t = (category: string, value: string): string => {
    return translations[category]?.[value] || value
  }

  const generatedPrompt = useMemo(() => {
    // 스타일 프롬프트
    const artStyle = character.style?.artStyle || 'korean_webtoon'
    const styleDesc = stylePrompts[artStyle] || stylePrompts.korean_webtoon

    // 종족 특성
    const raceType = character.race?.type || 'human'
    const raceData = RACE_OPTIONS.find(r => r.id === raceType)
    const raceFeatures = raceData?.features || ''

    // 기본 속성
    const gender = t('gender', character.base.gender)
    const angle = t('angle', character.pose.angle)
    const bodyType = t('bodyType', character.base.bodyType)
    const height = t('height', character.base.height)
    const age = t('age', character.base.age)

    // 얼굴
    const faceStyle = t('faceStyle', character.face.style)
    const eyes = t('eyes', character.face.eyes)
    const skinTone = t('skinTone', character.face.skinTone)
    const expression = t('expression', character.face.expression || '무표정')

    // 머리카락
    const hairColor = t('hairColor', character.hair.color)
    const hairStyle = t('hairStyle', character.hair.style)
    const hairTexture = t('hairTexture', character.hair.texture || '직모')

    // 의상
    const topItem = t('top', character.top.item)
    const bottomItem = t('bottom', character.bottom.item)
    const shoesItem = t('shoes', character.shoes.item)
    const outfit = [topItem, bottomItem, shoesItem].filter(Boolean).join(', ')

    // 악세서리
    const accItems = [
      t('accessory', character.accessory.head),
      t('accessory', character.accessory.neck),
      t('accessory', character.accessory.hands),
      t('accessory', character.accessory.other),
    ].filter(Boolean)
    const acc = accItems.length > 0 ? accItems.join(', ') : ''

    // 무기
    const weaponItem = character.weapon.category !== '없음' && character.weapon.item
      ? `holding ${t('weapon', character.weapon.item)} in ${character.weapon.position === '양손' ? 'both hands' : character.weapon.position === '오른손' ? 'right hand' : character.weapon.position === '왼손' ? 'left hand' : character.weapon.position === '등에' ? 'on back' : 'at waist'}`
      : ''

    // 디테일한 프롬프트 생성
    return `A single ${gender} ${raceData?.name !== '인간' ? raceData?.name + ' ' : ''}character illustration on pure white #FFFFFF background.

Character Details:
- Full body shot from head to toe, ${angle}, standing pose
- ${age}, ${bodyType} build, ${height}
- ${faceStyle} face with ${eyes}, ${skinTone}, ${expression}
${raceFeatures ? `- Race features: ${raceFeatures}` : ''}

Hair: ${hairColor} ${hairTexture} ${hairStyle}

Outfit: ${outfit || 'casual clothes'}${acc ? `\nAccessories: ${acc}` : ''}${weaponItem ? `\nWeapon: ${weaponItem}` : ''}

Art Style: ${styleDesc}
Background: solid pure white #FFFFFF, no shadows, no gradients, no other elements, clean isolated character.
Important: Only ONE character, full body clearly visible, white background only.`
  }, [character])

  // ==================== 카테고리별 업데이트 함수 ====================

  const updateCharacter = useCallback(
    (category: string, field: string, value: string) => {
      setCharacter((prev) => ({
        ...prev,
        [category]: {
          ...prev[category as keyof typeof prev],
          [field]: value,
        },
      }))
    },
    []
  )

  // ==================== AI 이미지 생성 ====================
  // 공통 API 함수는 utils/geminiApi.ts 사용

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('⚙️ 설정에서 API 키를 입력하세요')
      return
    }

    // 직접 프롬프트 모드일 때 유효성 검사
    if (useCustomPrompt && !customPrompt.trim()) {
      setError('⚠️ 프롬프트를 입력하세요')
      return
    }

    setIsGenerating(true)
    setError('')
    setGenerationStatus('')

    // 최종 프롬프트 결정 (직접 입력 또는 자동 생성)
    let finalPrompt = useCustomPrompt ? customPrompt.trim() : generatedPrompt

    // 직접 프롬프트 모드에서 투명 배경 선택 시 흰배경 지시 추가
    if (useCustomPrompt && generateTransparent) {
      finalPrompt += '\n\nBackground: solid pure white #FFFFFF, no shadows, no gradients, clean isolated subject.'
    }

    try {
      // 1단계: 흰배경 이미지 생성 (해상도/종횡비 옵션 포함)
      setGenerationStatus('1/3 흰배경 이미지 생성 중...')
      const imageOptions = {
        aspectRatio: aspectRatio as AspectRatio,
        imageSize: resolution as ImageSize,
      }
      const whiteResult = await generateImage(apiKey, finalPrompt, model, imageOptions)

      // 투명 배경 생성이 꺼져있으면 여기서 끝
      if (!generateTransparent) {
        const newImage = { url: whiteResult.url, prompt: finalPrompt.slice(0, 50) + '...' }
        setGeneratedImages((prev) => [newImage, ...prev].slice(0, 20))
        emitAssetAdd({ url: whiteResult.url, prompt: finalPrompt, timestamp: Date.now() })
        setGenerationStatus('✅ 완료!')
        return
      }

      // 2단계: 흰배경 이미지 크기 확인
      const whiteData = await loadImageData(whiteResult.url)
      const whiteSize = { width: whiteData.width, height: whiteData.height }
      console.log(`[AIGeneratorNode] 흰배경 이미지 크기: ${whiteSize.width}x${whiteSize.height}`)

      // 3단계: 같은 크기로 검정배경 편집
      setGenerationStatus('2/3 검정배경으로 변환 중...')
      const blackResult = await editImage(
        apiKey,
        whiteResult.base64,
        `Change ONLY the background color from white to pure black #000000. Keep the exact same image size (${whiteSize.width}x${whiteSize.height}). Do NOT modify, redraw, or change the character in any way. Keep the exact same character, pose, clothing, and details. Only replace the white background with black.`,
        model
      )

      // 4단계: 두 이미지 비교해서 알파 추출
      setGenerationStatus('3/3 투명 배경 생성 중...')
      const blackData = await loadImageData(blackResult.url)
      console.log(`[AIGeneratorNode] 검정배경 이미지 크기: ${blackData.width}x${blackData.height}`)

      const resultData = extractAlpha(whiteData, blackData)
      const transparentUrl = imageDataToUrl(resultData)

      const newImage = { url: transparentUrl, prompt: finalPrompt.slice(0, 50) + '...' }
      setGeneratedImages((prev) => [newImage, ...prev].slice(0, 20))
      emitAssetAdd({ url: transparentUrl, prompt: finalPrompt, timestamp: Date.now() })
      setGenerationStatus('✅ 투명 배경 완료!')

      if (data.onGenerate) {
        data.onGenerate(transparentUrl, finalPrompt.slice(0, 30) + '...')
      }
    } catch (err) {
      console.error('이미지 생성 오류:', err)
      setError(err instanceof Error ? err.message : '생성 실패')
      setGenerationStatus('')
    } finally {
      setIsGenerating(false)
    }
  }

  // ==================== 설정 패널 렌더링 ====================

  const renderSettingsPanel = () => {
    const cat = selectedCategory

    // 설정 카테고리
    if (cat === 'settings') {
      return (
        <div className="char-settings-panel">
          <h4>⚙️ API 설정</h4>
          <div className="setting-group">
            <label>API 키</label>
            <div className="api-key-row">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Google AI API 키 입력..."
              />
              <button onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="setting-group">
            <label>AI 모델</label>
            <div style={{ padding: '8px 12px', background: '#f0f0f0', borderRadius: 6, fontSize: 13 }}>
              🤖 {MODELS[0].name}
            </div>
          </div>
          <div className="setting-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={generateTransparent}
                onChange={(e) => setGenerateTransparent(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>🎭 투명 배경으로 생성</span>
            </label>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0 26px' }}>
              {generateTransparent
                ? '흰배경 → 검정배경 변환 → 알파 추출 (API 2회 호출)'
                : '흰배경 이미지만 생성 (API 1회 호출)'}
            </p>
          </div>
          <div className="setting-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useCustomPrompt}
                onChange={(e) => setUseCustomPrompt(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>✏️ 직접 프롬프트 입력</span>
            </label>
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0 26px' }}>
              {useCustomPrompt
                ? '캐릭터 설정 대신 직접 프롬프트를 입력합니다'
                : '캐릭터 설정으로 자동 프롬프트 생성'}
            </p>
            {useCustomPrompt && (
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="생성할 이미지를 설명하세요... (예: A cute anime girl with pink hair, wearing a school uniform)"
                style={{
                  width: '100%',
                  height: 120,
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  resize: 'vertical',
                  fontSize: 12,
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
            )}
          </div>
          <div className="setting-group">
            <label>📐 해상도</label>
            <div className="option-buttons">
              {RESOLUTION_OPTIONS.map((res) => (
                <button
                  key={res.id}
                  className={resolution === res.id ? 'active' : ''}
                  onClick={() => setResolution(res.id)}
                >
                  {res.name}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-group">
            <label>📏 종횡비</label>
            <div className="option-buttons">
              {ASPECT_RATIO_OPTIONS.map((ar) => (
                <button
                  key={ar.id}
                  className={aspectRatio === ar.id ? 'active' : ''}
                  onClick={() => setAspectRatio(ar.id)}
                >
                  {ar.name}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-group">
            <label>캐릭터 초기화</label>
            <button
              className="reset-btn"
              onClick={() => setCharacter(DEFAULT_CHARACTER)}
            >
              🔄 기본값으로 초기화
            </button>
          </div>
          <div className="setting-group api-help">
            <p>💡 Google AI Studio에서 API 키를 발급받으세요</p>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              API 키 발급하기 →
            </a>
          </div>
        </div>
      )
    }

    // 스타일 카테고리
    if (cat === 'style') {
      return (
        <div className="char-settings-panel">
          <h4>🎨 아트 스타일</h4>
          <div className="style-grid">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.id}
                className={`style-card ${character.style?.artStyle === style.id ? 'active' : ''}`}
                onClick={() => setCharacter(prev => ({
                  ...prev,
                  style: { ...prev.style, artStyle: style.id }
                }))}
              >
                <span className="style-name">{style.name}</span>
                <span className="style-desc">{style.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    // 종족 카테고리
    if (cat === 'race') {
      return (
        <div className="char-settings-panel">
          <h4>🧬 종족 선택</h4>
          <div className="race-grid">
            {RACE_OPTIONS.map((race) => (
              <button
                key={race.id}
                className={`race-card ${character.race?.type === race.id ? 'active' : ''}`}
                onClick={() => setCharacter(prev => ({
                  ...prev,
                  race: { ...prev.race, type: race.id }
                }))}
              >
                <span className="race-name">{race.name}</span>
                {race.features && <span className="race-features">{race.features.split(',')[0]}</span>}
              </button>
            ))}
          </div>
        </div>
      )
    }

    const opts = OPTIONS_DATA[cat]
    if (!opts) return null

    switch (cat) {
      case 'base':
        return (
          <div className="char-settings-panel">
            <h4>👤 베이스 설정</h4>
            <div className="setting-group">
              <label>성별</label>
              <div className="option-buttons">
                {(opts.gender as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.base.gender === opt ? 'active' : ''}
                    onClick={() => updateCharacter('base', 'gender', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>체형</label>
              <div className="option-buttons">
                {(opts.bodyType as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.base.bodyType === opt ? 'active' : ''}
                    onClick={() => updateCharacter('base', 'bodyType', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>등신</label>
              <div className="option-buttons">
                {(opts.height as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.base.height === opt ? 'active' : ''}
                    onClick={() => updateCharacter('base', 'height', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>연령대</label>
              <div className="option-buttons">
                {(opts.age as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.base.age === opt ? 'active' : ''}
                    onClick={() => updateCharacter('base', 'age', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'face':
        return (
          <div className="char-settings-panel">
            <h4>👦 얼굴 설정</h4>
            <div className="setting-group">
              <label>스타일</label>
              <div className="option-buttons">
                {(opts.style as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.face.style === opt ? 'active' : ''}
                    onClick={() => updateCharacter('face', 'style', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>눈</label>
              <div className="option-buttons">
                {(opts.eyes as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.face.eyes === opt ? 'active' : ''}
                    onClick={() => updateCharacter('face', 'eyes', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>피부톤</label>
              <div className="option-buttons">
                {(opts.skinTone as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.face.skinTone === opt ? 'active' : ''}
                    onClick={() => updateCharacter('face', 'skinTone', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>표정</label>
              <div className="option-buttons">
                {(opts.expression as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.face.expression === opt ? 'active' : ''}
                    onClick={() => updateCharacter('face', 'expression', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'hair':
        return (
          <div className="char-settings-panel">
            <h4>💇 머리카락 설정</h4>
            <div className="setting-group">
              <label>스타일</label>
              <div className="option-buttons">
                {(opts.style as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.hair.style === opt ? 'active' : ''}
                    onClick={() => updateCharacter('hair', 'style', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>색상</label>
              <div className="option-buttons">
                {(opts.color as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.hair.color === opt ? 'active' : ''}
                    onClick={() => updateCharacter('hair', 'color', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>질감</label>
              <div className="option-buttons">
                {(opts.texture as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.hair.texture === opt ? 'active' : ''}
                    onClick={() => updateCharacter('hair', 'texture', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'top':
        const topItems = (opts.items as Record<string, string[]>)[character.top.category] || []
        return (
          <div className="char-settings-panel">
            <h4>👕 상의 설정</h4>
            <div className="setting-group">
              <label>카테고리</label>
              <div className="option-buttons">
                {(opts.category as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.top.category === opt ? 'active' : ''}
                    onClick={() => {
                      updateCharacter('top', 'category', opt)
                      const items = (OPTIONS_DATA.top.items as Record<string, string[]>)[opt]
                      if (items && items.length > 0) {
                        updateCharacter('top', 'item', items[0])
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>아이템</label>
              <div className="option-buttons">
                {topItems.map((opt) => (
                  <button
                    key={opt}
                    className={character.top.item === opt ? 'active' : ''}
                    onClick={() => updateCharacter('top', 'item', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'bottom':
        const bottomItems = (opts.items as Record<string, string[]>)[character.bottom.category] || []
        return (
          <div className="char-settings-panel">
            <h4>👖 하의 설정</h4>
            <div className="setting-group">
              <label>카테고리</label>
              <div className="option-buttons">
                {(opts.category as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.bottom.category === opt ? 'active' : ''}
                    onClick={() => {
                      updateCharacter('bottom', 'category', opt)
                      const items = (OPTIONS_DATA.bottom.items as Record<string, string[]>)[opt]
                      if (items && items.length > 0) {
                        updateCharacter('bottom', 'item', items[0])
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>아이템</label>
              <div className="option-buttons">
                {bottomItems.map((opt) => (
                  <button
                    key={opt}
                    className={character.bottom.item === opt ? 'active' : ''}
                    onClick={() => updateCharacter('bottom', 'item', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'shoes':
        return (
          <div className="char-settings-panel">
            <h4>👟 신발 설정</h4>
            <div className="setting-group">
              <label>신발</label>
              <div className="option-buttons">
                {(opts.item as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.shoes.item === opt ? 'active' : ''}
                    onClick={() => updateCharacter('shoes', 'item', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'accessory':
        return (
          <div className="char-settings-panel">
            <h4>💍 악세서리 설정</h4>
            <div className="setting-group">
              <label>머리</label>
              <div className="option-buttons">
                {(opts.head as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.accessory.head === opt ? 'active' : ''}
                    onClick={() => updateCharacter('accessory', 'head', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>목</label>
              <div className="option-buttons">
                {(opts.neck as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.accessory.neck === opt ? 'active' : ''}
                    onClick={() => updateCharacter('accessory', 'neck', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>손</label>
              <div className="option-buttons">
                {(opts.hands as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.accessory.hands === opt ? 'active' : ''}
                    onClick={() => updateCharacter('accessory', 'hands', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>기타</label>
              <div className="option-buttons">
                {(opts.other as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.accessory.other === opt ? 'active' : ''}
                    onClick={() => updateCharacter('accessory', 'other', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'weapon':
        const weaponItems =
          character.weapon.category !== '없음'
            ? (opts.items as Record<string, string[]>)[character.weapon.category] || []
            : []
        return (
          <div className="char-settings-panel">
            <h4>⚔️ 무기 설정</h4>
            <div className="setting-group">
              <label>카테고리</label>
              <div className="option-buttons">
                {(opts.category as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.weapon.category === opt ? 'active' : ''}
                    onClick={() => {
                      updateCharacter('weapon', 'category', opt)
                      if (opt !== '없음') {
                        const items = (OPTIONS_DATA.weapon.items as Record<string, string[]>)[opt]
                        if (items && items.length > 0) {
                          updateCharacter('weapon', 'item', items[0])
                        }
                      } else {
                        updateCharacter('weapon', 'item', '')
                      }
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {character.weapon.category !== '없음' && (
              <>
                <div className="setting-group">
                  <label>무기</label>
                  <div className="option-buttons">
                    {weaponItems.map((opt) => (
                      <button
                        key={opt}
                        className={character.weapon.item === opt ? 'active' : ''}
                        onClick={() => updateCharacter('weapon', 'item', opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="setting-group">
                  <label>위치</label>
                  <div className="option-buttons">
                    {(opts.position as string[]).map((opt) => (
                      <button
                        key={opt}
                        className={character.weapon.position === opt ? 'active' : ''}
                        onClick={() => updateCharacter('weapon', 'position', opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )

      case 'pose':
        return (
          <div className="char-settings-panel">
            <h4>🏃 포즈 설정</h4>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              기본 스탠딩 포즈로 고정, 각도만 선택 가능
            </p>
            <div className="setting-group">
              <label>각도 (전신 스탠딩 포즈)</label>
              <div className="option-buttons">
                {(opts.angle as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={character.pose.angle === opt ? 'active' : ''}
                    onClick={() => updateCharacter('pose', 'angle', opt)}
                  >
                    {opt === '정면' ? '👤 정면' : opt === '측면' ? '👤 측면' : '👤 후면'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ==================== 렌더링 ====================

  return (
    <div className={`ai-generator-node-v2 ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="ref-in" />
      <NodeResizer isVisible={selected} minWidth={800} minHeight={600} />

      {/* 헤더 */}
      <div className="aig-header">
        <span>🎨 캐릭터 메이커</span>
        <span className="aig-model-badge">{MODELS.find(m => m.id === model)?.name || model}</span>
      </div>

      <div className="aig-body nodrag" onMouseDown={(e) => e.stopPropagation()}>
        <div className="aig-main-layout">
          {/* 왼쪽: 카테고리 목록 */}
          <div className="aig-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`aig-category-btn ${selectedCategory === cat.id ? 'active' : ''} ${cat.id === 'settings' ? 'settings-btn' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* 중앙: 설정 패널 */}
          <div className="aig-settings-content">{renderSettingsPanel()}</div>

          {/* 오른쪽: 생성된 이미지 갤러리 */}
          <div className="aig-gallery-sidebar">
            <div className="gallery-header">
              <span>📸 결과</span>
              {generatedImages.length > 0 && (
                <button className="clear-btn" onClick={() => setGeneratedImages([])}>
                  🗑️
                </button>
              )}
            </div>
            <div className="gallery-scroll">
              {generatedImages.length === 0 ? (
                <div className="gallery-empty">
                  <p>생성된 이미지가<br/>여기에 표시됩니다</p>
                </div>
              ) : (
                generatedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="gallery-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'asset',
                        url: img.url,
                        prompt: img.prompt
                      }))
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                  >
                    <img
                      src={img.url}
                      alt={`생성 ${idx + 1}`}
                      onClick={() => window.open(img.url, '_blank')}
                      title={img.prompt}
                      draggable={false}
                    />
                    <div className="gallery-item-actions">
                      <button
                        className="action-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(img.prompt || '')
                          alert('프롬프트가 복사되었습니다!')
                        }}
                        title="프롬프트 복사"
                      >
                        📋
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = img.url
                          link.download = `character-${Date.now()}.png`
                          link.click()
                        }}
                        title="다운로드"
                      >
                        ⬇️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 프롬프트 미리보기 */}
        <div className="aig-prompt-preview">
          <div className="prompt-header">
            <label>🤖 자동 생성 프롬프트</label>
            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(generatedPrompt)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? '✅ 복사됨!' : '📋 복사'}
            </button>
          </div>
          <p>{generatedPrompt}</p>
        </div>

        {/* 에러 */}
        {error && <div className="aig-error">{error}</div>}

        {/* 생성 버튼 */}
        {/* 진행 상태 표시 */}
        {generationStatus && (
          <div style={{
            padding: '8px 12px',
            marginBottom: 8,
            background: generationStatus.includes('✅') ? '#d4edda' : '#e3f2fd',
            borderRadius: 6,
            fontSize: 12,
            textAlign: 'center',
            color: generationStatus.includes('✅') ? '#155724' : '#1565c0',
          }}>
            {generationStatus}
          </div>
        )}
        <button
          className="aig-generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey}
        >
          {isGenerating
            ? '⏳ 생성 중...'
            : generateTransparent
              ? '🎭 투명 배경 이미지 생성'
              : '🚀 AI 이미지 생성'}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="image-out" />
    </div>
  )
}
