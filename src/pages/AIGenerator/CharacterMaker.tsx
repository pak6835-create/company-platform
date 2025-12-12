import { useState, useCallback, useMemo } from 'react'
import { generateImage, editImage, extractAlpha, loadImageData, imageDataToUrl, MODELS } from './geminiApi'
import type { ImageSize, AspectRatio } from './geminiApi'

// Props 타입
interface CharacterMakerProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void
}

// 카테고리 정의
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

// 스타일 옵션
const STYLE_OPTIONS = [
  { id: 'korean_webtoon', name: '한국 웹툰', desc: '깔끔한 선, 셀 셰이딩' },
  { id: 'japanese_anime', name: '일본 애니메이션', desc: '큰 눈, 선명한 색상' },
  { id: 'ghibli', name: '지브리 스타일', desc: '부드러운 색감' },
  { id: 'disney', name: '디즈니/픽사', desc: '3D 느낌의 2D' },
  { id: 'manhwa_action', name: '액션 만화', desc: '다이나믹, 강렬한 명암' },
  { id: 'shoujo', name: '소녀만화', desc: '섬세한 선, 꽃/반짝임' },
  { id: 'chibi', name: '치비/SD', desc: '2~3등신, 귀여움' },
  { id: 'semi_realistic', name: '세미 리얼', desc: '사실적+만화적' },
  { id: 'watercolor', name: '수채화', desc: '부드러운 색 번짐' },
  { id: 'flat_design', name: '플랫 디자인', desc: '단순화된 형태' },
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
  { id: 'beastkin_wolf', name: '수인(늑대)', features: 'wolf ears, wolf tail' },
  { id: 'beastkin_fox', name: '수인(여우)', features: 'fox ears, fluffy fox tail' },
  { id: 'beastkin_rabbit', name: '수인(토끼)', features: 'long rabbit ears, fluffy tail' },
  { id: 'dragon_hybrid', name: '용인', features: 'dragon horns, dragon tail, scales' },
  { id: 'fairy', name: '요정', features: 'small wings, glowing aura' },
  { id: 'robot', name: '로봇/안드로이드', features: 'mechanical parts, metallic skin' },
]

// 슬라이더 설정 (캐릭터 특성 조절용)
const CHARACTER_SLIDERS = {
  base: [
    { key: 'muscleLevel', left: '마름', right: '근육질', min: 0, max: 100 },
    { key: 'heightLevel', left: '작은 키', right: '큰 키', min: 0, max: 100 },
    { key: 'ageLevel', left: '어림', right: '성숙함', min: 0, max: 100 },
  ],
  face: [
    { key: 'faceSharpness', left: '부드러운 얼굴', right: '날카로운 얼굴', min: 0, max: 100 },
    { key: 'eyeSize', left: '작은 눈', right: '큰 눈', min: 0, max: 100 },
  ],
  hair: [
    { key: 'hairLength', left: '짧은 머리', right: '긴 머리', min: 0, max: 100 },
    { key: 'hairVolume', left: '얇은 머리', right: '풍성한 머리', min: 0, max: 100 },
  ],
}

// 슬라이더 값을 프롬프트로 변환
const sliderToPrompt = {
  muscleLevel: (v: number) => v < 25 ? 'very slim thin' : v < 50 ? 'average' : v < 75 ? 'athletic fit' : 'very muscular',
  heightLevel: (v: number) => v < 25 ? 'short' : v < 50 ? 'average height' : v < 75 ? 'tall' : 'very tall',
  ageLevel: (v: number) => v < 20 ? 'young child' : v < 40 ? 'teenager' : v < 60 ? 'young adult' : v < 80 ? 'middle aged' : 'elderly',
  faceSharpness: (v: number) => v < 30 ? 'soft round face' : v < 70 ? 'balanced features' : 'sharp angular face',
  eyeSize: (v: number) => v < 30 ? 'small narrow eyes' : v < 70 ? 'average sized eyes' : 'large expressive eyes',
  hairLength: (v: number) => v < 25 ? 'very short hair' : v < 50 ? 'short hair' : v < 75 ? 'medium length hair' : 'very long flowing hair',
  hairVolume: (v: number) => v < 30 ? 'thin flat hair' : v < 70 ? 'normal hair' : 'thick voluminous hair',
}

// 옵션 데이터
const OPTIONS_DATA: Record<string, Record<string, string[] | Record<string, string[]>>> = {
  base: {
    gender: ['남성', '여성', '중성'],
    bodyType: ['마름', '보통', '건장', '근육질', '통통', '글래머'],
    height: ['3등신', '5등신', '6등신', '7등신', '8등신'],
    age: ['어린이', '10대', '20대', '30대', '40대+', '노인'],
  },
  face: {
    style: ['날카로운', '부드러운', '귀여운', '강인한', '차가운', '따뜻한', '신비로운', '무표정', '장난기'],
    eyes: ['큰 눈', '작은 눈', '날카로운 눈', '처진 눈', '올라간 눈', '반짝이는 눈'],
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

// 해상도 옵션
const RESOLUTION_OPTIONS = [
  { id: '1K', name: '1K' },
  { id: '2K', name: '2K' },
  { id: '4K', name: '4K' },
]

// 종횡비 옵션
const ASPECT_RATIO_OPTIONS = [
  { id: '16:9', name: '16:9 (가로)' },
  { id: '1:1', name: '1:1 (정사각)' },
  { id: '9:16', name: '9:16 (세로)' },
]

// 기본 캐릭터 설정
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
  // 슬라이더 값 (0-100)
  sliders: {
    muscleLevel: 50,
    heightLevel: 50,
    ageLevel: 50,
    faceSharpness: 50,
    eyeSize: 50,
    hairLength: 50,
    hairVolume: 50,
  },
}

// 스타일 프롬프트 매핑
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

// 한→영 번역
const translations: Record<string, Record<string, string>> = {
  gender: { '남성': 'male', '여성': 'female', '중성': 'androgynous' },
  bodyType: { '마름': 'slim', '보통': 'average', '건장': 'athletic', '근육질': 'muscular', '통통': 'chubby', '글래머': 'curvy' },
  height: { '3등신': '3 head tall chibi', '5등신': '5 head tall', '6등신': '6 head tall', '7등신': '7 head tall', '8등신': '8 head tall realistic proportions' },
  age: { '어린이': 'child', '10대': 'teenager', '20대': 'young adult in 20s', '30대': 'adult in 30s', '40대+': 'middle-aged', '노인': 'elderly' },
  faceStyle: { '날카로운': 'sharp angular', '부드러운': 'soft gentle', '귀여운': 'cute round', '강인한': 'strong determined', '차가운': 'cold aloof', '따뜻한': 'warm friendly', '신비로운': 'mysterious ethereal', '무표정': 'stoic expressionless', '장난기': 'playful mischievous' },
  eyes: { '큰 눈': 'large expressive eyes', '작은 눈': 'small narrow eyes', '날카로운 눈': 'sharp piercing eyes', '처진 눈': 'droopy gentle eyes', '올라간 눈': 'upturned fox eyes', '반짝이는 눈': 'sparkling bright eyes' },
  skinTone: { '밝은': 'fair pale skin', '보통': 'medium skin tone', '어두운': 'dark skin', '창백한': 'very pale ghostly skin', '황금빛': 'golden tan skin', '올리브': 'olive skin tone' },
  expression: { '무표정': 'neutral expression', '미소': 'gentle smile', '웃음': 'laughing happily', '진지': 'serious expression', '화남': 'angry scowling', '슬픔': 'sad melancholic', '놀람': 'surprised shocked' },
  hairStyle: { '짧은 머리': 'very short hair', '단발': 'short bob hair', '중발': 'medium length hair', '장발': 'long flowing hair', '포니테일': 'ponytail', '트윈테일': 'twin tails pigtails', '땋은머리': 'braided hair', '올림머리': 'updo bun', '덮은머리': 'hair covering one eye', '대머리': 'bald', '스파이키': 'spiky messy hair' },
  hairColor: { '검정': 'black', '갈색': 'brown', '금발': 'blonde golden', '빨강': 'red crimson', '파랑': 'blue', '은색': 'silver gray', '분홍': 'pink', '초록': 'green', '보라': 'purple violet', '흰색': 'white', '그라데이션': 'gradient ombre colored' },
  hairTexture: { '직모': 'straight', '웨이브': 'wavy', '곱슬': 'curly', '뻣뻣한': 'stiff spiky' },
  angle: { '정면': 'front view', '측면': 'side profile view', '후면': 'back view', '3/4 앵글': 'three-quarter view' },
  // 의상
  top: { '티셔츠': 't-shirt', '셔츠': 'button-up shirt', '후드티': 'hoodie', '니트': 'knit sweater', '자켓': 'jacket', '크롭탑': 'crop top', '탱크탑': 'tank top', '정장 상의': 'suit jacket blazer', '조끼': 'vest', '블라우스': 'blouse', '턱시도': 'tuxedo', '전투복': 'tactical combat uniform', '갑옷': 'plate armor', '가죽 아머': 'leather armor', '검은 코트': 'long black coat', '군복': 'military uniform', '로브': 'wizard robe', '망토': 'hooded cape', '마법사 복': 'mage robes', '성직자복': 'priest robes', '기사갑옷': 'knight full armor', '교복 상의': 'school uniform blazer', '체육복': 'gym clothes', '세일러복': 'sailor uniform', '한복 저고리': 'hanbok jeogori', '기모노': 'japanese kimono', '치파오': 'chinese cheongsam', '사리': 'indian sari', '우주복': 'space suit', '사이버 아머': 'cyberpunk armor', '홀로그램 슈트': 'holographic bodysuit' },
  bottom: { '청바지': 'blue jeans', '면바지': 'cotton pants', '반바지': 'shorts', '치마': 'skirt', '레깅스': 'leggings', '조거팬츠': 'jogger pants', '정장 바지': 'dress pants', '정장 치마': 'pencil skirt', '슬랙스': 'slacks', '전투 바지': 'tactical combat pants', '갑옷 하의': 'armored leg guards', '군용 바지': 'military cargo pants', '로브 하의': 'long robe skirt', '판타지 치마': 'fantasy layered skirt', '기사 하의': 'knight leg armor', '교복 바지': 'school uniform pants', '교복 치마': 'school uniform skirt', '플리츠 스커트': 'pleated skirt', '한복 치마': 'hanbok chima skirt', '한복 바지': 'hanbok baji pants', '하카마': 'japanese hakama', '우주복 하의': 'space suit pants', '사이버 레깅스': 'cyber leggings', '홀로그램 팬츠': 'holographic pants' },
  shoes: { '운동화': 'sneakers', '구두': 'dress shoes', '부츠': 'boots', '샌들': 'sandals', '슬리퍼': 'slippers', '맨발': 'barefoot', '전투화': 'combat boots', '하이힐': 'high heels', '로퍼': 'loafers', '사이버 부츠': 'cyberpunk boots' },
  accessory: { '없음': '', '모자': 'hat cap', '왕관': 'royal crown', '머리띠': 'headband', '안경': 'glasses', '선글라스': 'sunglasses', '귀걸이': 'earrings', '헤드셋': 'headset headphones', '후드': 'hood up', '베레모': 'beret', '리본': 'hair ribbon bow', '목걸이': 'necklace pendant', '스카프': 'scarf', '넥타이': 'necktie', '초커': 'choker collar', '보타이': 'bow tie', '망토': 'flowing cape', '반지': 'ring', '장갑': 'gloves', '팔찌': 'bracelet', '시계': 'wristwatch', '건틀릿': 'armored gauntlets', '붕대': 'wrapped bandages', '가방': 'shoulder bag', '배낭': 'backpack', '날개': 'wings', '꼬리': 'tail', '벨트': 'utility belt', '어깨보호대': 'shoulder pads pauldrons', '홀스터': 'weapon holster' },
  weapon: { '장검': 'longsword', '단검': 'dagger', '대검': 'greatsword claymore', '이도류': 'dual wielding swords', '카타나': 'japanese katana', '레이피어': 'rapier', '세이버': 'saber', '창': 'spear lance', '봉': 'bo staff', '삼지창': 'trident', '할버드': 'halberd', '낫창': 'scythe polearm', '활': 'bow and arrow', '석궁': 'crossbow', '권총': 'pistol handgun', '라이플': 'rifle', '기관총': 'machine gun', '지팡이': 'magic staff', '마법봉': 'magic wand', '오브': 'magical orb', '마법책': 'spellbook grimoire', '룬문양': 'glowing runes', '소총': 'assault rifle', '샷건': 'shotgun', 'SMG': 'submachine gun', '스나이퍼': 'sniper rifle', '방패': 'shield', '도끼': 'battle axe', '낫': 'scythe', '채찍': 'whip', '해머': 'war hammer', '너클': 'brass knuckles' },
}

// 번역 함수
const t = (category: string, value: string): string => {
  return translations[category]?.[value] || value
}

export function CharacterMaker({ onImageGenerated }: CharacterMakerProps) {
  // 상태
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('base')
  const [character, setCharacter] = useState(DEFAULT_CHARACTER)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; prompt: string }>>([])
  const [generateTransparent, setGenerateTransparent] = useState(true)
  const [generationStatus, setGenerationStatus] = useState('')
  const [resolution, setResolution] = useState<ImageSize>('2K')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [copied, setCopied] = useState(false)

  // 캐릭터 업데이트
  const updateCharacter = useCallback((category: string, field: string, value: string) => {
    setCharacter((prev) => ({
      ...prev,
      [category]: { ...(prev as any)[category], [field]: value },
    }))
  }, [])

  // 슬라이더 업데이트
  const updateSlider = useCallback((key: string, value: number) => {
    setCharacter((prev) => ({
      ...prev,
      sliders: { ...prev.sliders, [key]: value },
    }))
  }, [])

  // 프롬프트 자동 생성
  const generatedPrompt = useMemo(() => {
    const artStyle = character.style?.artStyle || 'korean_webtoon'
    const styleDesc = stylePrompts[artStyle] || stylePrompts.korean_webtoon

    const raceType = character.race?.type || 'human'
    const raceData = RACE_OPTIONS.find(r => r.id === raceType)
    const raceFeatures = raceData?.features || ''

    const gender = t('gender', character.base.gender)
    const angle = t('angle', character.pose.angle)
    const height = t('height', character.base.height)

    // 슬라이더 값에서 프롬프트 생성
    const sliders = character.sliders || DEFAULT_CHARACTER.sliders
    const muscleDesc = sliderToPrompt.muscleLevel(sliders.muscleLevel)
    const heightDesc = sliderToPrompt.heightLevel(sliders.heightLevel)
    const ageDesc = sliderToPrompt.ageLevel(sliders.ageLevel)
    const faceDesc = sliderToPrompt.faceSharpness(sliders.faceSharpness)
    const eyeDesc = sliderToPrompt.eyeSize(sliders.eyeSize)
    const hairLengthDesc = sliderToPrompt.hairLength(sliders.hairLength)
    const hairVolumeDesc = sliderToPrompt.hairVolume(sliders.hairVolume)

    const skinTone = t('skinTone', character.face.skinTone)
    const expression = t('expression', character.face.expression || '무표정')

    const hairColor = t('hairColor', character.hair.color)
    const hairTexture = t('hairTexture', character.hair.texture || '직모')

    const topItem = t('top', character.top.item)
    const bottomItem = t('bottom', character.bottom.item)
    const shoesItem = t('shoes', character.shoes.item)
    const outfit = [topItem, bottomItem, shoesItem].filter(Boolean).join(', ')

    const accItems = [
      t('accessory', character.accessory.head),
      t('accessory', character.accessory.neck),
      t('accessory', character.accessory.hands),
      t('accessory', character.accessory.other),
    ].filter(Boolean)
    const acc = accItems.length > 0 ? accItems.join(', ') : ''

    const weaponItem = character.weapon.category !== '없음' && character.weapon.item
      ? `holding ${t('weapon', character.weapon.item)} in ${character.weapon.position === '양손' ? 'both hands' : character.weapon.position === '오른손' ? 'right hand' : character.weapon.position === '왼손' ? 'left hand' : character.weapon.position === '등에' ? 'on back' : 'at waist'}`
      : ''

    return `A single ${gender} ${raceData?.name !== '인간' ? raceData?.name + ' ' : ''}character illustration on pure white #FFFFFF background.

Character Details:
- Full body shot from head to toe, ${angle}, standing pose
- ${ageDesc}, ${muscleDesc} build, ${heightDesc}, ${height}
- ${faceDesc} with ${eyeDesc}, ${skinTone}, ${expression}
${raceFeatures ? `- Race features: ${raceFeatures}` : ''}

Hair: ${hairColor} ${hairTexture} ${hairLengthDesc}, ${hairVolumeDesc}

Outfit: ${outfit || 'casual clothes'}${acc ? `\nAccessories: ${acc}` : ''}${weaponItem ? `\nWeapon: ${weaponItem}` : ''}

Art Style: ${styleDesc}
Background: solid pure white #FFFFFF, no shadows, no gradients, no other elements, clean isolated character.
Important: Only ONE character, full body clearly visible, white background only.`
  }, [character])

  // 이미지 생성
  const handleGenerate = async () => {
    if (!apiKey) {
      setError('⚙️ 설정에서 API 키를 입력하세요')
      return
    }

    if (useCustomPrompt && !customPrompt.trim()) {
      setError('⚠️ 프롬프트를 입력하세요')
      return
    }

    setIsGenerating(true)
    setError('')
    setGenerationStatus('')

    let finalPrompt = useCustomPrompt ? customPrompt.trim() : generatedPrompt

    if (useCustomPrompt && generateTransparent) {
      finalPrompt += '\n\nBackground: solid pure white #FFFFFF, no shadows, no gradients, clean isolated subject.'
    }

    try {
      setGenerationStatus('1/3 흰배경 이미지 생성 중...')
      const whiteResult = await generateImage(apiKey, finalPrompt, MODELS[0].id, {
        aspectRatio,
        imageSize: resolution,
      })

      if (!generateTransparent) {
        const newImage = { url: whiteResult.url, prompt: finalPrompt }
        setGeneratedImages((prev) => [newImage, ...prev].slice(0, 20))
        onImageGenerated?.(whiteResult.url, finalPrompt)
        setGenerationStatus('✅ 완료!')
        return
      }

      const whiteData = await loadImageData(whiteResult.url)

      setGenerationStatus('2/3 검정배경으로 변환 중...')
      const blackResult = await editImage(
        apiKey,
        whiteResult.base64,
        `Change ONLY the background color from white to pure black #000000. Keep the exact same image size (${whiteData.width}x${whiteData.height}). Do NOT modify the character.`,
        MODELS[0].id
      )

      setGenerationStatus('3/3 투명 배경 생성 중...')
      const blackData = await loadImageData(blackResult.url)
      const resultData = extractAlpha(whiteData, blackData)
      const transparentUrl = imageDataToUrl(resultData)

      const newImage = { url: transparentUrl, prompt: finalPrompt }
      setGeneratedImages((prev) => [newImage, ...prev].slice(0, 20))
      onImageGenerated?.(transparentUrl, finalPrompt)
      setGenerationStatus('✅ 투명 배경 완료!')
    } catch (err) {
      console.error('이미지 생성 오류:', err)
      setError(err instanceof Error ? err.message : '생성 실패')
      setGenerationStatus('')
    } finally {
      setIsGenerating(false)
    }
  }

  // 설정 패널 렌더링
  const renderSettingsPanel = () => {
    const cat = selectedCategory

    if (cat === 'settings') {
      return (
        <div className="settings-panel">
          <h3>⚙️ API 설정</h3>
          <div className="setting-group">
            <label>API 키</label>
            <div className="api-input-group">
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
            <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: 13, color: 'white' }}>
              🤖 {MODELS[0].name}
            </div>
          </div>

          <div className="checkbox-group">
            <input type="checkbox" checked={generateTransparent} onChange={(e) => setGenerateTransparent(e.target.checked)} />
            <span>🎭 투명 배경으로 생성</span>
          </div>
          <p className="checkbox-hint">
            {generateTransparent ? '흰배경 → 검정배경 → 알파 추출 (API 2회)' : '흰배경 이미지만 (API 1회)'}
          </p>

          <div className="checkbox-group">
            <input type="checkbox" checked={useCustomPrompt} onChange={(e) => setUseCustomPrompt(e.target.checked)} />
            <span>✏️ 직접 프롬프트 입력</span>
          </div>
          {useCustomPrompt && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="생성할 이미지를 설명하세요..."
              style={{
                width: '100%',
                height: 120,
                marginTop: 8,
                padding: 12,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: 12,
                resize: 'vertical',
              }}
            />
          )}

          <div className="setting-group">
            <label>📐 해상도</label>
            <div className="option-buttons">
              {RESOLUTION_OPTIONS.map((res) => (
                <button
                  key={res.id}
                  className={`option-btn ${resolution === res.id ? 'active' : ''}`}
                  onClick={() => setResolution(res.id as ImageSize)}
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
                  className={`option-btn ${aspectRatio === ar.id ? 'active' : ''}`}
                  onClick={() => setAspectRatio(ar.id as AspectRatio)}
                >
                  {ar.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCharacter(DEFAULT_CHARACTER)}
            style={{
              width: '100%',
              padding: 10,
              marginTop: 16,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            🔄 캐릭터 초기화
          </button>

          <div style={{ marginTop: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              💡 Google AI Studio에서 API 키를 발급받으세요
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#818cf8' }}
            >
              API 키 발급하기 →
            </a>
          </div>
        </div>
      )
    }

    if (cat === 'style') {
      return (
        <div className="settings-panel">
          <h3>🎨 아트 스타일</h3>
          <div className="style-grid">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.id}
                className={`style-card ${character.style?.artStyle === style.id ? 'active' : ''}`}
                onClick={() => setCharacter(prev => ({ ...prev, style: { ...prev.style, artStyle: style.id } }))}
              >
                <span className="style-name">{style.name}</span>
                <span className="style-desc">{style.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (cat === 'race') {
      return (
        <div className="settings-panel">
          <h3>🧬 종족 선택</h3>
          <div className="race-grid">
            {RACE_OPTIONS.map((race) => (
              <button
                key={race.id}
                className={`race-card ${character.race?.type === race.id ? 'active' : ''}`}
                onClick={() => setCharacter(prev => ({ ...prev, race: { ...prev.race, type: race.id } }))}
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

    // 슬라이더가 있는 카테고리인지 확인
    const categorySliders = CHARACTER_SLIDERS[cat as keyof typeof CHARACTER_SLIDERS] || []

    // 일반 카테고리 렌더링
    return (
      <div className="settings-panel">
        <h3>{CATEGORIES.find(c => c.id === cat)?.icon} {CATEGORIES.find(c => c.id === cat)?.name} 설정</h3>

        {/* 슬라이더 UI */}
        {categorySliders.length > 0 && (
          <div className="sliders-section">
            <p className="slider-hint">슬라이더로 세밀하게 조절하세요</p>
            {categorySliders.map((slider) => (
              <div key={slider.key} className="slider-group">
                <div className="slider-labels">
                  <span>{slider.left}</span>
                  <span className="slider-value">{character.sliders?.[slider.key as keyof typeof character.sliders] || 50}%</span>
                  <span>{slider.right}</span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={character.sliders?.[slider.key as keyof typeof character.sliders] || 50}
                  onChange={(e) => updateSlider(slider.key, Number(e.target.value))}
                  className="slider"
                />
              </div>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />
          </div>
        )}

        {Object.entries(opts).map(([field, options]) => {
          // items 필드는 category에 따라 동적으로 처리
          if (field === 'items') return null
          if (field === 'category' && (cat === 'top' || cat === 'bottom' || cat === 'weapon')) {
            const currentCat = (character as any)[cat]?.category
            const items = (opts.items as Record<string, string[]>)?.[currentCat] || []
            const showPosition = cat === 'weapon' && currentCat !== '없음'
            return (
              <div key={field}>
                <div className="setting-group">
                  <label>카테고리</label>
                  <div className="option-buttons">
                    {(options as string[]).map((opt) => (
                      <button
                        key={opt}
                        className={`option-btn ${currentCat === opt ? 'active' : ''}`}
                        onClick={() => {
                          updateCharacter(cat, 'category', opt)
                          if (opt === '없음') {
                            updateCharacter(cat, 'item', '')
                          } else {
                            const newItems = (OPTIONS_DATA[cat].items as Record<string, string[]>)?.[opt]
                            if (newItems?.length) updateCharacter(cat, 'item', newItems[0])
                          }
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                {items.length > 0 && (
                  <div className="setting-group">
                    <label>아이템</label>
                    <div className="option-buttons">
                      {items.map((opt) => (
                        <button
                          key={opt}
                          className={`option-btn ${(character as any)[cat]?.item === opt ? 'active' : ''}`}
                          onClick={() => updateCharacter(cat, 'item', opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {showPosition && (
                  <div className="setting-group">
                    <label>무기 위치</label>
                    <div className="option-buttons">
                      {(OPTIONS_DATA.weapon.position as string[]).map((opt) => (
                        <button
                          key={opt}
                          className={`option-btn ${character.weapon.position === opt ? 'active' : ''}`}
                          onClick={() => updateCharacter('weapon', 'position', opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          }
          // position 필드는 위에서 처리했으므로 건너뛰기
          if (field === 'position' && cat === 'weapon') return null

          return (
            <div className="setting-group" key={field}>
              <label>{field === 'item' ? '아이템' : field === 'angle' ? '각도' : field}</label>
              <div className="option-buttons">
                {(options as string[]).map((opt) => (
                  <button
                    key={opt}
                    className={`option-btn ${(character as any)[cat]?.[field] === opt ? 'active' : ''}`}
                    onClick={() => updateCharacter(cat, field, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="character-maker-layout">
      {/* 카테고리 사이드바 */}
      <div className="category-sidebar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="icon">{cat.icon}</span>
            <span className="name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 설정 패널 */}
      {renderSettingsPanel()}

      {/* 결과 사이드바 */}
      <div className="result-sidebar">
        <div className="result-header">
          <span>📸 결과</span>
          {generatedImages.length > 0 && (
            <button onClick={() => setGeneratedImages([])} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
              🗑️
            </button>
          )}
        </div>

        <div className="result-gallery">
          {generatedImages.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
              <p>생성된 이미지가<br/>여기에 표시됩니다</p>
            </div>
          ) : (
            generatedImages.map((img, idx) => (
              <div key={idx} className="gallery-item">
                <img src={img.url} alt={`생성 ${idx + 1}`} />
                <div className="gallery-actions">
                  <button onClick={() => window.open(img.url, '_blank')}>🔍</button>
                  <button onClick={() => {
                    const link = document.createElement('a')
                    link.href = img.url
                    link.download = `character-${Date.now()}.png`
                    link.click()
                  }}>⬇️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 프롬프트 미리보기 */}
        <div className="prompt-preview">
          <div className="prompt-preview-header">
            <label>🤖 자동 생성 프롬프트</label>
            <button onClick={() => {
              navigator.clipboard.writeText(generatedPrompt)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}>
              {copied ? '✅ 복사됨!' : '📋 복사'}
            </button>
          </div>
          <p>{generatedPrompt.slice(0, 200)}...</p>
        </div>

        {/* 에러 */}
        {error && <div className="error-message">{error}</div>}

        {/* 생성 상태 */}
        {generationStatus && (
          <div className="generate-status">{generationStatus}</div>
        )}

        {/* 생성 버튼 */}
        <div className="generate-section">
          <button
            className="generate-btn"
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
      </div>
    </div>
  )
}
