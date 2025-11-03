/**
 * N8N Documentation Updater
 * 1주일마다 N8N 공식 문서를 크롤링하여 Chrome Storage에 저장
 */

// ========================================
// 1. N8N 문서 소스
// ========================================

const N8N_DOCS_SOURCES = {
  // N8N 공식 GitHub API
  github_nodes: 'https://api.github.com/repos/n8n-io/n8n/contents/packages/nodes-base/nodes',

  // N8N 공식 문서 API (있다면)
  docs_api: 'https://docs.n8n.io/api/nodes',

  // 백업: N8N GitHub Raw 파일
  changelog: 'https://raw.githubusercontent.com/n8n-io/n8n/master/CHANGELOG.md'
};

// ========================================
// 2. 문서 크롤링 함수
// ========================================

async function fetchN8NNodes() {
  console.log('📥 Fetching N8N nodes from GitHub...');

  try {
    // GitHub API로 노드 목록 가져오기
    const response = await fetch(N8N_DOCS_SOURCES.github_nodes, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const nodes = await response.json();

    // 노드 이름 추출 (디렉토리만)
    const nodeList = nodes
      .filter(item => item.type === 'dir')
      .map(item => ({
        name: item.name,
        path: item.path,
        url: item.html_url
      }));

    console.log(`✅ Found ${nodeList.length} nodes`);

    // 각 노드의 operations도 가져오기 (샘플링: 처음 10개만)
    console.log('📥 Fetching operations for sample nodes...');
    const nodesWithOperations = await fetchNodeOperations(nodeList.slice(0, 10));

    return {
      allNodes: nodeList,
      detailedNodes: nodesWithOperations
    };

  } catch (error) {
    console.error('❌ Failed to fetch nodes:', error);
    return null;
  }
}

// 노드의 operations 가져오기
async function fetchNodeOperations(nodes) {
  const results = [];

  for (const node of nodes) {
    try {
      console.log(`  Fetching operations for ${node.name}...`);

      // 노드 폴더 내부 확인
      const nodeContentUrl = `https://api.github.com/repos/n8n-io/n8n/contents/${node.path}`;
      const nodeResponse = await fetch(nodeContentUrl, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (!nodeResponse.ok) continue;

      const nodeContent = await nodeResponse.json();

      // v2, v1 같은 버전 폴더 찾기
      const versionFolders = nodeContent
        .filter(item => item.type === 'dir' && /^v\d+$/.test(item.name))
        .sort((a, b) => b.name.localeCompare(a.name)); // v2, v1 순서

      let operations = [];

      // 최신 버전 폴더 확인
      if (versionFolders.length > 0) {
        const latestVersion = versionFolders[0];
        operations = await fetchOperationsFromVersion(latestVersion.path);
      } else {
        // 버전 폴더가 없으면 루트에서 확인
        operations = await fetchOperationsFromRoot(node.path);
      }

      results.push({
        name: node.name,
        operations: operations,
        hasOperations: operations.length > 0
      });

      // Rate limiting 방지 (GitHub API: 60 requests/hour)
      await sleep(100);

    } catch (error) {
      console.error(`  Failed to fetch operations for ${node.name}:`, error.message);
      results.push({
        name: node.name,
        operations: [],
        hasOperations: false
      });
    }
  }

  return results;
}

// 버전 폴더에서 operations 추출
async function fetchOperationsFromVersion(versionPath) {
  try {
    // actions 폴더 확인
    const actionsUrl = `https://api.github.com/repos/n8n-io/n8n/contents/${versionPath}/actions`;
    const actionsResponse = await fetch(actionsUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!actionsResponse.ok) return [];

    const actionsContent = await actionsResponse.json();
    const operations = [];

    // 각 리소스 폴더 확인 (record, base 등)
    for (const item of actionsContent) {
      if (item.type === 'dir') {
        const resourceOps = await fetchOperationsFromResource(item.path);
        operations.push(...resourceOps.map(op => `${item.name}:${op}`));
      }
    }

    return operations;
  } catch (error) {
    return [];
  }
}

// 리소스 폴더에서 operations 추출
async function fetchOperationsFromResource(resourcePath) {
  try {
    const resourceUrl = `https://api.github.com/repos/n8n-io/n8n/contents/${resourcePath}`;
    const resourceResponse = await fetch(resourceUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!resourceResponse.ok) return [];

    const resourceContent = await resourceResponse.json();

    // .operation.ts 파일들 찾기
    return resourceContent
      .filter(item => item.type === 'file' && item.name.endsWith('.operation.ts'))
      .map(item => {
        // create.operation.ts -> Create
        const opName = item.name
          .replace('.operation.ts', '')
          .replace(/([A-Z])/g, ' $1')
          .trim();
        return opName.charAt(0).toUpperCase() + opName.slice(1);
      });

  } catch (error) {
    return [];
  }
}

// 루트 폴더에서 operations 추출 (버전 폴더 없는 경우)
async function fetchOperationsFromRoot(nodePath) {
  // 간단한 구현: 파일 목록만 반환
  return [];
}

// Sleep 유틸리티
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchN8NChangelog() {
  console.log('📥 Fetching N8N changelog...');

  try {
    const response = await fetch(N8N_DOCS_SOURCES.changelog);

    if (!response.ok) {
      throw new Error(`Changelog fetch error: ${response.status}`);
    }

    const changelog = await response.text();

    // 최신 5개 버전만 추출
    const versions = changelog.split('\n## ').slice(0, 5);

    console.log('✅ Changelog fetched');
    return versions.join('\n## ');

  } catch (error) {
    console.error('❌ Failed to fetch changelog:', error);
    return null;
  }
}

// ========================================
// 3. 문서 저장 함수
// ========================================

async function saveDocsToStorage(nodesData, changelog) {
  console.log('💾 Saving docs to Chrome Storage...');

  const docsData = {
    // 전체 노드 목록 (간단)
    allNodes: nodesData?.allNodes || [],
    // 상세 노드 정보 (operations 포함)
    detailedNodes: nodesData?.detailedNodes || [],
    changelog: changelog,
    lastUpdated: new Date().toISOString(),
    version: '2.0', // 버전 업그레이드 (operations 추가)
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 후
  };

  try {
    await chrome.storage.local.set({ n8nDocs: docsData });
    console.log('✅ Docs saved successfully');
    console.log(`📊 All Nodes: ${docsData.allNodes.length}, Detailed: ${docsData.detailedNodes.length}`);
    console.log(`📊 Expires: ${docsData.expiresAt}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save docs:', error);
    return false;
  }
}

// ========================================
// 4. 문서 불러오기 함수
// ========================================

async function loadDocsFromStorage() {
  console.log('📖 Loading docs from Chrome Storage...');

  try {
    const result = await chrome.storage.local.get('n8nDocs');

    if (!result.n8nDocs) {
      console.log('⚠️ No docs found in storage');
      return null;
    }

    const docs = result.n8nDocs;
    const expiresAt = new Date(docs.expiresAt);
    const now = new Date();

    // 만료 체크
    if (now > expiresAt) {
      console.log('⚠️ Docs expired, need update');
      return null;
    }

    console.log(`✅ Docs loaded (${docs.nodes?.length || 0} nodes)`);
    return docs;

  } catch (error) {
    console.error('❌ Failed to load docs:', error);
    return null;
  }
}

// ========================================
// 5. 문서 업데이트 체크 및 실행
// ========================================

async function updateN8NDocs() {
  console.log('🔄 Starting N8N docs update...');

  // 1. 기존 문서 확인
  const existingDocs = await loadDocsFromStorage();

  if (existingDocs) {
    console.log('✅ Docs are still valid, no update needed');
    return existingDocs;
  }

  // 2. 새 문서 가져오기
  console.log('📥 Fetching new docs...');

  const [nodes, changelog] = await Promise.all([
    fetchN8NNodes(),
    fetchN8NChangelog()
  ]);

  if (!nodes && !changelog) {
    console.error('❌ Failed to fetch any docs');
    return null;
  }

  // 3. 저장
  await saveDocsToStorage(nodes, changelog);

  // 4. 반환
  return {
    nodes,
    changelog,
    lastUpdated: new Date().toISOString()
  };
}

// ========================================
// 6. 문서를 시스템 프롬프트 형식으로 변환
// ========================================

function formatDocsForPrompt(docs) {
  if (!docs) {
    return '⚠️ N8N 문서를 로드할 수 없습니다. 인터넷 연결을 확인하세요.';
  }

  let prompt = '**N8N 최신 노드 목록 (자동 업데이트)**:\n';
  prompt += `📅 마지막 업데이트: ${new Date(docs.lastUpdated).toLocaleDateString('ko-KR')}\n\n`;

  // 노드 목록 (A-Z 정렬, 상위 50개만)
  if (docs.nodes && docs.nodes.length > 0) {
    const topNodes = docs.nodes
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 50);

    prompt += '주요 노드:\n';
    topNodes.forEach(node => {
      prompt += `- \`${node.name}\`\n`;
    });

    prompt += `\n총 ${docs.nodes.length}개 노드 사용 가능\n`;
  }

  // 최신 변경사항 (요약)
  if (docs.changelog) {
    const firstVersion = docs.changelog.split('\n## ')[0];
    prompt += `\n**최신 업데이트**:\n${firstVersion.substring(0, 200)}...\n`;
  }

  return prompt;
}

// ========================================
// 7. Export
// ========================================

// background.js에서 사용할 수 있도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateN8NDocs,
    loadDocsFromStorage,
    formatDocsForPrompt
  };
}

console.log('📚 N8N Docs Updater loaded');
