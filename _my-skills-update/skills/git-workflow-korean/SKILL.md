# Git Workflow Korean

## Purpose

Korean-friendly Git workflow best practices designed for Korean development teams, featuring bilingual conventions, culturally appropriate communication patterns, and practical strategies for effective version control and team collaboration.

## When to Use

- **Starting a new team project** - Establish consistent Git practices from day one
- **Korean development teams** - Need Korean-friendly commit messages and communication
- **Onboarding new developers** - Teach standardized Git workflows
- **Code review process** - Implement structured PR workflows
- **Release management** - Manage versions and hotfixes systematically
- **Multi-feature development** - Coordinate parallel feature development
- **Open source projects** - Maintain clean commit history for Korean contributors

## Core Concepts

### 1. Branch Strategy (브랜치 전략)

| Branch Type | Korean Name | Purpose | Naming Convention |
|-------------|-------------|---------|-------------------|
| `main` | 메인 브랜치 | Production-ready code | `main` |
| `develop` | 개발 브랜치 | Integration branch for features | `develop` |
| `feature/*` | 기능 브랜치 | New feature development | `feature/user-login` |
| `bugfix/*` | 버그 수정 브랜치 | Bug fixes for develop | `bugfix/login-validation` |
| `hotfix/*` | 핫픽스 브랜치 | Urgent production fixes | `hotfix/security-patch` |
| `release/*` | 릴리즈 브랜치 | Release preparation | `release/v1.2.0` |

### 2. Commit Message Convention (커밋 메시지 규칙)

**Format Structure:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type Keywords (Korean-Friendly):**

| Type | Korean | Description | Example |
|------|--------|-------------|---------|
| `feat` | 기능 | New feature | `feat(auth): 소셜 로그인 추가` |
| `fix` | 수정 | Bug fix | `fix(api): 데이터 유효성 검사 오류 수정` |
| `docs` | 문서 | Documentation only | `docs(readme): 설치 가이드 업데이트` |
| `style` | 스타일 | Code style (no logic change) | `style(components): 코드 포맷팅 적용` |
| `refactor` | 리팩토링 | Code refactoring | `refactor(auth): 인증 로직 모듈화` |
| `test` | 테스트 | Adding/updating tests | `test(user): 사용자 생성 테스트 추가` |
| `chore` | 기타 | Build process, dependencies | `chore(deps): lodash 버전 업데이트` |
| `perf` | 성능 | Performance improvement | `perf(db): 쿼리 최적화` |

**Commit Message Best Practices:**

```bash
# Good Examples - 좋은 예시
feat(user): 회원가입 이메일 인증 기능 추가

사용자가 회원가입 시 이메일로 인증 링크를 받을 수 있도록 구현
- nodemailer를 사용한 이메일 발송
- JWT 토큰 기반 인증 링크 생성
- 24시간 만료 시간 설정

Resolves: #123

---

fix(payment): 결제 금액 계산 오류 수정

할인 쿠폰 적용 시 최종 금액이 음수로 계산되는 문제 해결
- 최소 결제 금액 0원 검증 추가
- 단위 테스트 추가

Fixes: #456

---

# Bad Examples - 나쁜 예시
fix: bug fix  # Too vague
feat: add feature  # Not descriptive
update code  # No type specified
```

### 3. Pull Request Workflow (PR 워크플로우)

**PR Title Convention:**
```
[Type] Brief description in Korean

Examples:
[기능] 사용자 프로필 수정 기능
[수정] 로그인 세션 만료 버그 수정
[개선] 검색 성능 최적화
```

**PR Description Template:**
```markdown
## 변경 사항 (Changes)
- 주요 변경사항을 bullet point로 작성

## 변경 이유 (Why)
이 PR이 필요한 이유와 배경 설명

## 테스트 방법 (How to Test)
1. 로컬 환경 실행
2. /login 페이지 접속
3. 이메일/비밀번호 입력

## 스크린샷 (Screenshots)
<!-- If applicable -->

## 체크리스트 (Checklist)
- [ ] 코드 리뷰 준비 완료
- [ ] 테스트 작성 완료
- [ ] 문서 업데이트 완료
- [ ] 로컬에서 정상 작동 확인

## 관련 이슈 (Related Issues)
Closes #123
```

### 4. Branching Models (브랜치 모델)

**Git Flow Model:**
```
main (프로덕션)
  │
  ├─ hotfix/v1.0.1 → merge to main & develop
  │
  └─ release/v1.1.0 → merge to main & develop
      │
      └─ develop (개발 통합)
          │
          ├─ feature/user-profile
          ├─ feature/payment-system
          └─ bugfix/login-error
```

**GitHub Flow (Simplified):**
```
main (프로덕션)
  │
  ├─ feature/user-auth
  ├─ feature/admin-panel
  └─ hotfix/critical-bug
```

## Examples

### Example 1: Feature Development Workflow (기능 개발 워크플로우)

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/user-profile-edit

# 3. Make changes and commit with Korean messages
git add src/components/UserProfile.tsx
git commit -m "feat(profile): 사용자 프로필 수정 UI 구현

- 프로필 이미지 업로드 기능
- 닉네임, 이메일 수정 폼 추가
- 유효성 검사 로직 구현"

# 4. Continue development
git add src/api/updateProfile.ts
git commit -m "feat(profile): 프로필 업데이트 API 연동

PUT /api/users/:id 엔드포인트 통합
에러 핸들링 및 성공 토스트 메시지 추가"

# 5. Push to remote
git push -u origin feature/user-profile-edit

# 6. Create Pull Request on GitHub
# Title: [기능] 사용자 프로필 수정 기능
# Use PR template from above

# 7. After approval, merge to develop
# (Usually done through GitHub UI)

# 8. Delete local and remote feature branch
git checkout develop
git pull origin develop
git branch -d feature/user-profile-edit
git push origin --delete feature/user-profile-edit
```

### Example 2: Hotfix Workflow (긴급 수정 워크플로우)

```bash
# 1. Critical bug found in production!
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/payment-security

# 2. Fix the critical issue
git add src/payment/validation.ts
git commit -m "fix(payment): 결제 보안 취약점 긴급 수정

SQL injection 취약점 패치
- parameterized query 적용
- 입력값 sanitization 강화

Security: Fixes CVE-2024-XXXX"

# 3. Test thoroughly
npm test
npm run e2e:critical

# 4. Push and create urgent PR
git push -u origin hotfix/payment-security

# Create PR with [긴급수정] tag
# Title: [긴급수정] 결제 시스템 보안 취약점 패치

# 5. After approval, merge to main AND develop
git checkout main
git merge --no-ff hotfix/payment-security
git tag -a v1.0.1 -m "긴급 보안 패치"
git push origin main --tags

git checkout develop
git merge --no-ff hotfix/payment-security
git push origin develop

# 6. Clean up
git branch -d hotfix/payment-security
git push origin --delete hotfix/payment-security

# 7. Deploy to production immediately
```

### Example 3: Release Workflow (릴리즈 워크플로우)

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v2.0.0

# 2. Version bump and changelog
npm version 2.0.0
git add package.json package-lock.json

# 3. Update CHANGELOG.md
cat >> CHANGELOG.md << 'EOF'
## [2.0.0] - 2024-11-06

### 새로운 기능 (Added)
- 사용자 프로필 수정 기능
- 다크 모드 지원
- 알림 시스템 구현

### 개선 사항 (Changed)
- 검색 성능 50% 향상
- UI/UX 전면 개선

### 버그 수정 (Fixed)
- 로그인 세션 만료 버그 수정
- 이미지 업로드 오류 해결

### 보안 (Security)
- 인증 토큰 암호화 강화
EOF

git add CHANGELOG.md
git commit -m "chore(release): v2.0.0 릴리즈 준비

버전 업데이트 및 체인지로그 작성"

# 4. Final testing
npm test
npm run build
npm run e2e

# 5. Push and create release PR
git push -u origin release/v2.0.0

# Create PR: [릴리즈] v2.0.0 배포 준비

# 6. After approval, merge to main and develop
git checkout main
git merge --no-ff release/v2.0.0
git tag -a v2.0.0 -m "릴리즈 v2.0.0"
git push origin main --tags

git checkout develop
git merge --no-ff release/v2.0.0
git push origin develop

# 7. Clean up
git branch -d release/v2.0.0
git push origin --delete release/v2.0.0
```

### Example 4: Collaborative Feature Development (협업 기능 개발)

```bash
# Developer A starts feature
git checkout -b feature/payment-integration
git push -u origin feature/payment-integration

# Developer A commits initial work
git commit -m "feat(payment): 결제 모듈 기본 구조 추가"
git push

# Developer B joins the feature
git fetch origin
git checkout feature/payment-integration

# Developer B adds their work
git commit -m "feat(payment): PG사 API 연동 로직 추가"
git push

# Developer A pulls latest changes
git pull origin feature/payment-integration

# Resolve conflicts if any
git add .
git commit -m "merge: 충돌 해결 - 결제 로직 통합"
git push

# Regular synchronization
git fetch origin feature/payment-integration
git rebase origin/feature/payment-integration
git push --force-with-lease

# When feature is complete
# Create PR and merge to develop
```

## Common Patterns

### Pattern 1: Atomic Commits (원자적 커밋)

**Keep commits small and focused:**

```bash
# BAD - Too many changes in one commit
git add .
git commit -m "feat: 사용자 기능 추가"
# Changed: login, profile, settings, notifications (4 features)

# GOOD - Separate logical changes
git add src/auth/login.ts
git commit -m "feat(auth): 로그인 기능 구현"

git add src/user/profile.ts
git commit -m "feat(user): 프로필 조회 기능 추가"

git add src/user/settings.ts
git commit -m "feat(user): 설정 페이지 구현"

git add src/notifications/
git commit -m "feat(notification): 실시간 알림 시스템 추가"
```

### Pattern 2: Interactive Rebase for Clean History

```bash
# Before pushing, clean up your commits
git log --oneline
# a1b2c3d feat(user): add validation
# d4e5f6g feat(user): fix typo
# g7h8i9j feat(user): add user profile

# Squash and reorganize
git rebase -i HEAD~3

# In editor, change to:
pick a1b2c3d feat(user): 사용자 프로필 기능 구현
fixup d4e5f6g feat(user): fix typo
fixup g7h8i9j feat(user): add validation

# Result: Clean single commit
git log --oneline
# a1b2c3d feat(user): 사용자 프로필 기능 구현
```

### Pattern 3: Branch Protection and Code Review

**Set up branch protection rules:**

```yaml
# GitHub Branch Protection Settings for 'main' and 'develop'

Required:
  - ✅ Require pull request reviews before merging (최소 1명)
  - ✅ Require status checks to pass before merging
    - CI/CD tests
    - Code coverage > 80%
    - Lint checks
  - ✅ Require branches to be up to date before merging
  - ✅ Require conversation resolution before merging

Optional:
  - ✅ Require signed commits (커밋 서명)
  - ✅ Require linear history (선형 히스토리)
  - ❌ Allow force pushes (절대 허용 안 함)
  - ❌ Allow deletions
```

## Best Practices

### DO ✅

- **Write descriptive commit messages in Korean** for better team communication
  ```bash
  git commit -m "feat(auth): JWT 기반 인증 시스템 구현

  - Access token과 Refresh token 분리
  - Redis를 활용한 토큰 블랙리스트 관리
  - 자동 토큰 갱신 로직 추가"
  ```

- **Use conventional commits** for automated changelogs
  ```bash
  git commit -m "feat(api): 사용자 API 엔드포인트 추가"
  # This will automatically appear in CHANGELOG under "Features"
  ```

- **Keep branches short-lived** (less than 3-5 days)
  ```bash
  # Branch created on Monday, merged by Wednesday
  # Reduces merge conflicts and integration issues
  ```

- **Sync with develop branch regularly**
  ```bash
  git checkout feature/my-feature
  git fetch origin develop
  git rebase origin/develop
  # Or use merge if rebase is complicated
  git merge origin/develop
  ```

- **Use tags for releases**
  ```bash
  git tag -a v1.2.0 -m "릴리즈 v1.2.0 - 새로운 결제 시스템"
  git push origin v1.2.0
  ```

- **Review your own PR first** before requesting reviews
  ```bash
  # Check the diff on GitHub
  # Add comments on complex parts
  # Test all changes locally
  ```

### DON'T ❌

- **Don't commit directly to main or develop**
  ```bash
  # BAD
  git checkout main
  git commit -m "quick fix"  # ❌ Never do this!

  # GOOD
  git checkout -b hotfix/quick-fix
  git commit -m "fix: 긴급 수정"
  # Create PR and merge through review
  ```

- **Don't use vague commit messages**
  ```bash
  # BAD
  git commit -m "fix"  # ❌ What did you fix?
  git commit -m "update"  # ❌ What did you update?
  git commit -m "wip"  # ❌ Not informative

  # GOOD
  git commit -m "fix(auth): 로그인 시 세션 만료 오류 수정"
  ```

- **Don't commit large binary files**
  ```bash
  # Use Git LFS for large files
  git lfs track "*.psd"
  git lfs track "*.mp4"

  # Or use .gitignore
  echo "*.log" >> .gitignore
  echo "node_modules/" >> .gitignore
  ```

- **Don't rewrite public history**
  ```bash
  # BAD - If already pushed and others are using it
  git push --force origin main  # ❌ Dangerous!

  # GOOD - Use force-with-lease if you must
  git push --force-with-lease origin feature/my-branch
  # Only on your own feature branches!
  ```

- **Don't mix multiple concerns in one commit**
  ```bash
  # BAD
  git add .
  git commit -m "feat: 기능 추가 및 버그 수정 및 리팩토링"
  # ❌ Too many changes

  # GOOD - Separate commits
  git commit -m "feat(user): 프로필 기능 추가"
  git commit -m "fix(auth): 로그인 버그 수정"
  git commit -m "refactor(api): API 모듈 구조 개선"
  ```

- **Don't ignore merge conflicts**
  ```bash
  # BAD
  git merge develop
  # See conflicts, use --ours blindly
  git checkout --ours .  # ❌ Might lose important changes

  # GOOD
  git merge develop
  # Carefully review each conflict
  # Test after resolving
  git add .
  git commit -m "merge: develop 브랜치 병합 및 충돌 해결"
  ```

## Troubleshooting

### Issue 1: Merge Conflicts (병합 충돌)

**Problem:**
```bash
$ git merge develop
Auto-merging src/app.ts
CONFLICT (content): Merge conflict in src/app.ts
Automatic merge failed; fix conflicts and then commit the result.
```

**Solution:**
```bash
# 1. Check conflicted files
git status

# 2. Open conflicted file
# You'll see markers like:
<<<<<<< HEAD
const port = 3000;  # Your changes
=======
const port = 8080;  # Incoming changes
>>>>>>> develop

# 3. Resolve conflict manually
const port = process.env.PORT || 3000;  # Best solution

# 4. Mark as resolved
git add src/app.ts

# 5. Complete merge
git commit -m "merge: develop 브랜치 병합

충돌 해결 내용:
- port 설정을 환경변수 기반으로 변경"

# 6. Test thoroughly before pushing
npm test
```

### Issue 2: Accidental Commit to Wrong Branch (잘못된 브랜치에 커밋)

**Problem:**
```bash
# Oh no! I committed to main instead of feature branch!
(main) $ git commit -m "feat: new feature"
```

**Solution:**
```bash
# 1. Don't panic! Create the correct branch
git branch feature/new-feature

# 2. Reset main to previous state (before your commit)
git reset --hard HEAD~1

# 3. Switch to the new branch (your commit is there!)
git checkout feature/new-feature

# 4. Verify
git log  # Your commit should be here

# 5. Push to remote
git push -u origin feature/new-feature
```

### Issue 3: Need to Undo Last Commit (마지막 커밋 취소)

**Problem:**
```bash
# Just committed but realized it has errors
git commit -m "feat: broken feature"
```

**Solutions:**

```bash
# Option 1: Undo commit but keep changes (most common)
git reset --soft HEAD~1
# Files are still staged, fix them and commit again

# Option 2: Undo commit and unstage changes
git reset HEAD~1
# Files are modified but not staged

# Option 3: Completely discard commit and changes
git reset --hard HEAD~1
# ⚠️ Warning: This deletes your changes!

# Option 4: Amend the commit (if not pushed yet)
git add fixed-file.ts
git commit --amend -m "feat: corrected feature implementation"

# Option 5: If already pushed, create a revert commit
git revert HEAD
git push origin feature/my-branch
```

### Issue 4: Lost Changes After Reset (리셋 후 변경사항 복구)

**Problem:**
```bash
# Accidentally did hard reset
git reset --hard HEAD~3
# Oh no! I needed those changes!
```

**Solution:**
```bash
# 1. Find the lost commit using reflog
git reflog
# Output:
# a1b2c3d HEAD@{0}: reset: moving to HEAD~3
# d4e5f6g HEAD@{1}: commit: feat: important feature
# ...

# 2. Restore to the lost commit
git reset --hard d4e5f6g

# 3. Or create a new branch from it
git branch recovery-branch d4e5f6g
git checkout recovery-branch

# 4. Cherry-pick specific commits
git cherry-pick d4e5f6g
```

### Issue 5: Diverged Branches (브랜치 분기)

**Problem:**
```bash
$ git push origin feature/my-feature
! [rejected] feature/my-feature -> feature/my-feature (non-fast-forward)
error: failed to push some refs
```

**Solution:**
```bash
# 1. Fetch latest changes
git fetch origin

# 2. Option A: Rebase (cleaner history)
git rebase origin/feature/my-feature
# Resolve conflicts if any
git add .
git rebase --continue
git push --force-with-lease origin feature/my-feature

# 3. Option B: Merge (safer, preserves history)
git merge origin/feature/my-feature
# Resolve conflicts if any
git add .
git commit -m "merge: 원격 브랜치 변경사항 병합"
git push origin feature/my-feature

# 4. Option C: Force push (use with caution!)
# Only if you're sure no one else is using this branch
git push --force-with-lease origin feature/my-feature
```

### Issue 6: Large File Committed by Mistake (대용량 파일 실수로 커밋)

**Problem:**
```bash
git push
# remote: error: File video.mp4 is 120 MB; this exceeds GitHub's file size limit
```

**Solution:**
```bash
# 1. If not pushed yet - remove from last commit
git rm --cached video.mp4
git commit --amend -m "feat: 기능 추가 (대용량 파일 제거)"

# 2. If already in history - use BFG Repo Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files video.mp4 my-repo.git
cd my-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# 3. Prevent future issues - add to .gitignore
echo "*.mp4" >> .gitignore
echo "*.avi" >> .gitignore
git add .gitignore
git commit -m "chore: 대용량 미디어 파일 gitignore 추가"

# 4. Use Git LFS for large files
git lfs install
git lfs track "*.mp4"
git add .gitattributes
git commit -m "chore: Git LFS 설정 추가"
```

## Additional Resources

### Useful Git Commands Cheatsheet

```bash
# Branch Management
git branch -a                    # 모든 브랜치 조회
git branch -d feature/old        # 로컬 브랜치 삭제
git push origin --delete old     # 원격 브랜치 삭제

# Stash (임시 저장)
git stash                        # 변경사항 임시 저장
git stash list                   # stash 목록 조회
git stash apply                  # 최근 stash 적용
git stash pop                    # 적용 후 stash 삭제

# Log and History
git log --oneline --graph --all  # 그래프로 히스토리 보기
git log --author="Giwoong"       # 특정 작성자 커밋 보기
git log --since="2 weeks ago"    # 기간별 커밋 조회

# Diff and Changes
git diff                         # 변경사항 비교
git diff --staged                # staged 파일 비교
git diff main..feature/new       # 브랜치 간 비교

# Remote Management
git remote -v                    # 원격 저장소 조회
git remote add upstream URL      # upstream 저장소 추가
git fetch upstream               # upstream 변경사항 가져오기
```

### Korean Git Terminology Reference

| English | Korean | Usage |
|---------|--------|-------|
| Repository | 저장소 | "이 저장소를 클론하세요" |
| Branch | 브랜치 | "새 브랜치를 생성했습니다" |
| Commit | 커밋 | "변경사항을 커밋합니다" |
| Push | 푸시 | "원격에 푸시해주세요" |
| Pull | 풀 | "최신 코드를 풀 받으세요" |
| Merge | 병합 | "develop에 병합했습니다" |
| Rebase | 리베이스 | "develop을 리베이스합니다" |
| Cherry-pick | 체리픽 | "특정 커밋을 체리픽했습니다" |
| Stash | 스태시 | "작업을 스태시에 저장하세요" |
| Conflict | 충돌 | "병합 충돌이 발생했습니다" |

---

**Token Count: ~4,237 tokens**

This skill provides comprehensive Git workflow guidance optimized for Korean development teams, with practical examples and bilingual conventions.
