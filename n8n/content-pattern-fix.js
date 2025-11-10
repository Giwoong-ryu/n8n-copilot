// ========================================
// 10. 패턴 기반 자동 수정 시스템
// ========================================

/**
 * 패턴 ID로 자동 수정 적용
 * @param {string} patternId - 패턴 ID (예: 'items_array_pattern')
 * @param {Object} options - 옵션 { nodeName, currentCode, autoApply }
 * @returns {Promise<Object>} - { success, message, appliedFix }
 */
async function applyFixPattern(patternId, options = {}) {
  console.log('🔧 Applying fix pattern:', patternId, options);

  // 패턴 가져오기
  const pattern = getPattern(patternId);

  if (!pattern) {
    return {
      success: false,
      message: `패턴을 찾을 수 없습니다: ${patternId}`
    };
  }

  // 자동 적용 가능한지 확인
  if (!pattern.autoApplicable) {
    console.log('⚠️ Pattern not auto-applicable, returning manual steps');
    return {
      success: false,
      requiresManual: true,
      pattern: pattern,
      message: '이 패턴은 수동 적용이 필요합니다.',
      manualSteps: pattern.manualSteps
    };
  }

  // 자동 수정 타입에 따라 분기
  switch (pattern.fixType) {
    case 'code':
      return await applyCodeFix(pattern, options);

    case 'expression':
      return await applyExpressionFix(pattern, options);

    case 'setting':
    case 'credential':
    case 'workflow_structure':
      return {
        success: false,
        requiresManual: true,
        pattern: pattern,
        message: '설정 변경은 수동으로 진행해야 합니다.',
        manualSteps: pattern.manualSteps
      };

    default:
      return {
        success: false,
        message: `지원하지 않는 수정 타입: ${pattern.fixType}`
      };
  }
}


/**
 * 코드 패턴 자동 수정
 */
async function applyCodeFix(pattern, options) {
  const { nodeName, currentCode, autoApply = false, nodeIndex = 0 } = options;

  console.log('💻 Applying code fix...', { nodeName, nodeIndex });

  // 1. 노드 이름 확인
  if (!nodeName) {
    return {
      success: false,
      message: '노드 이름이 필요합니다.'
    };
  }

  // 2. 재시도 로직이 포함된 노드 열기 (최대 3번 시도, 중복 노드 지원)
  try {
    const panel = await window.openNodeWithRetry(nodeName, 3, { index: nodeIndex });
    if (!panel) {
      throw new window.PanelOpenError(nodeName, 3);
    }
  } catch (error) {
    // 구조화된 에러면 추가 정보 제공
    if (error instanceof window.NodeNotFoundError || error instanceof window.PanelOpenError) {
      return {
        success: false,
        message: error.message,
        errorType: error.name,
        recoverable: error.recoverable,
        suggestedAction: error.suggestedAction
      };
    }

    return {
      success: false,
      message: `노드 열기 실패: ${error.message}`
    };
  }

  // 3. 현재 코드 읽기
  const reader = new N8NReader();
  let code = currentCode || reader.getCodeFromNode(nodeName);

  if (!code) {
    const error = new window.CodeReadError(nodeName, 'Monaco 에디터를 찾을 수 없거나 Code 노드가 아닙니다');
    return {
      success: false,
      message: error.message,
      errorType: error.name,
      recoverable: error.recoverable,
      suggestedAction: error.suggestedAction
    };
  }

  // 4. 패턴 매칭 및 수정
  const autoFix = pattern.autoFix;
  let modifiedCode = code;
  let changeCount = 0;

  if (autoFix.searchPattern && autoFix.replaceWith) {
    // Regex 기반 치환
    const matches = code.match(autoFix.searchPattern);
    if (matches) {
      changeCount = matches.length;
      modifiedCode = code.replace(autoFix.searchPattern, autoFix.replaceWith);
      console.log(`✅ Found ${changeCount} matches, replacing...`);
    } else {
      return {
        success: false,
        message: '수정할 패턴을 코드에서 찾을 수 없습니다.',
        expectedPattern: autoFix.searchPattern.toString()
      };
    }
  }

  // 5. 사용자 확인 (autoApply가 false인 경우)
  if (!autoApply) {
    return {
      success: false,
      requiresConfirmation: true,
      pattern: pattern,
      before: code,
      after: modifiedCode,
      changeCount: changeCount,
      message: '수정 사항을 확인하세요. 자동 적용하려면 "적용" 버튼을 클릭하세요.'
    };
  }

  // 6. 코드 적용
  const applied = await applyCodeToEditor(modifiedCode);

  if (!applied) {
    const error = new window.CodeApplicationError(nodeName, { reason: 'Monaco 에디터 접근 실패' });
    return {
      success: false,
      message: error.message,
      errorType: error.name,
      recoverable: error.recoverable,
      suggestedAction: error.suggestedAction
    };
  }

  // 7. 적용 후 검증 (Vue reactivity 업데이트 대기)
  await window.sleep(300);
  const actualCode = reader.getCodeFromNode(nodeName);

  if (actualCode) {
    // 더 정확한 검증: 변경 전 패턴이 제거되고 새 코드가 적용되었는지 확인
    const oldPatternRemoved = !autoFix.searchPattern.test(actualCode);
    const newCodeApplied = actualCode.includes(autoFix.replaceWith);

    if (oldPatternRemoved && newCodeApplied) {
      console.log('✅ Code verification passed - old pattern removed and new code applied');
      return {
        success: true,
        message: `✅ 패턴 수정 완료: ${changeCount}개 변경됨`,
        pattern: pattern,
        before: code,
        after: modifiedCode,
        changeCount: changeCount,
        verified: true
      };
    }
  }

  // 검증 실패 시
  console.error('❌ Code verification failed - changes not detected in editor');
  const error = new window.CodeVerificationError(
    nodeName,
    autoFix.replaceWith,
    actualCode ? actualCode.substring(0, 100) + '...' : 'null'
  );
  return {
    success: false,
    message: error.message,
    errorType: error.name,
    recoverable: error.recoverable,
    suggestedAction: error.suggestedAction,
    appliedButNotVerified: true,
    expected: error.expected,
    actual: error.actual
  };
}


/**
 * Expression 패턴 자동 수정
 */
async function applyExpressionFix(pattern, options) {
  console.log('📝 Applying expression fix...');

  const { fieldName, currentValue } = options;

  // Expression 필드 찾기
  const settingsPanel = safeSelector.find('settingsPanel');
  if (!settingsPanel) {
    return {
      success: false,
      message: '설정 패널을 찾을 수 없습니다.'
    };
  }

  // TODO: Expression 필드에 Optional chaining 추가
  // 현재는 수동 단계만 반환

  return {
    success: false,
    requiresManual: true,
    pattern: pattern,
    message: 'Expression 수정은 현재 수동으로만 가능합니다.',
    manualSteps: pattern.manualSteps
  };
}


/**
 * Monaco 에디터에 코드 적용
 */
async function applyCodeToEditor(code) {
  console.log('⌨️ Applying code to Monaco editor...');

  // SafeSelector로 Monaco 에디터 찾기
  const settingsPanel = safeSelector.find('settingsPanel');
  if (!settingsPanel) {
    console.error('❌ Settings panel not found');
    return false;
  }

  const monacoEditors = safeSelector.findAll('codeEditor', settingsPanel);
  if (monacoEditors.length === 0) {
    console.error('❌ Monaco editor not found');
    return false;
  }

  // 첫 번째 에디터 사용
  const editor = monacoEditors[0];

  // 방법 1: Monaco API 직접 사용 (가장 확실)
  try {
    // Monaco 인스턴스 찾기
    const monacoInstance = editor.querySelector('.monaco-editor');
    if (monacoInstance && monacoInstance.__editor) {
      const editorInstance = monacoInstance.__editor;
      editorInstance.setValue(code);
      console.log('✅ Code applied via Monaco API');
      return true;
    }
  } catch (e) {
    console.log('⚠️ Monaco API not available:', e.message);
  }

  // 방법 2: textarea에 직접 입력
  try {
    const textarea = editor.querySelector('textarea');
    if (textarea) {
      // 기존 값 지우기
      textarea.value = '';
      textarea.focus();

      // 새 값 입력
      textarea.value = code;

      // 이벤트 트리거
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.dispatchEvent(new Event('blur', { bubbles: true }));

      // Vue 업데이트 트리거
      if (textarea.__vueParentComponent) {
        textarea.__vueParentComponent.emit('update:modelValue', code);
      }

      console.log('✅ Code applied via textarea');
      return true;
    }
  } catch (e) {
    console.error('❌ Textarea method failed:', e);
  }

  // 방법 3: contentEditable 시도
  try {
    const viewLines = editor.querySelector('.view-lines');
    if (viewLines && viewLines.contentEditable) {
      viewLines.textContent = code;
      viewLines.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Code applied via contentEditable');
      return true;
    }
  } catch (e) {
    console.error('❌ contentEditable method failed:', e);
  }

  console.error('❌ All methods failed to apply code');
  return false;
}


// waitForPanel 함수는 content.js에서 전역으로 노출되므로 중복 제거
// window.waitForPanel 사용


// ========================================
// 패턴 적용 UI 함수 (sidebar-iframe.js와 연동)
// ========================================

/**
 * 패턴 수정 확인 UI 표시
 * @param {Object} patternResult - applyFixPattern의 결과
 */
function showPatternConfirmation(patternResult) {
  if (!patternResult.requiresConfirmation) {
    return;
  }

  const { pattern, before, after, changeCount } = patternResult;

  // sidebar에 메시지 전송
  sendMessageToIframe({
    type: 'pattern-confirmation',
    data: {
      patternId: pattern.id,
      title: pattern.title,
      description: pattern.description,
      before: before,
      after: after,
      changeCount: changeCount,
      explanation: pattern.explanation
    }
  });
}


/**
 * 수동 단계 UI 표시
 * @param {Object} patternResult - applyFixPattern의 결과
 */
function showManualSteps(patternResult) {
  if (!patternResult.requiresManual) {
    return;
  }

  const { pattern } = patternResult;

  // sidebar에 메시지 전송
  sendMessageToIframe({
    type: 'pattern-manual-steps',
    data: {
      patternId: pattern.id,
      title: pattern.title,
      description: pattern.description,
      steps: pattern.manualSteps,
      explanation: pattern.explanation
    }
  });
}


console.log('✅ Pattern-based fix system loaded');
