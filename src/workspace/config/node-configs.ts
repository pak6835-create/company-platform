import { NodeConfig, PromptCategoryData } from '../types'
import { SCENE_NODE_DATA, CHARACTER_NODE_DATA, PROPS_NODE_DATA, NODE_COLORS } from '../../components/nodes/node-data'

// 프롬프트 노드 데이터
export const PROMPT_NODE_DATA: { [key: string]: PromptCategoryData } = {
  scene: SCENE_NODE_DATA,
  character: CHARACTER_NODE_DATA,
  props: PROPS_NODE_DATA,
}

export const PROMPT_COLORS = NODE_COLORS

export const PROMPT_TITLES: { [key: string]: string } = {
  scene: '🎬 장면',
  character: '🧑 캐릭터',
  props: '🎒 소품',
}

// 참조 노드 설정
export const REFERENCE_NODE_CONFIG: { [key: string]: NodeConfig } = {
  pose: {
    title: '🏃 포즈 참조',
    color: '#4CAF50',
    options: [
      { id: 'pose_exact', label: '정확히', prompt: 'exact same pose as reference' },
      { id: 'pose_similar', label: '비슷하게', prompt: 'similar pose to reference' },
      { id: 'pose_mirror', label: '좌우반전', prompt: 'mirrored pose from reference' },
    ],
  },
  character: {
    title: '👤 캐릭터 참조',
    color: '#2196F3',
    options: [
      { id: 'char_same', label: '동일인물', prompt: 'same character, consistent appearance' },
      { id: 'char_outfit', label: '의상만변경', prompt: 'same character, different outfit' },
      { id: 'char_emotion', label: '표정만변경', prompt: 'same character, different expression' },
    ],
  },
  style: {
    title: '🎨 스타일 참조',
    color: '#9C27B0',
    options: [
      { id: 'style_exact', label: '동일스타일', prompt: 'exact same art style as reference' },
      { id: 'style_color', label: '색감만', prompt: 'same color palette as reference' },
      { id: 'style_lineart', label: '선스타일', prompt: 'same line art style as reference' },
    ],
  },
  composition: {
    title: '📐 구도 참조',
    color: '#FF9800',
    options: [
      { id: 'comp_exact', label: '동일구도', prompt: 'exact same composition as reference' },
      { id: 'comp_layout', label: '레이아웃만', prompt: 'same layout as reference' },
      { id: 'comp_perspective', label: '원근법', prompt: 'same perspective as reference' },
    ],
  },
  background: {
    title: '🏞️ 배경 참조',
    color: '#00BCD4',
    options: [
      { id: 'bg_same', label: '동일배경', prompt: 'exact same background as reference' },
      { id: 'bg_time', label: '시간만변경', prompt: 'same background, different time of day' },
      { id: 'bg_weather', label: '날씨만변경', prompt: 'same background, different weather' },
    ],
  },
  object: {
    title: '📦 오브젝트 참조',
    color: '#795548',
    options: [
      { id: 'obj_same', label: '동일물체', prompt: 'exact same object as reference' },
      { id: 'obj_style', label: '스타일만', prompt: 'same object style as reference' },
      { id: 'obj_angle', label: '각도변경', prompt: 'same object from different angle' },
    ],
  },
}

// 후처리 노드 설정
export const POSTPROCESS_NODE_CONFIG: { [key: string]: NodeConfig } = {
  removeBackground: {
    title: '🔲 배경 제거',
    color: '#E91E63',
    options: [
      { id: 'bg_auto', label: '자동감지', prompt: 'automatic background removal' },
      { id: 'bg_subject', label: '주요피사체', prompt: 'keep main subject only' },
      { id: 'bg_soft', label: '부드러운엣지', prompt: 'soft edge background removal' },
    ],
  },
  extractLine: {
    title: '✏️ 라인 추출',
    color: '#607D8B',
    options: [
      { id: 'line_thin', label: '가는선', prompt: 'thin line art extraction' },
      { id: 'line_medium', label: '중간선', prompt: 'medium line art extraction' },
      { id: 'line_thick', label: '굵은선', prompt: 'thick line art extraction' },
    ],
  },
  materialID: {
    title: '🏷️ 재질맵',
    color: '#9C27B0',
    options: [
      { id: 'mat_skin', label: '피부', prompt: 'skin material separation' },
      { id: 'mat_hair', label: '머리카락', prompt: 'hair material separation' },
      { id: 'mat_cloth', label: '옷', prompt: 'clothing material separation' },
    ],
  },
  upscale: {
    title: '🔍 업스케일',
    color: '#2196F3',
    options: [
      { id: 'up_2x', label: '2배', prompt: '2x upscale' },
      { id: 'up_4x', label: '4배', prompt: '4x upscale' },
      { id: 'up_detail', label: '디테일강화', prompt: 'detail enhancement upscale' },
    ],
  },
  stylize: {
    title: '✨ 스타일 변환',
    color: '#FF9800',
    options: [
      { id: 'sty_anime', label: '애니메이션', prompt: 'convert to anime style' },
      { id: 'sty_watercolor', label: '수채화', prompt: 'convert to watercolor style' },
      { id: 'sty_pixel', label: '픽셀', prompt: 'convert to pixel art' },
    ],
  },
}

// 노트 색상 옵션
export const NOTE_COLORS = [
  { name: '노랑', color: '#fef3c7' },
  { name: '파랑', color: '#dbeafe' },
  { name: '초록', color: '#dcfce7' },
  { name: '분홍', color: '#fce7f3' },
  { name: '보라', color: '#ede9fe' },
]

// 도형 색상 옵션
export const SHAPE_COLORS = [
  { name: '파랑', color: '#3b82f6' },
  { name: '빨강', color: '#ef4444' },
  { name: '초록', color: '#22c55e' },
  { name: '노랑', color: '#eab308' },
  { name: '보라', color: '#a855f7' },
  { name: '회색', color: '#6b7280' },
]
