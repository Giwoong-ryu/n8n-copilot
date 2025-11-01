/**
 * AI 모델 설정 - 이 파일은 직접 수정하지 마세요!
 * 모델 추가/제거는 이 파일에서만 관리합니다.
 */

// ⚠️ 중요: 이 파일의 모델 목록을 변경할 때는 반드시 주석으로 이유를 남기세요!
// 날짜와 변경 이유를 기록하세요.

// Gemini 모델 (2025-11-01 기준)
export const GEMINI_MODELS = [
  {
    value: 'gemini-2.5-flash-lite',
    label: '🚀 Gemini 2.5 Flash-Lite (무료 하루 1000번, 가장 빠름, 권장)',
    isDefault: true,
    added: '2025-10-15',
    verified: true, // 실제 작동 확인됨
    note: '사용자가 선호하는 모델'
  },
  {
    value: 'gemini-2.5-flash',
    label: '⭐ Gemini 2.5 Flash (무료 하루 250번)',
    isDefault: false,
    added: '2025-10-15',
    verified: true
  },
  {
    value: 'gemini-2.0-flash-exp',
    label: '🧪 Gemini 2.0 Flash Experimental (실험적)',
    isDefault: false,
    added: '2025-10-15',
    verified: true
  },
  {
    value: 'gemini-exp-1206',
    label: '🧪 Gemini Experimental 1206 (2024년 12월)',
    isDefault: false,
    added: '2025-10-15',
    verified: false
  }
];

// OpenAI 모델
export const OPENAI_MODELS = [
  {
    value: 'gpt-4o',
    label: '⭐ GPT-4o (최신, 권장)',
    isDefault: true,
    added: '2025-10-15',
    verified: true
  },
  {
    value: 'gpt-4o-mini',
    label: '🚀 GPT-4o Mini (빠르고 저렴)',
    isDefault: false,
    added: '2025-10-15',
    verified: true
  },
  {
    value: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    isDefault: false,
    added: '2025-10-15',
    verified: true
  }
];

// Claude 모델
export const CLAUDE_MODELS = [
  {
    value: 'claude-3-5-sonnet-20241022',
    label: '⭐ Claude 3.5 Sonnet (최신, 권장)',
    isDefault: true,
    added: '2025-10-15',
    verified: true
  },
  {
    value: 'claude-3-5-haiku-20241022',
    label: '🚀 Claude 3.5 Haiku (빠르고 저렴)',
    isDefault: false,
    added: '2025-10-15',
    verified: true
  },
  {
    value: 'claude-3-opus-20240229',
    label: 'Claude 3 Opus (가장 강력)',
    isDefault: false,
    added: '2025-10-15',
    verified: true
  }
];

// 기본 모델 가져오기
export function getDefaultModel(provider) {
  const models = {
    'gemini': GEMINI_MODELS,
    'openai': OPENAI_MODELS,
    'claude': CLAUDE_MODELS
  };

  const providerModels = models[provider] || GEMINI_MODELS;
  const defaultModel = providerModels.find(m => m.isDefault);
  return defaultModel ? defaultModel.value : providerModels[0].value;
}

// 검증: 모든 기본 모델이 존재하는지 확인
export function validateModels() {
  const allModels = [...GEMINI_MODELS, ...OPENAI_MODELS, ...CLAUDE_MODELS];
  const errors = [];

  // gemini-2.5-flash-lite가 반드시 있어야 함
  if (!GEMINI_MODELS.find(m => m.value === 'gemini-2.5-flash-lite')) {
    errors.push('❌ CRITICAL: gemini-2.5-flash-lite is missing!');
  }

  // 각 provider에 기본 모델이 있어야 함
  if (!GEMINI_MODELS.find(m => m.isDefault)) {
    errors.push('❌ No default Gemini model!');
  }
  if (!OPENAI_MODELS.find(m => m.isDefault)) {
    errors.push('❌ No default OpenAI model!');
  }
  if (!CLAUDE_MODELS.find(m => m.isDefault)) {
    errors.push('❌ No default Claude model!');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// 변경 이력
/*
2025-11-01: 초기 설정 - gemini-2.5-flash-lite를 기본 모델로 설정
- 사용자가 선호하는 모델이므로 절대 삭제하지 말 것!
*/
