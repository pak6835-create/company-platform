/**
 * AI 스튜디오 v9.6 - 데이터 정의
 * 캐릭터/배경 카테고리 및 옵션
 */

// 슬라이더 아이템 타입
export interface SliderItem {
  name: string
  icon: string
  type: 'slider' | 'hue' | 'skin'
  min?: number
  max?: number
  default?: number
  step?: number
  unit?: string
  labels?: string[]
  prompt: (value: number, lightness?: number) => string
}

// 태그 아이템 타입
export interface TagItem {
  name: string
  icon: string
  tags: [string, string][] // [영어, 한국어]
  hasColor?: boolean
  isNeg?: boolean
}

export type CategoryItem = SliderItem | TagItem

export interface Category {
  name: string
  icon: string
  items: Record<string, CategoryItem>
}

// 색상 이름 변환
export function getColorName(h: number, l: number): string {
  const names = ['red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'magenta', 'pink']
  const i = Math.floor(((h + 15) % 360) / 30)
  const pre = l < 30 ? 'dark ' : l > 70 ? 'light ' : ''
  if (l < 15) return 'black'
  if (l > 90) return 'white'
  return pre + names[i]
}

// 정확한 색상 표현 (HEX + 색상명)
export function getColorPrompt(h: number, s: number = 70, l: number = 50): string {
  const hex = hslToHex(h, s, l)
  const name = getColorName(h, l)
  return `${hex} ${name}`
}

export function getColorNameKo(h: number, l: number): string {
  const names = ['빨강', '주황', '노랑', '연두', '녹색', '청록', '하늘', '파랑', '남색', '보라', '자주', '분홍']
  const i = Math.floor(((h + 15) % 360) / 30)
  const pre = l < 30 ? '어두운 ' : l > 70 ? '밝은 ' : ''
  if (l < 15) return '검정'
  if (l > 90) return '흰색'
  return pre + names[i]
}

// HSL to HEX
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// 캐릭터 카테고리
export const CHAR_CATEGORIES: Record<string, Category> = {
  basic: {
    name: '기본',
    icon: '👤',
    items: {
      species: {
        name: '종족',
        icon: '🧬',
        tags: [
          ['human', '인간'],
          ['elf', '엘프'],
          ['vampire', '뱀파이어'],
          ['angel', '천사'],
          ['demon', '악마'],
          ['orc', '오크'],
          ['dwarf', '드워프'],
          ['fairy', '요정'],
          ['werewolf', '늑대인간'],
          ['cat person', '고양이수인'],
          ['fox person', '여우수인'],
          ['dragon humanoid', '용인'],
        ],
      },
      gender: {
        name: '성별',
        icon: '⚧',
        tags: [
          ['male', '남성'],
          ['female', '여성'],
          ['androgynous', '중성적'],
        ],
      },
      age: {
        name: '나이',
        icon: '🎂',
        type: 'slider',
        min: 5,
        max: 80,
        default: 25,
        unit: '세',
        prompt: (v) =>
          v < 10 ? 'child' : v < 18 ? 'teenager' : v < 30 ? 'young adult in 20s' : v < 40 ? 'adult in 30s' : v < 50 ? 'middle-aged in 40s' : v < 60 ? 'mature adult in 50s' : 'elderly',
      },
      height: {
        name: '키',
        icon: '📏',
        type: 'slider',
        min: 140,
        max: 200,
        default: 170,
        unit: 'cm',
        prompt: (v) => `${v}cm tall`,
      },
      headRatio: {
        name: '등신',
        icon: '📐',
        type: 'slider',
        min: 4,
        max: 10,
        default: 7,
        step: 0.5,
        unit: '등신',
        prompt: (v) => `${v} head tall proportion`,
      },
      bodyType: {
        name: '체형',
        icon: '💪',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50,
        labels: ['마름', '보통', '근육'],
        prompt: (v) => (v < 30 ? 'slim skinny build' : v < 70 ? 'average build' : 'muscular athletic build'),
      },
      skinTone: {
        name: '피부색',
        icon: '🎨',
        type: 'skin',
        prompt: (h, s = 40, l = 50) => {
          const hex = hslToHex(h, s, l)
          let desc = ''
          if (l > 80) desc = 'very pale white'
          else if (l > 60) desc = 'fair light'
          else if (l > 40) desc = 'medium tan'
          else if (l > 20) desc = 'brown'
          else desc = 'dark'
          return `${hex} ${desc} skin tone`
        },
      },
    },
  },
  hair: {
    name: '머리',
    icon: '💇',
    items: {
      hairStyle: {
        name: '스타일',
        icon: '💇',
        tags: [
          ['bald', '대머리'],
          ['buzz cut', '짧은삭발'],
          ['short hair', '짧은머리'],
          ['medium hair', '중간머리'],
          ['long hair', '긴머리'],
          ['very long hair', '매우긴머리'],
          ['straight hair', '생머리'],
          ['wavy hair', '웨이브'],
          ['curly hair', '곱슬'],
          ['ponytail', '포니테일'],
          ['twin tails', '트윈테일'],
          ['braid', '땋은머리'],
          ['bun', '똥머리'],
          ['mohawk', '모히칸'],
          ['dreadlocks', '드레드락'],
        ],
      },
      hairBangs: {
        name: '앞머리',
        icon: '✂️',
        tags: [
          ['no bangs', '앞머리없음'],
          ['blunt bangs', '일자앞머리'],
          ['side swept bangs', '옆으로넘긴'],
          ['parted bangs', '가르마'],
          ['curtain bangs', '커튼뱅'],
          ['wispy bangs', '시스루뱅'],
        ],
      },
      hairColor: {
        name: '머리색',
        icon: '🎨',
        type: 'hue',
        prompt: (h, s = 70, l = 50) => getColorPrompt(h, s, l) + ' colored hair',
      },
    },
  },
  face: {
    name: '얼굴',
    icon: '👤',
    items: {
      faceShape: {
        name: '얼굴형',
        icon: '🗿',
        tags: [
          ['oval face', '계란형'],
          ['round face', '둥근형'],
          ['square face', '각진형'],
          ['heart face', '하트형'],
          ['long face', '긴형'],
        ],
      },
      eyeSize: {
        name: '눈크기',
        icon: '👁️',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50,
        labels: ['작음', '보통', '큼'],
        prompt: (v) => (v < 30 ? 'small narrow eyes' : v < 70 ? 'normal eyes' : 'large anime eyes'),
      },
      eyeShape: {
        name: '눈형태',
        icon: '👀',
        tags: [
          ['round eyes', '동그란눈'],
          ['almond eyes', '아몬드눈'],
          ['monolid eyes', '무쌍'],
          ['double eyelid', '쌍꺼풀'],
          ['downturned eyes', '처진눈'],
          ['upturned eyes', '올라간눈'],
        ],
      },
      eyeColor: {
        name: '눈/렌즈색',
        icon: '🔵',
        type: 'hue',
        prompt: (h, s = 70, l = 50) => getColorPrompt(h, s, l) + ' colored eyes',
      },
      eyebrows: {
        name: '눈썹',
        icon: '🤨',
        tags: [
          ['thin eyebrows', '얇은눈썹'],
          ['thick eyebrows', '진한눈썹'],
          ['arched eyebrows', '아치형'],
          ['straight eyebrows', '일자눈썹'],
          ['bushy eyebrows', '덥수룩한눈썹'],
        ],
      },
      nose: {
        name: '코',
        icon: '👃',
        tags: [
          ['small nose', '작은코'],
          ['high nose', '높은코'],
          ['flat nose', '낮은코'],
          ['pointed nose', '뾰족한코'],
          ['wide nose', '넓은코'],
        ],
      },
      lips: {
        name: '입술',
        icon: '👄',
        tags: [
          ['thin lips', '얇은입술'],
          ['full lips', '도톰한입술'],
          ['small lips', '작은입술'],
          ['wide lips', '넓은입술'],
        ],
        hasColor: true,
      },
      expression: {
        name: '표정',
        icon: '😊',
        tags: [
          ['neutral', '무표정'],
          ['smiling', '미소'],
          ['laughing', '웃음'],
          ['sad', '슬픔'],
          ['angry', '화남'],
          ['surprised', '놀람'],
          ['shy', '수줍음'],
          ['serious', '진지함'],
          ['seductive', '매혹적'],
          ['crying', '눈물'],
        ],
      },
      wrinkles: {
        name: '주름',
        icon: '〰️',
        type: 'slider',
        min: 0,
        max: 100,
        default: 0,
        labels: ['없음', '약간', '많음'],
        prompt: (v) => (v < 20 ? '' : v < 50 ? 'subtle wrinkles' : 'prominent wrinkles, aged face'),
      },
      beard: {
        name: '수염',
        icon: '🧔',
        tags: [
          ['clean shaven', '면도함'],
          ['stubble', '거친수염'],
          ['short beard', '짧은수염'],
          ['full beard', '풍성한수염'],
          ['goatee', '염소수염'],
          ['mustache', '콧수염'],
        ],
        hasColor: true,
      },
    },
  },
  faceAcc: {
    name: '얼굴악세',
    icon: '👓',
    items: {
      glasses: {
        name: '안경',
        icon: '👓',
        tags: [
          ['no glasses', '안경없음'],
          ['glasses', '안경'],
          ['round glasses', '동그란안경'],
          ['square glasses', '사각안경'],
          ['sunglasses', '선글라스'],
          ['monocle', '외알안경'],
        ],
        hasColor: true,
      },
      headwear: {
        name: '모자/머리장식',
        icon: '🎩',
        tags: [
          ['no hat', '없음'],
          ['cap', '캡모자'],
          ['beanie', '비니'],
          ['fedora', '페도라'],
          ['crown', '왕관'],
          ['tiara', '티아라'],
          ['hairpin', '헤어핀'],
          ['ribbon', '리본'],
          ['headband', '머리띠'],
          ['flower crown', '꽃왕관'],
        ],
        hasColor: true,
      },
      mask: {
        name: '마스크',
        icon: '🎭',
        tags: [
          ['no mask', '없음'],
          ['half mask', '반가면'],
          ['full mask', '전체가면'],
          ['surgical mask', '마스크'],
          ['gas mask', '방독면'],
        ],
      },
    },
  },
  upperBody: {
    name: '상체',
    icon: '👕',
    items: {
      topLayer1: {
        name: '상의1(안쪽)',
        icon: '👕',
        tags: [
          ['t-shirt', '티셔츠'],
          ['tank top', '민소매'],
          ['shirt', '셔츠'],
          ['blouse', '블라우스'],
          ['crop top', '크롭탑'],
          ['turtleneck', '터틀넥'],
          ['vest', '조끼'],
        ],
        hasColor: true,
      },
      topLayer2: {
        name: '상의2(중간)',
        icon: '🧥',
        tags: [
          ['none', '없음'],
          ['hoodie', '후드티'],
          ['sweater', '스웨터'],
          ['cardigan', '가디건'],
          ['jacket', '자켓'],
          ['blazer', '블레이저'],
        ],
        hasColor: true,
      },
      topLayer3: {
        name: '상의3(바깥)',
        icon: '🧥',
        tags: [
          ['none', '없음'],
          ['coat', '코트'],
          ['trench coat', '트렌치코트'],
          ['leather jacket', '가죽자켓'],
          ['parka', '파카'],
          ['cape', '망토'],
          ['cloak', '클로크'],
        ],
        hasColor: true,
      },
      neckwear: {
        name: '넥웨어',
        icon: '👔',
        tags: [
          ['none', '없음'],
          ['tie', '넥타이'],
          ['bow tie', '나비넥타이'],
          ['scarf', '스카프'],
          ['choker', '초커'],
          ['necklace', '목걸이'],
          ['pendant', '펜던트'],
        ],
        hasColor: true,
      },
      gloves: {
        name: '장갑',
        icon: '🧤',
        tags: [
          ['none', '없음'],
          ['fingerless gloves', '핑거리스'],
          ['leather gloves', '가죽장갑'],
          ['long gloves', '롱장갑'],
          ['mittens', '벙어리장갑'],
        ],
        hasColor: true,
      },
    },
  },
  lowerBody: {
    name: '하체',
    icon: '👖',
    items: {
      bottom: {
        name: '하의',
        icon: '👖',
        tags: [
          ['jeans', '청바지'],
          ['slacks', '슬랙스'],
          ['shorts', '반바지'],
          ['skirt', '스커트'],
          ['mini skirt', '미니스커트'],
          ['long skirt', '롱스커트'],
          ['pleated skirt', '플리츠'],
          ['leggings', '레깅스'],
          ['sweatpants', '츄리닝'],
        ],
        hasColor: true,
      },
      socks: {
        name: '양말/스타킹',
        icon: '🧦',
        tags: [
          ['none', '없음'],
          ['ankle socks', '발목양말'],
          ['crew socks', '중간양말'],
          ['knee socks', '무릎양말'],
          ['thigh highs', '허벅지양말'],
          ['stockings', '스타킹'],
          ['fishnet', '망사'],
        ],
        hasColor: true,
      },
      shoes: {
        name: '신발',
        icon: '👟',
        tags: [
          ['sneakers', '운동화'],
          ['boots', '부츠'],
          ['high heels', '하이힐'],
          ['loafers', '로퍼'],
          ['sandals', '샌들'],
          ['barefoot', '맨발'],
        ],
        hasColor: true,
      },
    },
  },
  hands: {
    name: '손/무기',
    icon: '✋',
    items: {
      leftHand: {
        name: '왼손',
        icon: '🤚',
        tags: [
          ['empty hand', '빈손'],
          ['open palm', '편손'],
          ['fist', '주먹'],
          ['pointing', '가리키기'],
          ['peace sign', '브이'],
          ['thumbs up', '엄지척'],
        ],
      },
      rightHand: {
        name: '오른손',
        icon: '🤚',
        tags: [
          ['empty hand', '빈손'],
          ['open palm', '편손'],
          ['fist', '주먹'],
          ['pointing', '가리키기'],
          ['peace sign', '브이'],
          ['thumbs up', '엄지척'],
        ],
      },
      weapon: {
        name: '무기',
        icon: '⚔️',
        tags: [
          ['none', '없음'],
          ['sword', '검'],
          ['katana', '카타나'],
          ['dagger', '단검'],
          ['bow', '활'],
          ['staff', '지팡이'],
          ['wand', '마법봉'],
          ['gun', '총'],
          ['shield', '방패'],
          ['spear', '창'],
          ['axe', '도끼'],
        ],
      },
      bracelet: {
        name: '팔찌',
        icon: '📿',
        tags: [
          ['none', '없음'],
          ['bracelet', '팔찌'],
          ['bangle', '뱅글'],
          ['watch', '시계'],
          ['wristband', '손목밴드'],
        ],
        hasColor: true,
      },
      ring: {
        name: '반지',
        icon: '💍',
        tags: [
          ['none', '없음'],
          ['simple ring', '심플반지'],
          ['gem ring', '보석반지'],
          ['multiple rings', '여러반지'],
        ],
        hasColor: true,
      },
    },
  },
  pose: {
    name: '포즈',
    icon: '🏃',
    items: {
      bodyPose: {
        name: '전신포즈',
        icon: '🧍',
        tags: [
          ['standing', '서있는'],
          ['sitting', '앉은'],
          ['kneeling', '무릎꿇은'],
          ['lying down', '누운'],
          ['walking', '걷는'],
          ['running', '뛰는'],
          ['jumping', '점프'],
          ['fighting pose', '전투자세'],
          ['dancing', '춤추는'],
          ['floating', '떠있는'],
        ],
      },
      armPose: {
        name: '팔포즈',
        icon: '💪',
        tags: [
          ['arms at sides', '팔내림'],
          ['crossed arms', '팔짱'],
          ['hands behind', '뒷짐'],
          ['hands on hips', '허리손'],
          ['raised arm', '팔들기'],
          ['waving', '손흔들기'],
        ],
      },
      viewAngle: {
        name: '시점',
        icon: '📷',
        tags: [
          ['front view', '정면'],
          ['side view', '측면'],
          ['back view', '뒷모습'],
          ['three quarter view', '3/4앵글'],
          ['from above', '위에서'],
          ['from below', '아래에서'],
          ['close up', '클로즈업'],
          ['full body', '전신'],
        ],
      },
    },
  },
  style: {
    name: '스타일',
    icon: '🎨',
    items: {
      artStyle: {
        name: '그림체',
        icon: '🎨',
        tags: [
          ['korean webtoon', '한국웹툰'],
          ['japanese anime', '일본애니'],
          ['ghibli style', '지브리'],
          ['disney pixar', '디즈니픽사'],
          ['semi realistic', '세미리얼'],
          ['realistic', '실사'],
          ['chibi', '치비'],
          ['manhwa', '만화'],
          ['watercolor', '수채화'],
          ['oil painting', '유화'],
        ],
      },
      quality: {
        name: '품질',
        icon: '✨',
        tags: [
          ['masterpiece', '걸작'],
          ['best quality', '최고품질'],
          ['highly detailed', '상세한'],
          ['sharp focus', '선명한'],
        ],
      },
      mood: {
        name: '분위기',
        icon: '🌟',
        tags: [
          ['bright', '밝은'],
          ['dark', '어두운'],
          ['warm', '따뜻한'],
          ['cold', '차가운'],
          ['dramatic', '극적인'],
          ['soft', '부드러운'],
          ['vibrant', '생동감있는'],
        ],
      },
    },
  },
  negative: {
    name: '네거티브',
    icon: '⛔',
    items: {
      negative: {
        name: '제외할것',
        icon: '⛔',
        tags: [
          ['low quality', '저품질'],
          ['blurry', '흐린'],
          ['ugly', '못생긴'],
          ['deformed', '변형'],
          ['bad anatomy', '해부학오류'],
          ['extra limbs', '팔다리추가'],
          ['missing limbs', '팔다리없음'],
          ['extra fingers', '손가락추가'],
          ['bad hands', '이상한손'],
          ['multiple characters', '여러캐릭터'],
          ['watermark', '워터마크'],
          ['text', '텍스트'],
        ],
        isNeg: true,
      },
    },
  },
}

// 배경 카테고리
export const BG_CATEGORIES: Record<string, Category> = {
  style: {
    name: '스타일',
    icon: '🎨',
    items: {
      artStyle: {
        name: '그림체',
        icon: '🎨',
        tags: [
          ['webtoon style', '웹툰'],
          ['anime style', '애니메'],
          ['ghibli style', '지브리'],
          ['photorealistic', '실사'],
          ['concept art', '컨셉아트'],
          ['watercolor', '수채화'],
          ['oil painting', '유화'],
          ['pixel art', '픽셀'],
        ],
      },
      quality: {
        name: '품질',
        icon: '✨',
        tags: [
          ['masterpiece', '걸작'],
          ['best quality', '최고품질'],
          ['highly detailed', '상세한'],
          ['8k', '8K'],
          ['sharp focus', '선명'],
        ],
      },
    },
  },
  sky: {
    name: '하늘',
    icon: '🌅',
    items: {
      timeOfDay: {
        name: '시간대',
        icon: '🕐',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50,
        labels: ['새벽', '아침', '낮', '석양', '밤'],
        prompt: (v) =>
          v < 15 ? 'dawn, early morning' : v < 35 ? 'morning, sunrise' : v < 65 ? 'daytime, bright sky' : v < 85 ? 'sunset, golden hour' : 'night, dark sky, stars',
      },
      weather: {
        name: '날씨',
        icon: '🌤️',
        tags: [
          ['clear sky', '맑음'],
          ['cloudy', '흐림'],
          ['overcast', '잔뜩흐림'],
          ['rainy', '비'],
          ['snowy', '눈'],
          ['foggy', '안개'],
          ['stormy', '폭풍'],
        ],
      },
      clouds: {
        name: '구름',
        icon: '☁️',
        type: 'slider',
        min: 0,
        max: 100,
        default: 30,
        labels: ['없음', '약간', '많음'],
        prompt: (v) => (v < 20 ? 'clear sky' : 'cloudy sky'),
      },
    },
  },
  far: {
    name: '원경',
    icon: '🏔️',
    items: {
      farBg: {
        name: '먼배경',
        icon: '🏔️',
        tags: [
          ['none', '없음'],
          ['mountains', '산'],
          ['city skyline', '도시스카이라인'],
          ['forest horizon', '숲지평선'],
          ['ocean horizon', '바다수평선'],
          ['desert dunes', '사막언덕'],
        ],
      },
      farDetail: {
        name: '원경디테일',
        icon: '🔭',
        type: 'slider',
        min: 0,
        max: 100,
        default: 30,
        labels: ['흐릿', '보통', '선명'],
        prompt: (v) => (v < 30 ? 'blurry distant background' : 'sharp detailed background'),
      },
    },
  },
  mid: {
    name: '중경',
    icon: '🏠',
    items: {
      location: {
        name: '장소',
        icon: '📍',
        tags: [
          ['city street', '도시거리'],
          ['alley', '골목'],
          ['park', '공원'],
          ['forest', '숲속'],
          ['beach', '해변'],
          ['mountain path', '산길'],
          ['river', '강가'],
          ['bridge', '다리'],
        ],
      },
      building: {
        name: '건물',
        icon: '🏢',
        tags: [
          ['none', '없음'],
          ['houses', '주택'],
          ['apartments', '아파트'],
          ['skyscrapers', '마천루'],
          ['traditional houses', '전통가옥'],
          ['shops', '상점가'],
          ['school', '학교'],
          ['castle', '성'],
        ],
      },
      interior: {
        name: '실내',
        icon: '🏠',
        tags: [
          ['none', '없음'],
          ['living room', '거실'],
          ['bedroom', '침실'],
          ['kitchen', '주방'],
          ['cafe', '카페'],
          ['restaurant', '레스토랑'],
          ['classroom', '교실'],
          ['library', '도서관'],
          ['office', '사무실'],
        ],
      },
    },
  },
  near: {
    name: '근경',
    icon: '🛤️',
    items: {
      ground: {
        name: '바닥',
        icon: '🛤️',
        tags: [
          ['asphalt', '아스팔트'],
          ['concrete', '콘크리트'],
          ['grass', '잔디'],
          ['dirt', '흙'],
          ['sand', '모래'],
          ['wood floor', '나무바닥'],
          ['tile', '타일'],
          ['carpet', '카펫'],
        ],
      },
      foreground: {
        name: '전경물체',
        icon: '🌳',
        tags: [
          ['none', '없음'],
          ['trees', '나무'],
          ['flowers', '꽃'],
          ['rocks', '바위'],
          ['fence', '울타리'],
          ['bench', '벤치'],
          ['street lamp', '가로등'],
          ['car', '자동차'],
        ],
      },
      depthBlur: {
        name: '심도(블러)',
        icon: '📸',
        type: 'slider',
        min: 0,
        max: 100,
        default: 0,
        labels: ['없음', '약간', '강함'],
        prompt: (v) => (v < 20 ? '' : 'depth of field, bokeh'),
      },
    },
  },
  light: {
    name: '조명',
    icon: '💡',
    items: {
      lightType: {
        name: '조명종류',
        icon: '💡',
        tags: [
          ['natural light', '자연광'],
          ['cinematic lighting', '시네마틱'],
          ['soft lighting', '부드러운'],
          ['dramatic lighting', '극적인'],
          ['backlight', '역광'],
          ['rim light', '림라이트'],
          ['neon lights', '네온'],
          ['candlelight', '촛불'],
        ],
      },
      lightTemp: {
        name: '색온도',
        icon: '🌡️',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50,
        labels: ['차가움', '중립', '따뜻함'],
        prompt: (v) => (v < 30 ? 'cool blue tones' : v > 70 ? 'warm orange tones' : ''),
      },
      brightness: {
        name: '밝기',
        icon: '☀️',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50,
        labels: ['어두움', '보통', '밝음'],
        prompt: (v) => (v < 30 ? 'dark, low key' : v > 70 ? 'bright, high key' : ''),
      },
      saturation: {
        name: '채도',
        icon: '🎨',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50,
        labels: ['탁함', '보통', '선명'],
        prompt: (v) => (v < 30 ? 'desaturated, muted colors' : v > 70 ? 'vibrant, saturated colors' : ''),
      },
    },
  },
  negative: {
    name: '네거티브',
    icon: '⛔',
    items: {
      negative: {
        name: '제외할것',
        icon: '⛔',
        tags: [
          ['low quality', '저품질'],
          ['blurry', '흐린'],
          ['ugly', '못생긴'],
          ['watermark', '워터마크'],
          ['text', '텍스트'],
          ['cropped', '잘린'],
        ],
        isNeg: true,
      },
    },
  },
}

// 프리셋
export interface Preset {
  name: string
  icon: string
  data: Record<string, unknown>
}

export const CHAR_PRESETS: Preset[] = [
  // === 🔥 트렌디 웹툰 캐릭터 ===
  {
    name: '✨ 재벌남주',
    icon: '✨',
    data: {
      artStyle: ['korean webtoon'],
      quality: ['masterpiece', 'best quality', '8k', 'ultra detailed'],
      gender: ['male'],
      age: 28,
      height: 188,
      headRatio: 8.5,
      bodyType: 65,
      hairStyle: ['short hair', 'undercut'],
      hairColor: { h: 30, s: 20, l: 10 },
      eyeShape: ['sharp eyes'],
      eyeColor: { h: 30, s: 40, l: 35 },
      expression: ['cold', 'serious'],
      faceShape: ['sharp jawline'],
      topLayer1: ['shirt'],
      topLayer1Color: { h: 0, s: 0, l: 98 },
      topLayer2: ['vest'],
      topLayer2Color: { h: 0, s: 0, l: 15 },
      topLayer3: ['coat'],
      topLayer3Color: { h: 0, s: 0, l: 10 },
      bottom: ['slacks'],
      bottomColor: { h: 0, s: 0, l: 12 },
      bodyPose: ['standing'],
      viewAngle: ['three quarter view'],
      mood: ['dramatic', 'cinematic'],
    },
  },
  {
    name: '💖 로판여주',
    icon: '💖',
    data: {
      artStyle: ['korean webtoon'],
      quality: ['masterpiece', 'best quality', '8k', 'ultra detailed'],
      gender: ['female'],
      age: 20,
      height: 165,
      headRatio: 7,
      hairStyle: ['very long hair', 'wavy hair'],
      hairBangs: ['curtain bangs'],
      hairColor: { h: 45, s: 30, l: 75 },
      eyeSize: 70,
      eyeShape: ['big eyes'],
      eyeColor: { h: 280, s: 60, l: 65 },
      expression: ['innocent', 'sparkling eyes'],
      faceShape: ['oval face'],
      skinTone: { h: 25, s: 30, l: 92 },
      topLayer1: ['dress'],
      topLayer1Color: { h: 340, s: 50, l: 85 },
      accessory: ['ribbon', 'necklace'],
      bodyPose: ['elegant pose'],
      viewAngle: ['three quarter view'],
      mood: ['soft', 'dreamy'],
    },
  },
  {
    name: '🖤 빌런남주',
    icon: '🖤',
    data: {
      artStyle: ['korean webtoon'],
      quality: ['masterpiece', 'best quality', 'cinematic lighting'],
      gender: ['male'],
      age: 30,
      height: 190,
      headRatio: 8.5,
      bodyType: 70,
      hairStyle: ['medium hair', 'slicked back'],
      hairColor: { h: 0, s: 0, l: 5 },
      eyeShape: ['sharp eyes', 'narrow eyes'],
      eyeColor: { h: 0, s: 80, l: 45 },
      expression: ['smirk', 'menacing'],
      faceShape: ['sharp jawline'],
      topLayer1: ['turtleneck'],
      topLayer1Color: { h: 0, s: 0, l: 8 },
      topLayer3: ['coat'],
      topLayer3Color: { h: 0, s: 100, l: 25 },
      bottom: ['slacks'],
      bottomColor: { h: 0, s: 0, l: 10 },
      bodyPose: ['arms crossed'],
      viewAngle: ['low angle'],
      mood: ['dark', 'dramatic'],
    },
  },
  {
    name: '🌸 하이틴여주',
    icon: '🌸',
    data: {
      artStyle: ['korean webtoon'],
      quality: ['masterpiece', 'best quality', 'vivid colors'],
      gender: ['female'],
      age: 17,
      height: 163,
      headRatio: 7,
      hairStyle: ['long hair', 'straight hair'],
      hairBangs: ['see-through bangs'],
      hairColor: { h: 25, s: 60, l: 15 },
      eyeSize: 65,
      eyeShape: ['round eyes'],
      expression: ['blushing', 'shy'],
      topLayer1: ['blouse'],
      topLayer1Color: { h: 0, s: 0, l: 98 },
      topLayer2: ['cardigan'],
      topLayer2Color: { h: 350, s: 45, l: 75 },
      bottom: ['pleated skirt'],
      bottomColor: { h: 220, s: 50, l: 25 },
      socks: ['knee socks'],
      shoes: ['loafers'],
      bodyPose: ['standing'],
      viewAngle: ['front view'],
      mood: ['soft', 'cute'],
    },
  },
  {
    name: '⚔️ 무협검객',
    icon: '⚔️',
    data: {
      artStyle: ['semi realistic', 'chinese painting style'],
      quality: ['masterpiece', 'highly detailed', 'cinematic'],
      gender: ['male'],
      age: 25,
      height: 182,
      bodyType: 70,
      hairStyle: ['long hair', 'ponytail'],
      hairColor: { h: 0, s: 0, l: 8 },
      eyeShape: ['sharp eyes'],
      eyeColor: { h: 30, s: 50, l: 30 },
      expression: ['cold', 'serious'],
      topLayer1: ['hanfu'],
      topLayer1Color: { h: 0, s: 0, l: 95 },
      topLayer3: ['robe'],
      topLayer3Color: { h: 220, s: 60, l: 25 },
      weapon: ['sword'],
      bodyPose: ['fighting pose'],
      viewAngle: ['dynamic angle'],
      mood: ['dramatic', 'epic'],
    },
  },
  {
    name: '👑 황녀',
    icon: '👑',
    data: {
      artStyle: ['korean webtoon'],
      quality: ['masterpiece', 'best quality', 'ornate details'],
      gender: ['female'],
      age: 22,
      height: 168,
      headRatio: 7.5,
      hairStyle: ['very long hair', 'elegant updo'],
      hairColor: { h: 45, s: 25, l: 85 },
      eyeSize: 60,
      eyeColor: { h: 200, s: 70, l: 60 },
      expression: ['elegant', 'noble'],
      skinTone: { h: 25, s: 25, l: 95 },
      topLayer1: ['royal dress'],
      topLayer1Color: { h: 50, s: 80, l: 55 },
      accessory: ['crown', 'jewelry'],
      bodyPose: ['elegant pose'],
      viewAngle: ['three quarter view'],
      mood: ['luxurious', 'majestic'],
    },
  },
  // === 🎮 게임/판타지 ===
  {
    name: '🗡️ 어쌔신',
    icon: '🗡️',
    data: {
      artStyle: ['concept art', 'semi realistic'],
      quality: ['masterpiece', 'highly detailed', 'dynamic lighting'],
      gender: ['female'],
      age: 24,
      height: 170,
      bodyType: 55,
      hairStyle: ['short hair', 'asymmetrical'],
      hairColor: { h: 270, s: 30, l: 20 },
      eyeShape: ['sharp eyes'],
      eyeColor: { h: 180, s: 80, l: 50 },
      expression: ['cold', 'focused'],
      topLayer1: ['bodysuit'],
      topLayer1Color: { h: 0, s: 0, l: 12 },
      topLayer3: ['hooded cape'],
      topLayer3Color: { h: 270, s: 40, l: 15 },
      weapon: ['dual daggers'],
      bodyPose: ['action pose'],
      viewAngle: ['dynamic angle'],
      mood: ['dark', 'mysterious'],
    },
  },
  {
    name: '🔮 대마법사',
    icon: '🔮',
    data: {
      artStyle: ['fantasy art', 'semi realistic'],
      quality: ['masterpiece', 'highly detailed', 'magical effects'],
      gender: ['male'],
      age: 35,
      height: 185,
      hairStyle: ['long hair'],
      hairColor: { h: 220, s: 20, l: 70 },
      eyeColor: { h: 200, s: 100, l: 60 },
      expression: ['wise', 'mysterious'],
      topLayer1: ['robe'],
      topLayer1Color: { h: 220, s: 60, l: 20 },
      topLayer3: ['cloak'],
      topLayer3Color: { h: 270, s: 50, l: 25 },
      weapon: ['staff'],
      accessory: ['magical orb'],
      bodyPose: ['casting spell'],
      mood: ['mystical', 'powerful'],
    },
  },
  {
    name: '🐉 용족',
    icon: '🐉',
    data: {
      species: ['dragon humanoid'],
      artStyle: ['fantasy art', 'semi realistic'],
      quality: ['masterpiece', 'highly detailed', 'intricate scales'],
      gender: ['male'],
      age: 500,
      height: 195,
      bodyType: 80,
      hairStyle: ['long hair'],
      hairColor: { h: 0, s: 0, l: 95 },
      eyeColor: { h: 50, s: 100, l: 50 },
      expression: ['fierce', 'proud'],
      skinTone: { h: 220, s: 30, l: 40 },
      topLayer1: ['armor'],
      topLayer1Color: { h: 220, s: 50, l: 30 },
      accessory: ['horns', 'scales'],
      bodyPose: ['powerful stance'],
      mood: ['epic', 'majestic'],
    },
  },
  // === 🌟 일러스트/아이돌 ===
  {
    name: '🎤 K-POP남돌',
    icon: '🎤',
    data: {
      artStyle: ['semi realistic'],
      quality: ['masterpiece', 'best quality', 'studio lighting'],
      gender: ['male'],
      age: 22,
      height: 180,
      headRatio: 8,
      bodyType: 55,
      hairStyle: ['two-block cut'],
      hairColor: { h: 30, s: 60, l: 65 },
      eyeShape: ['sharp eyes'],
      eyeColor: { h: 30, s: 40, l: 30 },
      expression: ['charismatic', 'smirk'],
      skinTone: { h: 25, s: 30, l: 88 },
      topLayer1: ['crop top'],
      topLayer1Color: { h: 0, s: 0, l: 10 },
      topLayer2: ['jacket'],
      topLayer2Color: { h: 0, s: 0, l: 5 },
      bottom: ['leather pants'],
      bottomColor: { h: 0, s: 0, l: 8 },
      accessory: ['earrings', 'chain necklace'],
      bodyPose: ['cool pose'],
      mood: ['stylish', 'edgy'],
    },
  },
  {
    name: '💜 K-POP여돌',
    icon: '💜',
    data: {
      artStyle: ['semi realistic'],
      quality: ['masterpiece', 'best quality', 'soft lighting'],
      gender: ['female'],
      age: 20,
      height: 167,
      headRatio: 7.5,
      hairStyle: ['long hair', 'wavy hair'],
      hairBangs: ['curtain bangs'],
      hairColor: { h: 330, s: 40, l: 45 },
      eyeSize: 60,
      eyeColor: { h: 30, s: 50, l: 35 },
      expression: ['cute', 'wink'],
      skinTone: { h: 25, s: 25, l: 92 },
      topLayer1: ['crop top'],
      topLayer1Color: { h: 280, s: 60, l: 70 },
      bottom: ['mini skirt'],
      bottomColor: { h: 0, s: 0, l: 15 },
      socks: ['thigh high'],
      shoes: ['platform boots'],
      accessory: ['choker', 'earrings'],
      bodyPose: ['cute pose'],
      mood: ['vibrant', 'energetic'],
    },
  },
  {
    name: '🖼️ 미술작품풍',
    icon: '🖼️',
    data: {
      artStyle: ['oil painting', 'classical art'],
      quality: ['masterpiece', 'museum quality', 'fine art'],
      gender: ['female'],
      age: 25,
      hairStyle: ['very long hair', 'flowing'],
      hairColor: { h: 30, s: 40, l: 25 },
      eyeColor: { h: 30, s: 50, l: 40 },
      expression: ['serene', 'thoughtful'],
      topLayer1: ['elegant dress'],
      topLayer1Color: { h: 220, s: 50, l: 40 },
      accessory: ['pearl earrings'],
      bodyPose: ['elegant pose'],
      viewAngle: ['portrait'],
      mood: ['classical', 'timeless'],
    },
  },
]

export const BG_PRESETS: Preset[] = [
  // === 🔥 인기 로맨스 배경 ===
  {
    name: '🌃 시티뷰야경',
    icon: '🌃',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'best quality', '8k', 'cinematic'],
      location: ['penthouse balcony'],
      building: ['skyscrapers', 'city lights'],
      timeOfDay: 90,
      lightType: ['neon lights', 'ambient glow'],
      saturation: 65,
      mood: ['romantic', 'luxurious'],
    },
  },
  {
    name: '🏛️ 유럽궁전',
    icon: '🏛️',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'ornate details', 'grand scale'],
      interior: ['palace hall'],
      lightType: ['chandelier', 'golden light'],
      lightTemp: 75,
      mood: ['luxurious', 'elegant'],
    },
  },
  {
    name: '🌹 장미정원',
    icon: '🌹',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'best quality', 'detailed flowers'],
      location: ['garden'],
      foreground: ['rose bushes', 'flowers'],
      lightType: ['soft sunlight'],
      timeOfDay: 45,
      lightTemp: 65,
      mood: ['romantic', 'dreamy'],
    },
  },
  {
    name: '☕ 고급카페',
    icon: '☕',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'cozy atmosphere'],
      interior: ['luxury cafe'],
      lightType: ['warm ambient'],
      lightTemp: 70,
      saturation: 50,
      mood: ['cozy', 'intimate'],
    },
  },
  // === 🎓 학원물 배경 ===
  {
    name: '📚 방과후교실',
    icon: '📚',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'golden hour lighting'],
      interior: ['empty classroom'],
      lightType: ['sunset through window'],
      timeOfDay: 70,
      lightTemp: 75,
      mood: ['nostalgic', 'warm'],
    },
  },
  {
    name: '🌸 벚꽃통학로',
    icon: '🌸',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'particle effects', 'petals falling'],
      location: ['cherry blossom street'],
      foreground: ['cherry trees', 'falling petals'],
      lightType: ['soft spring light'],
      timeOfDay: 45,
      mood: ['romantic', 'spring'],
    },
  },
  {
    name: '🏫 학교옥상',
    icon: '🏫',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'wide angle'],
      location: ['school rooftop'],
      farBg: ['city skyline'],
      lightType: ['natural light'],
      timeOfDay: 50,
      mood: ['nostalgic', 'peaceful'],
    },
  },
  // === ⚔️ 판타지 배경 ===
  {
    name: '🏰 마왕성',
    icon: '🏰',
    data: {
      artStyle: ['concept art', 'dark fantasy'],
      quality: ['masterpiece', 'highly detailed', 'epic scale'],
      building: ['dark castle', 'gothic architecture'],
      farBg: ['storm clouds', 'lightning'],
      timeOfDay: 85,
      lightType: ['dramatic lighting', 'red glow'],
      mood: ['ominous', 'epic'],
    },
  },
  {
    name: '✨ 마법숲',
    icon: '✨',
    data: {
      artStyle: ['fantasy art'],
      quality: ['masterpiece', 'magical particles', 'bioluminescent'],
      location: ['enchanted forest'],
      foreground: ['glowing mushrooms', 'magical plants'],
      lightType: ['ethereal glow'],
      timeOfDay: 80,
      mood: ['mystical', 'magical'],
    },
  },
  {
    name: '🐉 용의둥지',
    icon: '🐉',
    data: {
      artStyle: ['concept art'],
      quality: ['masterpiece', 'epic scale', 'dramatic'],
      location: ['dragon lair'],
      farBg: ['volcanic mountains'],
      lightType: ['fire glow', 'lava light'],
      mood: ['dangerous', 'epic'],
    },
  },
  // === 🌟 분위기 배경 ===
  {
    name: '🌅 황금시간',
    icon: '🌅',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'lens flare', 'golden hour'],
      location: ['rooftop'],
      farBg: ['sunset sky'],
      timeOfDay: 72,
      lightType: ['backlight', 'rim light'],
      lightTemp: 85,
      mood: ['emotional', 'cinematic'],
    },
  },
  {
    name: '🌧️ 비오는거리',
    icon: '🌧️',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'rain effects', 'reflections'],
      location: ['city street'],
      weather: ['rain', 'wet ground'],
      timeOfDay: 65,
      lightType: ['street lights', 'neon reflections'],
      mood: ['melancholic', 'atmospheric'],
    },
  },
  {
    name: '❄️ 겨울눈길',
    icon: '❄️',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'snow particles', 'cold atmosphere'],
      location: ['snowy street'],
      weather: ['snowfall'],
      lightType: ['soft winter light'],
      timeOfDay: 55,
      mood: ['peaceful', 'cold'],
    },
  },
  {
    name: '🌙 달빛아래',
    icon: '🌙',
    data: {
      artStyle: ['webtoon style'],
      quality: ['masterpiece', 'moonlit', 'atmospheric'],
      location: ['garden'],
      timeOfDay: 95,
      lightType: ['moonlight', 'soft shadows'],
      mood: ['mysterious', 'romantic'],
    },
  },
]

// 참조 이미지 유형
export const REF_TYPES = [
  { val: 'style', name: '🎨화풍', desc: '그림체/분위기 참조' },
  { val: 'pose', name: '🏃포즈', desc: '자세/구도 참조' },
  { val: 'outfit', name: '👕의상', desc: '옷/복장 참조' },
  { val: 'color', name: '🌈색감', desc: '색상 팔레트 참조' },
  { val: 'face', name: '👤얼굴', desc: '얼굴/표정 참조' },
  { val: 'bg', name: '🏞️배경', desc: '배경 구성 참조' },
  { val: 'all', name: '📷전체', desc: '모든 요소 참조' },
]
