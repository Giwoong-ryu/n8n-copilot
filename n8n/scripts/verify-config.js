#!/usr/bin/env node

/**
 * 설정 검증 스크립트
 * 중요한 설정이 사라지지 않았는지 확인합니다.
 */

const fs = require('fs');
const path = require('path');

// 검증할 항목들
const REQUIRED_ITEMS = {
  'popup.html': [
    'gemini-2.5-flash-lite', // 사용자가 선호하는 모델
    'n8nUrl',                // N8N 연결 설정
    'n8nApiKey',             // N8N API Key
    'testN8nConnection'      // N8N 연결 테스트 버튼
  ],
  'popup.js': [
    'setupAutoSaveInputs',   // 자동 저장 기능
    'loadN8NSettings',       // N8N 설정 로드
    'testN8nConnection'      // N8N 연결 테스트
  ],
  'background.js': [
    'fetchN8NNodeTypes',     // N8N API 클라이언트
    'getRealTimeN8NNodeInfo' // 실시간 N8N 정보
  ]
};

console.log('🔍 Verifying critical configuration...\n');

let allValid = true;
const errors = [];

// 각 파일 검증
for (const [fileName, requiredItems] of Object.entries(REQUIRED_ITEMS)) {
  const filePath = path.join(__dirname, '..', fileName);

  if (!fs.existsSync(filePath)) {
    errors.push(`❌ File not found: ${fileName}`);
    allValid = false;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const missing = [];

  for (const item of requiredItems) {
    if (!content.includes(item)) {
      missing.push(item);
      allValid = false;
    }
  }

  if (missing.length > 0) {
    errors.push(`❌ ${fileName}: Missing ${missing.join(', ')}`);
  } else {
    console.log(`✅ ${fileName}: All items present`);
  }
}

console.log('');

if (allValid) {
  console.log('✅ All critical configurations are present!\n');
  process.exit(0);
} else {
  console.log('❌ VERIFICATION FAILED!\n');
  errors.forEach(err => console.log(err));
  console.log('\n⚠️  Some critical features may have been removed!');
  console.log('Please review recent changes before committing.\n');
  process.exit(1);
}
