#!/usr/bin/env node

/**
 * 전체 Critical 기능 검증 스크립트
 *
 * .claude/lessons-learned.md의 모든 CRITICAL 항목을 검증합니다.
 *
 * 사용법: npm run verify-all
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 전체 Critical 기능 검증 시작...\n');

const errors = [];
const warnings = [];
let totalChecks = 0;
let passedChecks = 0;

// ========================================
// 1. Gemini 모델 검증
// ========================================
console.log('📊 [1/5] Gemini 모델 검증...');
totalChecks++;

try {
  const popupHtmlPath = path.join(__dirname, '../n8n/popup.html');
  const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

  // gemini-2.5-flash-lite 존재 확인
  if (!popupHtml.includes('gemini-2.5-flash-lite')) {
    errors.push('❌ CRITICAL: gemini-2.5-flash-lite not found in popup.html!');
    errors.push('  위치: popup.html에서 모델 선택 옵션');
    errors.push('  해결: <option value="gemini-2.5-flash-lite" selected> 추가');
  } else {
    console.log('  ✅ gemini-2.5-flash-lite 존재 확인');
    passedChecks++;
  }

  // selected 속성 확인
  if (!popupHtml.includes('gemini-2.5-flash-lite" selected')) {
    warnings.push('⚠️  gemini-2.5-flash-lite가 기본 선택이 아닙니다');
  } else {
    console.log('  ✅ 기본 모델로 설정됨');
  }

  // config/models.js 확인
  const modelsConfigPath = path.join(__dirname, '../n8n/config/models.js');
  if (fs.existsSync(modelsConfigPath)) {
    const modelsConfig = fs.readFileSync(modelsConfigPath, 'utf8');
    if (modelsConfig.includes('gemini-2.5-flash-lite')) {
      console.log('  ✅ config/models.js에 하드코딩됨');
    } else {
      warnings.push('⚠️  config/models.js에 gemini-2.5-flash-lite 없음');
    }
  } else {
    warnings.push('⚠️  config/models.js 파일이 없습니다');
  }

} catch (error) {
  errors.push(`❌ Gemini 모델 검증 실패: ${error.message}`);
}

console.log('');

// ========================================
// 2. YouTube 노드 검증 (재귀 탐색)
// ========================================
console.log('📊 [2/5] YouTube 노드 탐색 로직 검증...');
totalChecks++;

try {
  const backgroundPath = path.join(__dirname, '../n8n/background.js');
  const backgroundJs = fs.readFileSync(backgroundPath, 'utf8');

  // 재귀 탐색 로직 확인
  if (!backgroundJs.includes('subDirPromises')) {
    errors.push('❌ CRITICAL: 재귀 디렉토리 탐색 로직이 없습니다!');
    errors.push('  위치: background.js의 fetchN8NDocs()');
    errors.push('  해결: 서브디렉토리 탐색 코드 추가 필요');
  } else {
    console.log('  ✅ 재귀 디렉토리 탐색 로직 존재');
    passedChecks++;
  }

  // YouTube 확인 로직
  if (!backgroundJs.includes('hasYouTube')) {
    warnings.push('⚠️  YouTube 존재 확인 로직이 없습니다');
  } else {
    console.log('  ✅ YouTube 확인 로직 존재');
  }

  // 경고 메시지
  if (!backgroundJs.includes('YouTube not found in docs')) {
    warnings.push('⚠️  YouTube 미발견 시 경고 메시지 없음');
  } else {
    console.log('  ✅ YouTube 미발견 경고 존재');
  }

} catch (error) {
  errors.push(`❌ YouTube 노드 검증 실패: ${error.message}`);
}

console.log('');

// ========================================
// 3. Fuzzy Matching 검증
// ========================================
console.log('📊 [3/5] Fuzzy Matching 로직 검증...');
totalChecks++;

try {
  const contentPath = path.join(__dirname, '../n8n/content.js');
  const contentJs = fs.readFileSync(contentPath, 'utf8');

  // Levenshtein distance 함수
  if (!contentJs.includes('getEditDistance')) {
    errors.push('❌ CRITICAL: Levenshtein distance 함수가 없습니다!');
    errors.push('  위치: content.js');
    errors.push('  해결: getEditDistance() 함수 추가 필요');
  } else {
    console.log('  ✅ getEditDistance() 함수 존재');
    passedChecks++;
  }

  // Similarity score 함수
  if (!contentJs.includes('getSimilarityScore')) {
    errors.push('❌ CRITICAL: getSimilarityScore 함수가 없습니다!');
  } else {
    console.log('  ✅ getSimilarityScore() 함수 존재');
  }

  // Best matching 함수
  if (!contentJs.includes('findBestMatchingField')) {
    errors.push('❌ CRITICAL: findBestMatchingField 함수가 없습니다!');
  } else {
    console.log('  ✅ findBestMatchingField() 함수 존재');
  }

  // 임계값 확인
  if (!contentJs.includes('threshold = 0.5')) {
    warnings.push('⚠️  임계값이 0.5가 아닙니다 (권장: 0.5)');
  } else {
    console.log('  ✅ 임계값 0.5 설정됨');
  }

  // 출처 명시 확인
  if (!contentJs.includes('andrei-m/982927')) {
    warnings.push('⚠️  GitHub 출처가 명시되지 않았습니다');
  } else {
    console.log('  ✅ GitHub 출처 명시됨');
  }

} catch (error) {
  errors.push(`❌ Fuzzy Matching 검증 실패: ${error.message}`);
}

console.log('');

// ========================================
// 4. 메타데이터 필터링 검증
// ========================================
console.log('📊 [4/5] 메타데이터 필터링 검증...');
totalChecks++;

try {
  const contentPath = path.join(__dirname, '../n8n/content.js');
  const contentJs = fs.readFileSync(contentPath, 'utf8');

  // 메타데이터 키 목록
  const requiredMetadataKeys = ['parameters', 'type', 'nodeName', 'nodeType', 'version', 'id', 'name', 'position'];

  if (!contentJs.includes('metadataKeys')) {
    errors.push('❌ CRITICAL: 메타데이터 필터링이 없습니다!');
    errors.push('  위치: content.js의 autoFillNodeFields()');
  } else {
    console.log('  ✅ metadataKeys 변수 존재');

    // 각 키 확인
    let missingKeys = [];
    requiredMetadataKeys.forEach(key => {
      if (!contentJs.includes(`'${key}'`)) {
        missingKeys.push(key);
      }
    });

    if (missingKeys.length > 0) {
      warnings.push(`⚠️  누락된 메타데이터 키: ${missingKeys.join(', ')}`);
    } else {
      console.log('  ✅ 모든 메타데이터 키 존재');
      passedChecks++;
    }
  }

} catch (error) {
  errors.push(`❌ 메타데이터 필터링 검증 실패: ${error.message}`);
}

console.log('');

// ========================================
// 5. 타임아웃 로직 검증
// ========================================
console.log('📊 [5/5] 타임아웃 로직 검증...');
totalChecks++;

try {
  const popupJsPath = path.join(__dirname, '../n8n/popup.js');
  const popupJs = fs.readFileSync(popupJsPath, 'utf8');

  // AbortController 사용 확인
  if (!popupJs.includes('AbortController')) {
    errors.push('❌ CRITICAL: 타임아웃 로직이 없습니다!');
    errors.push('  위치: popup.js의 testN8nConnection()');
  } else {
    console.log('  ✅ AbortController 사용');
    passedChecks++;
  }

  // finally 블록 확인
  if (!popupJs.includes('finally')) {
    warnings.push('⚠️  finally 블록이 없습니다 (버튼 복구 안 될 수 있음)');
  } else {
    console.log('  ✅ finally 블록 존재 (버튼 복구 보장)');
  }

} catch (error) {
  errors.push(`❌ 타임아웃 로직 검증 실패: ${error.message}`);
}

console.log('');

// ========================================
// 결과 출력
// ========================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 검증 결과\n');

console.log(`총 검사 항목: ${totalChecks}`);
console.log(`통과: ${passedChecks}/${totalChecks}`);
console.log(`실패: ${errors.length}`);
console.log(`경고: ${warnings.length}`);
console.log('');

if (errors.length > 0) {
  console.log('🔴 치명적 오류:\n');
  errors.forEach(err => console.log(err));
  console.log('');
}

if (warnings.length > 0) {
  console.log('🟡 경고:\n');
  warnings.forEach(warn => console.log(warn));
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (errors.length === 0) {
  console.log('\n✅ 모든 Critical 기능이 정상입니다!\n');
  process.exit(0);
} else {
  console.log('\n❌ Critical 기능에 문제가 있습니다. 즉시 수정하세요!\n');
  console.log('💡 .claude/lessons-learned.md를 참고하세요\n');
  process.exit(1);
}
