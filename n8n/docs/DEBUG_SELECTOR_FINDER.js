/**
 * SafeSelector 디버깅 스크립트
 *
 * 사용법:
 * 1. N8N 페이지 접속
 * 2. 노드 하나를 클릭하여 설정 패널 열기
 * 3. F12 콘솔 열기
 * 4. 이 스크립트 전체를 복사하여 콘솔에 붙여넣기
 * 5. 결과를 확인하고 올바른 셀렉터 복사
 */

console.log('🔍 SafeSelector 디버깅 시작...\n');

// ==========================================
// 1. 설정 패널 (Settings Panel) 찾기
// ==========================================
console.log('📋 1. Settings Panel 찾기');
console.log('━'.repeat(50));

const settingsPanelCandidates = [
  // 기본 키워드
  { selector: '[class*="settings"]', name: 'settings (any case)' },
  { selector: '[class*="Settings"]', name: 'Settings (capital)' },
  { selector: '[class*="SETTINGS"]', name: 'SETTINGS (all caps)' },

  // 패널 키워드
  { selector: '[class*="panel"]', name: 'panel (any case)' },
  { selector: '[class*="Panel"]', name: 'Panel (capital)' },
  { selector: 'aside', name: 'aside tag' },
  { selector: '[role="complementary"]', name: 'role=complementary' },
  { selector: '[role="dialog"]', name: 'role=dialog' },

  // NDV (Node Detail View)
  { selector: '[class*="ndv"]', name: 'ndv (any case)' },
  { selector: '[class*="NDV"]', name: 'NDV (caps)' },
  { selector: '[class*="node-detail"]', name: 'node-detail' },
  { selector: '[class*="nodeDetail"]', name: 'nodeDetail (camelCase)' },

  // 사이드바
  { selector: '[class*="sidebar"]', name: 'sidebar' },
  { selector: '[class*="sidePanel"]', name: 'sidePanel' },
  { selector: '[class*="side-panel"]', name: 'side-panel (kebab)' },

  // 데이터 속성
  { selector: '[data-test-id*="panel"]', name: 'data-test-id with panel' },
  { selector: '[data-test-id*="node"]', name: 'data-test-id with node' },
  { selector: '[data-test-id*="settings"]', name: 'data-test-id with settings' },
];

const foundSettingsPanels = [];

settingsPanelCandidates.forEach(({ selector, name }) => {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ FOUND ${elements.length}x: ${selector} (${name})`);
      foundSettingsPanels.push({ selector, elements: Array.from(elements), name });

      // 처음 찾은 요소의 실제 클래스 출력
      const firstEl = elements[0];
      console.log(`   실제 클래스: "${firstEl.className}"`);
      console.log(`   태그: <${firstEl.tagName.toLowerCase()}>`);
      if (firstEl.id) console.log(`   ID: #${firstEl.id}`);
    }
  } catch (e) {
    console.warn(`⚠️ 잘못된 셀렉터: ${selector}`);
  }
});

if (foundSettingsPanels.length === 0) {
  console.error('❌ Settings Panel을 찾을 수 없습니다!');
  console.log('\n💡 수동 확인 방법:');
  console.log('1. 노드를 클릭하여 설정 패널 열기');
  console.log('2. 설정 패널 영역에서 우클릭 → 검사');
  console.log('3. 부모 요소들의 class/id 확인');
  console.log('4. 아래 명령으로 테스트:');
  console.log('   document.querySelector("여기에_클래스명_입력")');
} else {
  console.log(`\n✅ ${foundSettingsPanels.length}개 후보 발견!`);
}

console.log('\n');

// ==========================================
// 2. 코드 에디터 (Monaco Editor) 찾기
// ==========================================
console.log('📝 2. Code Editor 찾기');
console.log('━'.repeat(50));

const editorCandidates = [
  { selector: '.monaco-editor', name: 'Monaco Editor' },
  { selector: '[class*="monaco"]', name: 'monaco (any case)' },
  { selector: '.CodeMirror', name: 'CodeMirror' },
  { selector: '[class*="code-editor"]', name: 'code-editor' },
  { selector: '[class*="codeEditor"]', name: 'codeEditor (camelCase)' },
  { selector: 'textarea[class*="code"]', name: 'textarea with code' },
];

const foundEditors = [];

editorCandidates.forEach(({ selector, name }) => {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ FOUND ${elements.length}x: ${selector} (${name})`);
      foundEditors.push({ selector, elements: Array.from(elements), name });
    }
  } catch (e) {
    console.warn(`⚠️ 잘못된 셀렉터: ${selector}`);
  }
});

console.log(`\n${foundEditors.length > 0 ? '✅' : '❌'} ${foundEditors.length}개 에디터 발견`);
console.log('\n');

// ==========================================
// 3. 노드 요소들 찾기
// ==========================================
console.log('🔷 3. Canvas Nodes 찾기');
console.log('━'.repeat(50));

const nodeCandidates = [
  { selector: '[class*="node"]', name: 'node (any case)' },
  { selector: '[class*="Node"]', name: 'Node (capital)' },
  { selector: '[data-node-type]', name: 'data-node-type' },
  { selector: '[data-node-id]', name: 'data-node-id' },
  { selector: '[data-test-id*="canvas-node"]', name: 'canvas-node test id' },
];

const foundNodes = [];

nodeCandidates.forEach(({ selector, name }) => {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ FOUND ${elements.length}x: ${selector} (${name})`);
      foundNodes.push({ selector, elements: Array.from(elements), name });

      if (elements.length > 0 && elements.length < 20) {
        const firstEl = elements[0];
        console.log(`   첫 번째 노드 클래스: "${firstEl.className}"`);
      }
    }
  } catch (e) {
    console.warn(`⚠️ 잘못된 셀렉터: ${selector}`);
  }
});

console.log(`\n${foundNodes.length > 0 ? '✅' : '❌'} ${foundNodes.length}개 노드 셀렉터 발견`);
console.log('\n');

// ==========================================
// 4. 최종 추천 셀렉터 생성
// ==========================================
console.log('🎯 4. 최종 추천 셀렉터');
console.log('━'.repeat(50));

console.log('\n🔷 Settings Panel 추천:');
if (foundSettingsPanels.length > 0) {
  foundSettingsPanels.slice(0, 3).forEach(({ selector, elements }, index) => {
    console.log(`${index + 1}. ${selector}`);
    console.log(`   → ${elements.length}개 요소 매칭`);
  });

  console.log('\n💡 콘솔에서 테스트:');
  console.log(`window.safeSelector.addSelector('settingsPanel', '${foundSettingsPanels[0].selector}', 0)`);
} else {
  console.log('❌ 찾을 수 없음 - 수동 확인 필요');
}

console.log('\n🔷 Code Editor 추천:');
if (foundEditors.length > 0) {
  foundEditors.slice(0, 2).forEach(({ selector, elements }, index) => {
    console.log(`${index + 1}. ${selector}`);
  });

  console.log('\n💡 콘솔에서 테스트:');
  console.log(`window.safeSelector.addSelector('codeEditor', '${foundEditors[0].selector}', 0)`);
} else {
  console.log('❌ 찾을 수 없음 (Code 노드 열려있지 않을 수 있음)');
}

console.log('\n🔷 Canvas Nodes 추천:');
if (foundNodes.length > 0) {
  foundNodes.slice(0, 2).forEach(({ selector, elements }, index) => {
    console.log(`${index + 1}. ${selector}`);
    console.log(`   → ${elements.length}개 노드 매칭`);
  });

  console.log('\n💡 콘솔에서 테스트:');
  console.log(`window.safeSelector.addSelector('nodes', '${foundNodes[0].selector}', 0)`);
} else {
  console.log('❌ 찾을 수 없음');
}

// ==========================================
// 5. 전체 DOM 트리 분석 (선택 사항)
// ==========================================
console.log('\n\n📊 5. 전체 DOM 구조 스냅샷 (선택 사항)');
console.log('━'.repeat(50));
console.log('아래 명령을 실행하여 전체 구조 확인:');
console.log('');
console.log('document.body.outerHTML.match(/class="[^"]*"/g).slice(0, 50)');
console.log('');
console.log('또는 특정 영역만:');
console.log('');
console.log('// 설정 패널 영역의 모든 클래스');
if (foundSettingsPanels.length > 0) {
  console.log(`document.querySelector('${foundSettingsPanels[0].selector}').outerHTML.match(/class="[^"]*"/g)`);
}

console.log('\n');
console.log('🎉 디버깅 완료!');
console.log('위의 추천 셀렉터를 복사하여 SafeSelector에 추가하세요.');
