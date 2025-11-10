/**
 * N8N AI Copilot - Real-time Guided Fixing
 * MutationObserver 기반 실시간 가이드 시스템
 *
 * 사용자의 수동 작업을 실시간으로 감지하여 단계별 진행 상황을 추적합니다.
 * 토큰 사용: 0 (로컬 JavaScript만 사용)
 */

// Debounce 유틸리티 (content.js에도 있지만 독립 실행을 위해 포함)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

class RealTimeGuide {
  constructor() {
    this.steps = [];
    this.currentStepIndex = 0;
    this.isActive = false;
    this.observer = null;
    this.checkInterval = null;
    this.pattern = null;

    // 단계 완료 콜백
    this.onStepCompleted = null;
    this.onAllCompleted = null;

    // Debounced 체크 함수 (300ms)
    this.debouncedCheck = debounce(() => {
      this.checkCurrentStep();
    }, 300);
  }

  /**
   * 가이드 시작
   * @param {Object} pattern - 패턴 객체 (manualSteps 포함)
   * @param {Object} options - { onStepCompleted, onAllCompleted }
   */
  start(pattern, options = {}) {
    console.log('🚀 Starting real-time guide for pattern:', pattern.id);

    this.pattern = pattern;
    this.steps = pattern.manualSteps || [];
    this.currentStepIndex = 0;
    this.isActive = true;
    this.onStepCompleted = options.onStepCompleted;
    this.onAllCompleted = options.onAllCompleted;

    if (this.steps.length === 0) {
      console.warn('⚠️ No manual steps found in pattern');
      return;
    }

    // MutationObserver 시작
    this.startObserver();

    // 주기적 체크 (500ms마다)
    this.checkInterval = setInterval(() => {
      this.checkCurrentStep();
    }, 500);

    console.log(`✅ Guide started with ${this.steps.length} steps`);
    return this.getCurrentStep();
  }

  /**
   * 가이드 정지
   */
  stop() {
    console.log('🛑 Stopping real-time guide');

    this.isActive = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * MutationObserver 시작
   */
  startObserver() {
    // 이미 실행 중이면 중단
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      // DOM 변경 발생 시 debounced 체크 (300ms 내 중복 호출 방지)
      this.debouncedCheck();
    });

    // document 전체를 감시 (subtree: 하위 요소 포함)
    this.observer.observe(document.body, {
      childList: true,      // 자식 노드 추가/제거
      subtree: true,        // 모든 하위 노드 감시
      attributes: true,     // 속성 변경
      characterData: false  // 텍스트 변경 (성능 최적화)
    });

    console.log('👁️ MutationObserver started');
  }

  /**
   * 현재 단계 체크
   */
  checkCurrentStep() {
    if (!this.isActive || this.currentStepIndex >= this.steps.length) {
      return;
    }

    const currentStep = this.steps[this.currentStepIndex];

    if (this.isStepCompleted(currentStep)) {
      console.log(`✅ Step ${this.currentStepIndex + 1} completed:`, currentStep.description);

      // 콜백 실행
      if (this.onStepCompleted) {
        this.onStepCompleted(this.currentStepIndex, currentStep);
      }

      // 다음 단계로 이동
      this.currentStepIndex++;

      // 모든 단계 완료 확인
      if (this.currentStepIndex >= this.steps.length) {
        console.log('🎉 All steps completed!');
        this.isActive = false;

        if (this.onAllCompleted) {
          this.onAllCompleted();
        }

        this.stop();
      }
    }
  }

  /**
   * 단계 완료 여부 확인
   * @param {Object} step - 단계 객체
   * @returns {boolean}
   */
  isStepCompleted(step) {
    const { target, action } = step;

    switch (target) {
      case 'node':
        return this.checkNodeAction(step);

      case 'code':
        return this.checkCodeAction(step);

      case 'input':
      case 'expression':
        return this.checkInputAction(step);

      case 'button':
        return this.checkButtonAction(step);

      case 'tab':
        return this.checkTabAction(step);

      case 'select':
        return this.checkSelectAction(step);

      case 'form':
        return this.checkFormAction(step);

      case 'user_confirmation':
        // 사용자 확인은 수동으로만 가능
        return false;

      default:
        console.warn(`⚠️ Unknown target type: ${target}`);
        return false;
    }
  }

  /**
   * 노드 클릭 확인
   */
  checkNodeAction(step) {
    // 설정 패널이 열려있는지 확인
    const settingsPanel = safeSelector.find('settingsPanel', document, true);
    return !!settingsPanel;
  }

  /**
   * 코드 변경 확인
   */
  checkCodeAction(step) {
    const { searchText, before, after } = step;

    // SafeSelector로 코드 에디터 찾기
    const settingsPanel = safeSelector.find('settingsPanel', document, true);
    if (!settingsPanel) return false;

    const codeEditor = safeSelector.find('codeEditor', settingsPanel, true);
    if (!codeEditor) return false;

    // Monaco 에디터에서 코드 읽기
    const reader = new N8NReader();
    const code = reader.getCodeFromNode(''); // 현재 열린 노드의 코드

    if (!code) return false;

    // 변경 확인
    if (searchText) {
      // 특정 텍스트가 없어졌는지 확인
      return !code.includes(searchText);
    }

    if (before && after) {
      // before가 사라지고 after가 나타났는지 확인
      return !code.includes(before) && code.includes(after);
    }

    return false;
  }

  /**
   * 입력 필드 변경 확인
   */
  checkInputAction(step) {
    const { fieldName, value } = step;

    // 설정 패널에서 해당 필드 찾기
    const settingsPanel = safeSelector.find('settingsPanel', document, true);
    if (!settingsPanel) return false;

    // 모든 입력 필드 검색
    const inputs = settingsPanel.querySelectorAll('input, textarea');

    for (const input of inputs) {
      const label = this.getInputLabel(input);

      if (label && label.toLowerCase().includes(fieldName?.toLowerCase() || '')) {
        // 값이 설정되었는지 확인
        if (value) {
          return input.value.includes(value);
        } else {
          // 값이 있기만 하면 됨
          return input.value.trim().length > 0;
        }
      }
    }

    return false;
  }

  /**
   * 버튼 클릭 확인
   */
  checkButtonAction(step) {
    // 버튼 클릭은 직접 감지하기 어려우므로
    // 결과적인 상태 변화를 확인
    const { buttonText } = step;

    if (buttonText === 'Settings') {
      // Settings 탭이 활성화되었는지 확인
      const settingsTab = Array.from(document.querySelectorAll('[role="tab"]'))
        .find(tab => tab.textContent.includes('Settings'));

      return settingsTab?.getAttribute('aria-selected') === 'true';
    }

    // 기타 버튼은 일단 false 반환
    return false;
  }

  /**
   * 탭 전환 확인
   */
  checkTabAction(step) {
    const { targetText } = step;

    const tabs = document.querySelectorAll('[role="tab"]');

    for (const tab of tabs) {
      if (tab.textContent.includes(targetText || '')) {
        return tab.getAttribute('aria-selected') === 'true';
      }
    }

    return false;
  }

  /**
   * Select 변경 확인
   */
  checkSelectAction(step) {
    const { fieldName, value } = step;

    const settingsPanel = safeSelector.find('settingsPanel', document, true);
    if (!settingsPanel) return false;

    const selects = settingsPanel.querySelectorAll('select');

    for (const select of selects) {
      const label = this.getInputLabel(select);

      if (label && label.toLowerCase().includes(fieldName?.toLowerCase() || '')) {
        if (value) {
          return select.value === value ||
                 select.options[select.selectedIndex]?.text === value;
        } else {
          return select.selectedIndex > 0; // 기본값 아닌 것 선택
        }
      }
    }

    return false;
  }

  /**
   * 폼 입력 확인
   */
  checkFormAction(step) {
    const { fields } = step;

    if (!fields || fields.length === 0) return false;

    const settingsPanel = safeSelector.find('settingsPanel', document, true);
    if (!settingsPanel) return false;

    // 모든 필드가 입력되었는지 확인
    for (const fieldName of fields) {
      const input = Array.from(settingsPanel.querySelectorAll('input, textarea'))
        .find(inp => {
          const label = this.getInputLabel(inp);
          return label && label.toLowerCase().includes(fieldName.toLowerCase());
        });

      if (!input || input.value.trim().length === 0) {
        return false; // 하나라도 비어있으면 미완료
      }
    }

    return true;
  }

  /**
   * 입력 필드의 라벨 가져오기
   */
  getInputLabel(inputElement) {
    // 가장 가까운 label
    const label = inputElement.closest('label');
    if (label && label.textContent.trim()) {
      return label.textContent.trim();
    }

    // 이전 형제 label
    const prevLabel = inputElement.previousElementSibling;
    if (prevLabel && prevLabel.tagName === 'LABEL') {
      return prevLabel.textContent.trim();
    }

    // 부모 요소의 label
    const parent = inputElement.parentElement;
    if (parent) {
      const parentLabel = parent.querySelector('label');
      if (parentLabel) {
        return parentLabel.textContent.trim();
      }
    }

    return null;
  }

  /**
   * 현재 단계 정보 가져오기
   */
  getCurrentStep() {
    if (this.currentStepIndex >= this.steps.length) {
      return null;
    }

    return {
      index: this.currentStepIndex,
      total: this.steps.length,
      step: this.steps[this.currentStepIndex],
      percentage: Math.round((this.currentStepIndex / this.steps.length) * 100)
    };
  }

  /**
   * 다음 단계로 강제 이동 (수동 진행)
   */
  forceNextStep() {
    if (this.currentStepIndex < this.steps.length) {
      console.log('⏭️ Forcing next step...');

      if (this.onStepCompleted) {
        this.onStepCompleted(this.currentStepIndex, this.steps[this.currentStepIndex]);
      }

      this.currentStepIndex++;

      if (this.currentStepIndex >= this.steps.length) {
        if (this.onAllCompleted) {
          this.onAllCompleted();
        }
        this.stop();
      }
    }
  }
}


// ========================================
// 전역 인스턴스 생성
// ========================================

window.realTimeGuide = new RealTimeGuide();

console.log('✅ Real-time guide system loaded');
