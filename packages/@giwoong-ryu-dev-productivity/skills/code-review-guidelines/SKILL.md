# Code Review Guidelines

## Purpose

Comprehensive code review guidelines that establish effective review practices, promote constructive feedback culture, ensure code quality, and facilitate knowledge sharing within development teams through structured review processes.

## When to Use

- **Pull request reviews** - Reviewing teammates' code changes systematically
- **Code quality assurance** - Ensuring standards and best practices are followed
- **Knowledge sharing** - Learning from others' code and sharing expertise
- **Mentoring juniors** - Providing educational and constructive feedback
- **Architecture decisions** - Reviewing design patterns and system architecture
- **Security audits** - Identifying potential security vulnerabilities
- **Performance reviews** - Checking for performance bottlenecks
- **Pre-deployment checks** - Final validation before production deployment

## Core Concepts

### 1. Code Review Levels

| Level | Time Investment | Focus Areas | When to Use |
|-------|----------------|-------------|-------------|
| **Quick Scan** | 5-10 min | Critical bugs, security, obvious issues | Small changes, hotfixes |
| **Standard Review** | 20-30 min | Logic, tests, style, documentation | Regular feature PRs |
| **Deep Review** | 1-2 hours | Architecture, patterns, long-term maintainability | Major features, refactoring |
| **Security Audit** | 2+ hours | Vulnerabilities, data handling, auth | Security-critical changes |

### 2. Review Checklist

**Code Quality:**
- [ ] Code is readable and self-documenting
- [ ] Functions/methods are small and focused (single responsibility)
- [ ] Variable and function names are clear and descriptive
- [ ] No code duplication (DRY principle)
- [ ] Complex logic is commented and explained
- [ ] Magic numbers/strings are replaced with constants

**Functionality:**
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled appropriately
- [ ] Error handling is comprehensive and appropriate
- [ ] No obvious bugs or logical errors
- [ ] Performance considerations are addressed
- [ ] Backward compatibility is maintained

**Testing:**
- [ ] Unit tests cover new functionality
- [ ] Test cases include edge cases and error scenarios
- [ ] Tests are clear, focused, and maintainable
- [ ] Integration tests for API/database changes
- [ ] Test coverage meets project standards (e.g., 80%+)
- [ ] Existing tests still pass

**Security:**
- [ ] No sensitive data exposed (API keys, passwords)
- [ ] Input validation is thorough
- [ ] SQL injection risks are mitigated
- [ ] XSS vulnerabilities are prevented
- [ ] Authentication and authorization are proper
- [ ] Dependencies are up-to-date and secure

**Documentation:**
- [ ] README updated if needed
- [ ] API documentation is current
- [ ] Inline comments explain "why" not "what"
- [ ] CHANGELOG updated for user-facing changes
- [ ] Breaking changes are clearly documented

**Style & Standards:**
- [ ] Code follows project style guide
- [ ] Linter/formatter passes without errors
- [ ] No unnecessary console.logs or debug code
- [ ] Import statements are organized
- [ ] File and folder structure is consistent

### 3. Feedback Categories

| Category | Tag | Description | Example |
|----------|-----|-------------|---------|
| **Critical** | 🔴 MUST FIX | Bugs, security issues, breaking changes | "🔴 This causes a memory leak" |
| **Important** | 🟡 SHOULD FIX | Logic issues, performance, maintainability | "🟡 This query could be optimized" |
| **Suggestion** | 🔵 CONSIDER | Style improvements, refactoring ideas | "🔵 Consider using async/await here" |
| **Nitpick** | ⚪ OPTIONAL | Minor style, personal preference | "⚪ Nitpick: Add space after comma" |
| **Praise** | ✅ GOOD | Positive feedback, clever solutions | "✅ Great use of memoization!" |
| **Question** | ❓ CLARIFY | Ask for clarification or explanation | "❓ Why did you choose this approach?" |

### 4. Review Etiquette

**Tone and Language:**
```markdown
# ❌ BAD - Sounds accusatory
"Why did you write this terrible code?"
"This is wrong."
"You should know better."

# ✅ GOOD - Constructive and collaborative
"Could we refactor this to improve readability?"
"I think there might be an issue here. Thoughts?"
"Have you considered this alternative approach?"

# Examples of good phrasing:
"Let's consider..."
"What do you think about..."
"I wonder if we could..."
"Could we improve this by..."
"I'm curious about..."
"Perhaps we could..."
```

### 5. Review Response Time Standards

| Priority | Response Time | Review Time |
|----------|--------------|-------------|
| **Hotfix/Critical** | < 1 hour | < 2 hours |
| **Standard PR** | < 4 hours | < 24 hours |
| **Large Feature** | < 8 hours | < 48 hours |
| **RFC/Design Doc** | < 24 hours | < 1 week |

## Examples

### Example 1: Standard Feature Review

**PR: [Feature] User Authentication with JWT**

```markdown
## Initial Review Comments

### 🔴 Critical Issues

**File: src/auth/jwt.ts**
```typescript
// ❌ Current code
const secret = "my-secret-key";  // Hardcoded secret
const token = jwt.sign({ userId }, secret);
```

🔴 **MUST FIX:** Secret key is hardcoded. This is a security vulnerability.

**Suggestion:**
```typescript
// ✅ Improved
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required');
}
const token = jwt.sign({ userId }, secret);
```

---

### 🟡 Important Issues

**File: src/auth/login.ts**
```typescript
// ❌ Current code
const user = await User.findOne({ email });
if (user.password === password) {  // Plain text comparison
  return generateToken(user);
}
```

🟡 **SHOULD FIX:** Password comparison should use bcrypt.compare() for hashed passwords.

**Suggestion:**
```typescript
// ✅ Improved
const user = await User.findOne({ email });
if (!user) {
  throw new UnauthorizedError('Invalid credentials');
}

const isValid = await bcrypt.compare(password, user.passwordHash);
if (!isValid) {
  throw new UnauthorizedError('Invalid credentials');
}

return generateToken(user);
```

---

### 🔵 Suggestions

**File: src/auth/middleware.ts**
```typescript
// Current code works, but could be cleaner
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  // ...
}
```

🔵 **CONSIDER:** Add request type annotations for better type safety.

```typescript
// ✅ Improved
import { Request, Response, NextFunction } from 'express';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }
  // ...
}
```

---

### ✅ Positive Feedback

**File: src/auth/token.ts**

✅ **Great work!** The token refresh logic is well-implemented. I especially like how you handle token expiration gracefully with the automatic refresh mechanism.

```typescript
// This is excellent
async function refreshToken(oldToken: string): Promise<string> {
  const decoded = jwt.verify(oldToken, secret, { ignoreExpiration: true });
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found or inactive');
  }

  return generateToken(user);
}
```

---

### ❓ Questions

1. ❓ What's the expiration time for access tokens? Should we add this to the configuration docs?
2. ❓ Have you considered adding rate limiting to prevent brute force attacks on the login endpoint?
3. ❓ Will we need refresh tokens in addition to access tokens?

---

### 📝 Missing Tests

The auth logic looks solid, but I noticed these test cases are missing:

```typescript
describe('Authentication', () => {
  // ✅ Existing tests
  it('should generate valid JWT token')
  it('should validate correct credentials')

  // ❌ Missing tests
  it('should reject expired tokens')  // Add this
  it('should reject invalid token signatures')  // Add this
  it('should prevent timing attacks on password comparison')  // Add this
  it('should handle missing authorization header')  // Add this
})
```

---

### 📚 Documentation Needed

Please add documentation for:

1. How to set up JWT_SECRET in different environments
2. Token expiration policy (how long tokens last)
3. How to handle token refresh flow
4. Security best practices for storing tokens client-side

---

## Summary

**Must Address Before Merge:**
- 🔴 Remove hardcoded secret key
- 🔴 Implement proper password hashing comparison
- Add missing test cases

**Recommended Improvements:**
- 🟡 Add rate limiting to login endpoint
- 🟡 Consider implementing refresh tokens
- 🔵 Add TypeScript types throughout

**Overall:** This is a solid foundation for the auth system! Once the critical issues are addressed, this will be ready to merge. Great job on the clean code structure! 👍
```

### Example 2: Performance Review

**PR: [Performance] Optimize Database Queries**

```markdown
## Performance Analysis

**File: src/services/userService.ts**

### 🟡 N+1 Query Problem Detected

```typescript
// ❌ Current code - N+1 query problem
async function getUsersWithPosts() {
  const users = await User.findAll();

  for (const user of users) {
    user.posts = await Post.findAll({ where: { userId: user.id } });
  }

  return users;
}
// With 100 users, this executes 101 queries! (1 for users + 100 for posts)
```

🟡 **SHOULD FIX:** This will cause performance issues with many users.

**Solution:**
```typescript
// ✅ Optimized - Single query with JOIN
async function getUsersWithPosts() {
  const users = await User.findAll({
    include: [{
      model: Post,
      as: 'posts'
    }]
  });

  return users;
}
// Now only 1 query with JOIN!
```

**Performance Impact:**
- Before: 101 queries for 100 users (~500ms)
- After: 1 query (~50ms)
- **Improvement: 10x faster** 🚀

---

### ✅ Great Optimization!

**File: src/services/searchService.ts**

```typescript
// Excellent use of indexing and caching
async function searchProducts(query: string) {
  const cacheKey = `search:${query}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const results = await Product.findAll({
    where: {
      name: { [Op.iLike]: `%${query}%` }  // Using index
    },
    limit: 50
  });

  await redis.setex(cacheKey, 300, JSON.stringify(results));
  return results;
}
```

✅ **Excellent work!** The caching strategy is spot-on. Make sure the `name` column has an index for optimal performance.

---

### 🔵 Consider Adding

```typescript
// Add query result limiting and pagination
async function getUsersWithPosts(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const { rows, count } = await User.findAndCountAll({
    include: [{ model: Post, as: 'posts' }],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
}
```

---

### 📊 Performance Metrics

Please add performance benchmarks to verify improvements:

```typescript
// Add to tests
describe('Performance', () => {
  it('should complete search within 100ms', async () => {
    const start = Date.now();
    await searchProducts('laptop');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should handle 1000 concurrent requests', async () => {
    const requests = Array(1000).fill(null).map(() =>
      searchProducts('test')
    );

    const results = await Promise.all(requests);
    expect(results).toHaveLength(1000);
  });
});
```
```

### Example 3: Security Review

**PR: [Feature] File Upload Functionality**

```markdown
## Security Review

### 🔴 Critical Security Issues

**File: src/upload/handler.ts**

```typescript
// ❌ DANGEROUS - No file type validation
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  fs.writeFileSync(`./uploads/${file.originalname}`, file.buffer);
  res.json({ url: `/uploads/${file.originalname}` });
});
```

🔴 **CRITICAL:** Multiple security vulnerabilities:

1. **Path Traversal Attack**: `originalname` could be `../../etc/passwd`
2. **No File Type Validation**: User could upload executable files
3. **No Size Limit**: Could cause disk space DoS
4. **Predictable Filenames**: Could overwrite existing files

**Secure Solution:**
```typescript
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import crypto from 'crypto';

// ✅ Secure implementation
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  // Generate safe filename
  const ext = path.extname(file.originalname);
  const safeFilename = `${uuidv4()}${ext}`;
  const uploadPath = path.join(__dirname, '../uploads', safeFilename);

  // Validate file content (not just extension)
  const fileType = await detectFileType(file.buffer);
  if (!ALLOWED_TYPES.includes(fileType)) {
    return res.status(400).json({ error: 'Invalid file content' });
  }

  await fs.promises.writeFile(uploadPath, file.buffer);

  res.json({
    url: `/uploads/${safeFilename}`,
    originalName: file.originalname,
    size: file.size
  });
});
```

---

### 🔴 SQL Injection Risk

**File: src/api/search.ts**

```typescript
// ❌ VULNERABLE to SQL injection
app.get('/search', async (req, res) => {
  const query = req.query.q;
  const results = await db.query(
    `SELECT * FROM products WHERE name LIKE '%${query}%'`
  );
  res.json(results);
});
```

🔴 **MUST FIX:** User input directly in SQL query.

Attack example: `?q='; DROP TABLE products; --`

**Solution:**
```typescript
// ✅ Safe - Using parameterized queries
app.get('/search', async (req, res) => {
  const query = req.query.q;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Invalid query' });
  }

  const results = await db.query(
    'SELECT * FROM products WHERE name LIKE $1 LIMIT 100',
    [`%${query}%`]
  );

  res.json(results);
});
```

---

### 🟡 Authentication Issues

**File: src/middleware/auth.ts**

```typescript
// Current implementation
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  const user = jwt.verify(token, SECRET);
  req.user = user;
  next();
}
```

🟡 **Issues:**
1. No error handling for invalid tokens
2. No token expiration check
3. No user existence validation

**Improved version:**
```typescript
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, SECRET);

    // Validate user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

### 📋 Security Checklist

Before merge, ensure:
- [ ] All user inputs are validated and sanitized
- [ ] SQL injection risks eliminated (use parameterized queries)
- [ ] File uploads are properly secured
- [ ] Authentication errors don't leak information
- [ ] Rate limiting is in place for upload endpoints
- [ ] File size limits are enforced
- [ ] Uploaded files are scanned for malware (if applicable)
- [ ] CORS is properly configured
- [ ] HTTPS is enforced in production

---

### 🔒 Additional Security Recommendations

1. **Add rate limiting:**
```typescript
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: 'Too many uploads, please try again later'
});

app.post('/upload', uploadLimiter, ...);
```

2. **Implement virus scanning:**
```typescript
import NodeClam from 'clamscan';

const clam = await new NodeClam().init();
const { isInfected } = await clam.scanBuffer(file.buffer);

if (isInfected) {
  throw new Error('Malware detected');
}
```
```

### Example 4: Refactoring Review

**PR: [Refactor] Extract Payment Logic to Service Layer**

```markdown
## Refactoring Review

### ✅ Excellent Improvements!

The refactoring is well-structured and improves code maintainability significantly!

**Before (Controller doing too much):**
```typescript
// ❌ Fat controller anti-pattern
app.post('/checkout', async (req, res) => {
  const { userId, items, couponCode } = req.body;

  // 80 lines of business logic in controller...
  const user = await User.findById(userId);
  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.id);
    total += product.price * item.quantity;
  }

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });
    if (coupon && coupon.isValid()) {
      total -= total * (coupon.discount / 100);
    }
  }

  // ... more logic ...
});
```

**After (Clean separation of concerns):**
```typescript
// ✅ Thin controller
app.post('/checkout', async (req, res) => {
  const { userId, items, couponCode } = req.body;

  const order = await paymentService.processCheckout({
    userId,
    items,
    couponCode
  });

  res.json({ order });
});

// ✅ Service with business logic
class PaymentService {
  async processCheckout({ userId, items, couponCode }) {
    const user = await this.validateUser(userId);
    const total = await this.calculateTotal(items);
    const discount = await this.applyDiscount(total, couponCode);
    const finalAmount = total - discount;

    return await this.createOrder({ user, items, finalAmount });
  }

  private async calculateTotal(items: CartItem[]) {
    // Logic here...
  }

  private async applyDiscount(total: number, couponCode?: string) {
    // Logic here...
  }
}
```

---

### 🔵 Suggestions for Further Improvement

```typescript
// Current service method
async calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.id);  // N+1 query
    total += product.price * item.quantity;
  }
  return total;
}
```

🔵 **CONSIDER:** Optimize the N+1 query issue:

```typescript
// ✅ Optimized
async calculateTotal(items: CartItem[]): Promise<number> {
  const productIds = items.map(item => item.id);
  const products = await Product.findByIds(productIds);

  const productMap = new Map(
    products.map(p => [p.id, p])
  );

  return items.reduce((total, item) => {
    const product = productMap.get(item.id);
    if (!product) {
      throw new Error(`Product ${item.id} not found`);
    }
    return total + (product.price * item.quantity);
  }, 0);
}
```

---

### ❓ Questions

1. ❓ Should we add transaction support to ensure atomicity when creating orders?
2. ❓ How do we handle inventory validation? Should this be part of the payment service?
3. ❓ Do we need to emit events (e.g., for analytics) after successful checkout?

---

### 📝 Testing Recommendations

The refactoring makes testing much easier! Here's what I'd like to see:

```typescript
describe('PaymentService', () => {
  describe('processCheckout', () => {
    it('should calculate correct total with multiple items', async () => {
      const service = new PaymentService();
      const items = [
        { id: '1', quantity: 2 },  // $10 each
        { id: '2', quantity: 1 }   // $15 each
      ];

      const total = await service.calculateTotal(items);
      expect(total).toBe(35);  // (10 * 2) + (15 * 1)
    });

    it('should apply coupon discount correctly', async () => {
      const service = new PaymentService();
      const discount = await service.applyDiscount(100, 'SAVE20');

      expect(discount).toBe(20);  // 20% of 100
    });

    it('should throw error for invalid coupon', async () => {
      const service = new PaymentService();

      await expect(
        service.applyDiscount(100, 'INVALID')
      ).rejects.toThrow('Invalid coupon code');
    });
  });
});
```

---

## Summary

**Excellent refactoring!** The code is now:
- ✅ More testable (service can be tested in isolation)
- ✅ More maintainable (clear separation of concerns)
- ✅ More reusable (service can be used in other contexts)

**Minor improvements needed:**
- 🔵 Optimize N+1 queries in calculateTotal
- 🔵 Add transaction support
- 🔵 Consider event emission for analytics

Overall: Great work! This is ready to merge once the tests are added. 🎉
```

## Common Patterns

### Pattern 1: The Approval Workflow

```markdown
## Review States

1. **Changes Requested** 🔴
   - Critical issues found
   - Must be addressed before merge
   - Re-review required after fixes

2. **Comment** 💬
   - Suggestions and questions
   - No blocking issues
   - Author can merge after consideration

3. **Approved** ✅
   - All issues resolved
   - Code meets standards
   - Ready to merge

## Example Workflow

**Round 1: Changes Requested**
Reviewer: "🔴 Found security issue with SQL injection. Please fix."

**Round 2: Comment**
Reviewer: "Security issue fixed! 🔵 Consider adding rate limiting, but not blocking."

**Round 3: Approved**
Reviewer: "✅ All good! Great work on the fixes. Ready to merge."
```

### Pattern 2: The Sandwich Method (Praise - Critique - Praise)

```markdown
## Review Structure

**Start with positives:**
"✅ Great job on the test coverage! I really like how you structured the service layer."

**Address issues constructively:**
"🟡 I noticed a potential issue with error handling. Could we add try-catch blocks here?"

**End encouragingly:**
"Overall this is solid work! Once we address the error handling, this will be ready to merge. Nice job! 👍"
```

### Pattern 3: Batch Reviews for Efficiency

```markdown
## Efficient Review Strategy

Instead of commenting on every instance:

**❌ Don't do:**
Line 10: "Add type here"
Line 25: "Add type here"
Line 42: "Add type here"
Line 67: "Add type here"

**✅ Do:**
"🔵 I notice several places missing TypeScript types (lines 10, 25, 42, 67).
Could you add types throughout? Here's an example for line 10:

```typescript
// Before
function processUser(user) { ... }

// After
function processUser(user: User): ProcessedUser { ... }
```

Please apply similar typing to the other locations as well."
```

## Best Practices

### DO ✅

- **Review promptly** - Don't let PRs sit idle
  ```
  Target: Review within 24 hours
  Urgent fixes: Within 4 hours
  ```

- **Be specific with feedback**
  ```markdown
  ✅ "Line 42: This function could return early to reduce nesting.
      Consider: if (!user) return null;"

  ❌ "This code is confusing"
  ```

- **Suggest alternatives, don't just criticize**
  ```markdown
  "🔵 Instead of using a for loop here, we could use map() for better readability:

  const userIds = users.map(u => u.id);
  ```

- **Acknowledge good work**
  ```markdown
  ✅ "Excellent use of dependency injection here! This makes testing much easier."
  ```

- **Ask questions instead of making demands**
  ```markdown
  ❓ "Have you considered using a switch statement here? It might be more readable with 5+ conditions."
  ```

- **Focus on patterns, not formatting** (let tools handle formatting)
  ```markdown
  ✅ "Let's focus on the logic - formatting will be handled by Prettier"
  ```

### DON'T ❌

- **Don't be vague**
  ```markdown
  ❌ "This doesn't look right"
  ❌ "Please fix"
  ❌ "Needs improvement"
  ```

- **Don't review your own significant changes** without another pair of eyes
  ```markdown
  ❌ Self-approving major refactorings
  ✅ Get at least one other review for significant changes
  ```

- **Don't nitpick without adding value**
  ```markdown
  ❌ "I would have used const instead of let here" (when let is appropriate)
  ❌ "I prefer single quotes" (if project uses double quotes)
  ```

- **Don't demand perfection**
  ```markdown
  ❌ "Rewrite this entire module using the Factory pattern"
  ✅ "This works well. If we need to extend this in the future,
      the Factory pattern might be useful to consider."
  ```

- **Don't review line-by-line for large PRs**
  ```markdown
  ❌ 150 inline comments on a 50-file PR
  ✅ "This PR is too large to review effectively. Can we break it into smaller chunks?"
  ```

- **Don't block on personal preferences**
  ```markdown
  ❌ "I don't like this approach" (without technical reasoning)
  ✅ "This approach might cause issues with X. Have you considered Y?"
  ```

## Troubleshooting

### Issue 1: Reviewer and Author Disagreement

**Problem:** Reviewer insists on changes, author disagrees.

**Solution:**
```markdown
1. **Understand both perspectives:**
   - Reviewer: Explain your technical concerns with examples
   - Author: Share your reasoning for the current approach

2. **Bring in a third party:**
   - Tag team lead or senior developer
   - "Hey @techlead, we have different opinions on this approach. Could you weigh in?"

3. **Refer to documentation:**
   - Check style guides
   - Review architecture decisions
   - Consult team best practices

4. **Compromise:**
   - "Let's go with your approach for now and create a ticket to revisit this"
   - Add a TODO comment for future improvement

5. **Escalate if needed:**
   - Schedule a quick call to discuss
   - Bring to team meeting if it affects broader patterns

## Example:
Reviewer: "I believe we should use Redux here for state management."
Author: "I chose Context API because our state is simple and Redux seems like overkill."

Resolution: "@techlead - thoughts on state management for this feature?
The state includes [X, Y, Z]. Redux vs Context API?"
```

### Issue 2: PR Too Large to Review

**Problem:** PR has 3,000+ lines across 50 files.

**Solution:**
```markdown
**Comment on PR:**
"This PR is quite large and difficult to review thoroughly. Could we break it down? Here's what I suggest:

PR 1: Database schema changes
PR 2: API endpoints
PR 3: Frontend components
PR 4: Tests and documentation

This will make reviews faster and reduce merge conflicts. Thoughts?"

**Alternative approach:**
If breaking it up isn't feasible:

1. "Could you add a detailed description of the architecture?"
2. "Can we schedule a 30-min walkthrough call?"
3. "Let's focus this review on critical paths first (auth, payment logic)"
4. "I'll review the core logic now, and do a second pass for tests/docs"
```

### Issue 3: Too Many Nitpicks

**Problem:** Review has 50+ minor comments, author is overwhelmed.

**Solution:**
```markdown
**For Reviewers:**
"I have many small suggestions. Rather than addressing each individually:

🔵 Overall patterns to fix:
1. Add TypeScript types to all functions (15 instances)
2. Extract magic numbers to constants (8 instances)
3. Add JSDoc comments to public APIs (12 instances)

I've highlighted a few examples below. Please apply similar fixes throughout."

**For Authors:**
"Thanks for the detailed review! To address efficiently:

1. I'll run eslint --fix to handle formatting
2. I'll do a sweep for all type annotations
3. For the architectural suggestions, can we discuss on a call?

Will push an update by EOD and tag you for re-review."
```

### Issue 4: Stale PR (No Response from Author)

**Problem:** Requested changes 1 week ago, no response from author.

**Solution:**
```markdown
**Day 3:** Gentle reminder
"Hey @author, just checking in on this PR. Let me know if you need any help with the requested changes!"

**Day 7:** Escalate
"@author This PR has been waiting for a week. Are you still planning to work on this?
If you're blocked, let's discuss. Otherwise, should we close this PR?"

**Day 14:** Close or take over
"I'm going to close this PR due to inactivity. Feel free to reopen when you're ready to continue.

Alternatively, if this is urgent, I can take over the changes. Let me know!"

**For urgent features:**
"@author @techlead This feature is needed for the release.
@author - can you update by EOD?
Otherwise, I can take over the PR to unblock the release."
```

### Issue 5: Reviewer Doesn't Understand the Context

**Problem:** Reviewer asking for changes that break existing functionality.

**Solution:**
```markdown
**Author response:**
"Thanks for the review! I want to clarify the context:

1. **Why this approach:** We chose X because of [business requirement / technical constraint]

2. **What problem this solves:** Without this change, [specific issue happens]

3. **Why alternative approaches don't work:**
   - Approach A: Doesn't handle [edge case]
   - Approach B: Would break [existing feature]

Here's a relevant ticket for more context: #123

Would love to discuss if you have concerns! Let's hop on a quick call if needed."

**Reviewer response after clarification:**
"Thanks for the explanation! That makes sense now. ✅ Approved.

Suggestion: Could we add a comment in the code explaining this decision?
Future developers (including us!) will benefit from understanding the reasoning."
```

### Issue 6: Critical Bug Found During Review

**Problem:** Review reveals a critical bug in existing code (not introduced by this PR).

**Solution:**
```markdown
**Immediate actions:**

1. **Comment on PR:**
"🔴 Found a critical bug (but not introduced by this PR):

File: src/auth/session.ts
Issue: Session tokens aren't being validated before use

This needs immediate attention. Creating separate urgent PR."

2. **Create hotfix:**
- Create new branch: `hotfix/session-validation`
- Fix the critical bug
- Create urgent PR with [HOTFIX] tag
- Tag team lead for immediate review

3. **Document in original PR:**
"Note: Critical bug found during review has been fixed in PR #567"

4. **Continue with original PR:**
"For this PR: Once hotfix is merged, please rebase and continue.
The hotfix doesn't block this PR approval."
```

---

**Token Count: ~4,562 tokens**

This skill provides comprehensive code review guidelines that improve team collaboration, code quality, and developer growth through effective review practices.
