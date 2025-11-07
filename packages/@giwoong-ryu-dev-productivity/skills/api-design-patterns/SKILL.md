# API Design Patterns

## Purpose

Comprehensive guide to RESTful API design patterns and best practices that help developers create consistent, maintainable, and intuitive APIs following industry standards and modern conventions.

## When to Use

- **Designing new APIs** - Create well-structured REST endpoints from scratch
- **Refactoring existing APIs** - Improve API consistency and usability
- **API documentation** - Establish clear patterns for documentation
- **Microservices architecture** - Design service-to-service communication
- **Mobile app backends** - Create efficient APIs for mobile clients
- **Third-party integrations** - Build APIs that external developers will use
- **API versioning** - Manage API evolution without breaking clients
- **GraphQL alternatives** - When REST is more appropriate than GraphQL

## Core Concepts

### 1. REST Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Resource-Based** | URLs represent resources (nouns), not actions | `/users` not `/getUsers` |
| **HTTP Methods** | Use proper verbs for operations | GET, POST, PUT, PATCH, DELETE |
| **Stateless** | Each request contains all needed information | No server-side session state |
| **Uniform Interface** | Consistent patterns across endpoints | Standard response formats |
| **Cacheable** | Responses indicate if they can be cached | Cache-Control headers |
| **Layered System** | Client doesn't know if connected to end server | Load balancers, proxies |

### 2. HTTP Methods and Their Usage

| Method | Purpose | Idempotent | Safe | Example |
|--------|---------|------------|------|---------|
| **GET** | Retrieve resources | ✅ Yes | ✅ Yes | `GET /users/123` |
| **POST** | Create new resource | ❌ No | ❌ No | `POST /users` |
| **PUT** | Replace entire resource | ✅ Yes | ❌ No | `PUT /users/123` |
| **PATCH** | Partial update | ❌ No* | ❌ No | `PATCH /users/123` |
| **DELETE** | Remove resource | ✅ Yes | ❌ No | `DELETE /users/123` |
| **HEAD** | Get headers only | ✅ Yes | ✅ Yes | `HEAD /users/123` |
| **OPTIONS** | Get available methods | ✅ Yes | ✅ Yes | `OPTIONS /users` |

*PATCH can be idempotent depending on implementation

### 3. HTTP Status Codes

**2xx Success:**
| Code | Name | When to Use |
|------|------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating resource |
| 202 | Accepted | Request accepted, processing async |
| 204 | No Content | Successful DELETE or update with no response body |

**3xx Redirection:**
| Code | Name | When to Use |
|------|------|-------------|
| 301 | Moved Permanently | Resource permanently moved |
| 302 | Found | Temporary redirect |
| 304 | Not Modified | Cached version is still valid |

**4xx Client Errors:**
| Code | Name | When to Use |
|------|------|-------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 405 | Method Not Allowed | HTTP method not supported |
| 409 | Conflict | Request conflicts with current state |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |

**5xx Server Errors:**
| Code | Name | When to Use |
|------|------|-------------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Invalid response from upstream |
| 503 | Service Unavailable | Server temporarily unavailable |
| 504 | Gateway Timeout | Upstream server timeout |

### 4. Resource Naming Conventions

**Good Practices:**
```
✅ Use nouns for resources
GET    /users
GET    /products
GET    /orders

✅ Use plural nouns
GET    /users          (not /user)
POST   /products       (not /product)

✅ Use hyphens for multi-word resources
GET    /user-profiles
GET    /order-items

✅ Nested resources for relationships
GET    /users/123/orders
GET    /posts/456/comments

✅ Use query parameters for filtering
GET    /users?role=admin&status=active
GET    /products?category=electronics&sort=price

✅ Use clear hierarchy
GET    /organizations/1/teams/2/members
```

**Bad Practices:**
```
❌ Don't use verbs in URLs
GET    /getUsers       (use GET /users)
POST   /createProduct  (use POST /products)
PUT    /updateUser     (use PUT /users/:id)

❌ Don't use mixed case
GET    /userProfiles   (use /user-profiles)

❌ Don't use underscores
GET    /user_profiles  (use /user-profiles)

❌ Don't nest too deeply
GET    /a/b/c/d/e/f    (too complex)

❌ Don't use file extensions
GET    /users.json     (use Accept header)
```

### 5. Request/Response Formats

**Standard JSON Response Structure:**
```json
{
  "data": {},           // The actual data
  "meta": {},           // Metadata about the response
  "errors": [],         // Array of errors (if any)
  "links": {}           // HATEOAS links
}
```

**Pagination Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13
  },
  "links": {
    "self": "/users?page=1",
    "first": "/users?page=1",
    "prev": null,
    "next": "/users?page=2",
    "last": "/users?page=13"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "age",
        "message": "Must be at least 18"
      }
    ]
  }
}
```

### 6. API Versioning Strategies

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| **URL Path** | `/api/v1/users` | Clear, easy to route | URL pollution |
| **Query Parameter** | `/api/users?version=1` | Clean URLs | Easy to miss |
| **Header** | `X-API-Version: 1` | Clean URLs | Less visible |
| **Accept Header** | `Accept: application/vnd.api.v1+json` | RESTful | Complex |
| **Subdomain** | `v1.api.example.com` | Separate infrastructure | DNS management |

**Recommendation:** URL Path versioning for simplicity and clarity.

## Examples

### Example 1: Complete User Management API

```typescript
// ============================================
// User Management API Endpoints
// ============================================

import express from 'express';
import { body, query, param, validationResult } from 'express-validator';

const router = express.Router();

// ============================================
// 1. GET /api/v1/users - List all users
// ============================================
router.get('/users',
  [
    query('page').optional().isInt({ min: 1 }).default(1),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(20),
    query('role').optional().isIn(['admin', 'user', 'moderator']),
    query('status').optional().isIn(['active', 'inactive']),
    query('search').optional().isString(),
    query('sort').optional().isIn(['createdAt', '-createdAt', 'name', '-name'])
  ],
  async (req, res) => {
    try {
      const { page, limit, role, status, search, sort } = req.query;

      // Build query
      const query = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ];
      }

      // Pagination
      const skip = (page - 1) * limit;
      const total = await User.countDocuments(query);

      // Fetch users
      const users = await User.find(query)
        .select('-password')  // Exclude sensitive fields
        .sort(sort || '-createdAt')
        .skip(skip)
        .limit(limit);

      // Response
      res.json({
        data: users,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        links: {
          self: `/api/v1/users?page=${page}&limit=${limit}`,
          first: `/api/v1/users?page=1&limit=${limit}`,
          prev: page > 1 ? `/api/v1/users?page=${page - 1}&limit=${limit}` : null,
          next: page < Math.ceil(total / limit) ? `/api/v1/users?page=${parseInt(page) + 1}&limit=${limit}` : null,
          last: `/api/v1/users?page=${Math.ceil(total / limit)}&limit=${limit}`
        }
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch users'
        }
      });
    }
  }
);

// ============================================
// 2. GET /api/v1/users/:id - Get single user
// ============================================
router.get('/users/:id',
  [
    param('id').isMongoId()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid user ID',
            details: errors.array()
          }
        });
      }

      const user = await User.findById(req.params.id).select('-password');

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        data: user
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user'
        }
      });
    }
  }
);

// ============================================
// 3. POST /api/v1/users - Create new user
// ============================================
router.post('/users',
  [
    body('name').trim().notEmpty().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('role').optional().isIn(['admin', 'user', 'moderator']).default('user')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: 'User with this email already exists'
          }
        });
      }

      // Create user
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: await hashPassword(req.body.password),
        role: req.body.role
      });

      await user.save();

      // Return created user (without password)
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201)
        .location(`/api/v1/users/${user._id}`)
        .json({
          data: userResponse,
          meta: {
            message: 'User created successfully'
          }
        });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user'
        }
      });
    }
  }
);

// ============================================
// 4. PUT /api/v1/users/:id - Replace user (full update)
// ============================================
router.put('/users/:id',
  [
    param('id').isMongoId(),
    body('name').trim().notEmpty().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['admin', 'user', 'moderator'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          email: req.body.email,
          role: req.body.role,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        data: user,
        meta: {
          message: 'User updated successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user'
        }
      });
    }
  }
);

// ============================================
// 5. PATCH /api/v1/users/:id - Partial update
// ============================================
router.patch('/users/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['admin', 'user', 'moderator']),
    body('status').optional().isIn(['active', 'inactive'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      // Only update provided fields
      const updateData = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.role) updateData.role = req.body.role;
      if (req.body.status) updateData.status = req.body.status;
      updateData.updatedAt = new Date();

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        data: user,
        meta: {
          message: 'User partially updated successfully'
        }
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user'
        }
      });
    }
  }
);

// ============================================
// 6. DELETE /api/v1/users/:id - Delete user
// ============================================
router.delete('/users/:id',
  [
    param('id').isMongoId()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid user ID',
            details: errors.array()
          }
        });
      }

      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // 204 No Content - successful deletion with no response body
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete user'
        }
      });
    }
  }
);

export default router;
```

### Example 2: Nested Resources - Blog Posts with Comments

```typescript
// ============================================
// Blog Post API with Nested Comments
// ============================================

// 1. Get all posts
GET /api/v1/posts
Response: 200 OK
{
  "data": [
    {
      "id": "123",
      "title": "Introduction to REST APIs",
      "content": "...",
      "author": {
        "id": "456",
        "name": "John Doe"
      },
      "createdAt": "2024-11-06T10:00:00Z",
      "commentsCount": 5
    }
  ]
}

// 2. Get single post with embedded comments
GET /api/v1/posts/123?include=comments
Response: 200 OK
{
  "data": {
    "id": "123",
    "title": "Introduction to REST APIs",
    "content": "...",
    "author": {
      "id": "456",
      "name": "John Doe"
    },
    "comments": [
      {
        "id": "789",
        "content": "Great post!",
        "author": {
          "id": "999",
          "name": "Jane Smith"
        },
        "createdAt": "2024-11-06T11:00:00Z"
      }
    ]
  }
}

// 3. Get comments for a post
GET /api/v1/posts/123/comments
Response: 200 OK
{
  "data": [
    {
      "id": "789",
      "postId": "123",
      "content": "Great post!",
      "author": {
        "id": "999",
        "name": "Jane Smith"
      },
      "createdAt": "2024-11-06T11:00:00Z"
    }
  ]
}

// 4. Create comment on a post
POST /api/v1/posts/123/comments
Request:
{
  "content": "Thanks for sharing!"
}
Response: 201 Created
{
  "data": {
    "id": "790",
    "postId": "123",
    "content": "Thanks for sharing!",
    "author": {
      "id": "current-user-id",
      "name": "Current User"
    },
    "createdAt": "2024-11-06T12:00:00Z"
  }
}

// 5. Update specific comment
PATCH /api/v1/posts/123/comments/789
Request:
{
  "content": "Updated comment text"
}
Response: 200 OK

// 6. Delete comment
DELETE /api/v1/posts/123/comments/789
Response: 204 No Content
```

### Example 3: Search and Filtering API

```typescript
// ============================================
// Advanced Search and Filtering
// ============================================

// 1. Simple search
GET /api/v1/products?search=laptop

// 2. Filter by category
GET /api/v1/products?category=electronics

// 3. Multiple filters
GET /api/v1/products?category=electronics&brand=apple&minPrice=1000&maxPrice=2000

// 4. Sorting
GET /api/v1/products?sort=price           // Ascending
GET /api/v1/products?sort=-price          // Descending (note the minus)
GET /api/v1/products?sort=price,-rating   // Multiple sorts

// 5. Pagination
GET /api/v1/products?page=2&limit=20

// 6. Field selection (sparse fieldsets)
GET /api/v1/products?fields=id,name,price  // Only return specified fields

// 7. Complex combined query
GET /api/v1/products?
    search=laptop&
    category=electronics&
    brand=apple,dell&
    minPrice=1000&
    maxPrice=2000&
    inStock=true&
    sort=-rating,price&
    page=1&
    limit=20&
    fields=id,name,price,rating

// Implementation
router.get('/products', async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sort = '-createdAt',
      page = 1,
      limit = 20,
      fields
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (brand) {
      query.brand = { $in: brand.split(',') };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    // Field selection
    const selectFields = fields ? fields.split(',').join(' ') : null;

    // Execute query
    const products = await Product.find(query)
      .select(selectFields)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      data: products,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        filters: {
          search,
          category,
          brand,
          priceRange: { min: minPrice, max: maxPrice },
          inStock
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search products'
      }
    });
  }
});
```

### Example 4: API Rate Limiting and Throttling

```typescript
// ============================================
// Rate Limiting Implementation
// ============================================

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from './config/redis';

// Standard rate limiter
const standardLimiter = rateLimit({
  store: new RedisStore({
    client: redis
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        retryAfter: req.rateLimit.resetTime
      }
    });
  }
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts, please try again later'
    }
  }
});

// Generous limiter for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000 // More requests for public endpoints
});

// Apply limiters
app.use('/api/v1', standardLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/public', publicLimiter);

// Custom rate limit based on API key tier
const tierBasedLimiter = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key required'
      }
    });
  }

  const tier = await getApiKeyTier(apiKey);

  const limits = {
    free: { windowMs: 60000, max: 10 },       // 10/min
    basic: { windowMs: 60000, max: 100 },     // 100/min
    premium: { windowMs: 60000, max: 1000 },  // 1000/min
    enterprise: { windowMs: 60000, max: 10000 } // 10000/min
  };

  const limit = limits[tier] || limits.free;

  // Check Redis for current count
  const key = `ratelimit:${apiKey}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.pexpire(key, limit.windowMs);
  }

  // Set headers
  res.set({
    'X-RateLimit-Limit': limit.max,
    'X-RateLimit-Remaining': Math.max(0, limit.max - current),
    'X-RateLimit-Reset': Date.now() + limit.windowMs
  });

  if (current > limit.max) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded for ${tier} tier`,
        limit: limit.max,
        window: `${limit.windowMs / 1000} seconds`
      }
    });
  }

  next();
};
```

## Common Patterns

### Pattern 1: HATEOAS (Hypermedia as the Engine of Application State)

```json
{
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "links": {
    "self": "/api/v1/users/123",
    "posts": "/api/v1/users/123/posts",
    "comments": "/api/v1/users/123/comments",
    "followers": "/api/v1/users/123/followers",
    "following": "/api/v1/users/123/following"
  },
  "actions": {
    "update": {
      "method": "PATCH",
      "href": "/api/v1/users/123"
    },
    "delete": {
      "method": "DELETE",
      "href": "/api/v1/users/123"
    },
    "follow": {
      "method": "POST",
      "href": "/api/v1/users/123/follow"
    }
  }
}
```

### Pattern 2: Bulk Operations

```typescript
// Bulk create
POST /api/v1/users/bulk
Request:
{
  "users": [
    { "name": "User 1", "email": "user1@example.com" },
    { "name": "User 2", "email": "user2@example.com" }
  ]
}
Response: 201 Created
{
  "data": {
    "created": 2,
    "failed": 0,
    "users": [...]
  }
}

// Bulk update
PATCH /api/v1/users/bulk
Request:
{
  "updates": [
    { "id": "123", "status": "active" },
    { "id": "456", "status": "inactive" }
  ]
}

// Bulk delete
DELETE /api/v1/users/bulk
Request:
{
  "ids": ["123", "456", "789"]
}
Response: 200 OK
{
  "data": {
    "deleted": 3,
    "failed": 0
  }
}
```

### Pattern 3: Asynchronous Operations

```typescript
// Start long-running operation
POST /api/v1/reports/generate
Request:
{
  "type": "sales",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
Response: 202 Accepted
{
  "data": {
    "jobId": "job-789",
    "status": "processing",
    "estimatedTime": "5 minutes"
  },
  "links": {
    "status": "/api/v1/jobs/job-789",
    "result": "/api/v1/jobs/job-789/result"
  }
}

// Check job status
GET /api/v1/jobs/job-789
Response: 200 OK
{
  "data": {
    "jobId": "job-789",
    "status": "completed",  // or "processing", "failed"
    "progress": 100,
    "startedAt": "2024-11-06T10:00:00Z",
    "completedAt": "2024-11-06T10:05:00Z"
  },
  "links": {
    "result": "/api/v1/jobs/job-789/result"
  }
}

// Get result
GET /api/v1/jobs/job-789/result
Response: 200 OK
{
  "data": {
    "reportUrl": "https://cdn.example.com/reports/report-123.pdf",
    "expiresAt": "2024-11-13T10:00:00Z"
  }
}
```

## Best Practices

### DO ✅

- **Use consistent naming conventions**
  ```
  ✅ All resources use plural nouns
  ✅ All multi-word resources use hyphens
  ✅ All endpoints follow /api/v1/resource pattern
  ```

- **Return appropriate status codes**
  ```
  ✅ 200 for successful GET/PUT/PATCH
  ✅ 201 for successful POST (resource created)
  ✅ 204 for successful DELETE (no content)
  ✅ 400 for bad requests
  ✅ 401 for auth required
  ✅ 404 for not found
  ✅ 422 for validation errors
  ```

- **Include metadata in responses**
  ```json
  {
    "data": [...],
    "meta": {
      "page": 1,
      "total": 100,
      "requestId": "req-123",
      "timestamp": "2024-11-06T10:00:00Z"
    }
  }
  ```

- **Implement pagination for list endpoints**
  ```
  ✅ Always paginate large datasets
  ✅ Include total count
  ✅ Provide next/prev links
  ✅ Allow configurable page size (with max limit)
  ```

- **Version your API**
  ```
  ✅ Use /api/v1/... for version 1
  ✅ Maintain backward compatibility
  ✅ Deprecate old versions gracefully
  ```

- **Use proper HTTP methods**
  ```
  ✅ GET for reading
  ✅ POST for creating
  ✅ PUT for full replacement
  ✅ PATCH for partial updates
  ✅ DELETE for removal
  ```

### DON'T ❌

- **Don't use verbs in URLs**
  ```
  ❌ POST /api/createUser
  ✅ POST /api/users
  ```

- **Don't return raw data without structure**
  ```
  ❌ [{ user1 }, { user2 }]
  ✅ { "data": [{ user1 }, { user2 }], "meta": {...} }
  ```

- **Don't expose internal IDs or sensitive data**
  ```
  ❌ Return database IDs, internal codes
  ✅ Use UUIDs or obfuscated IDs
  ✅ Filter sensitive fields
  ```

- **Don't ignore errors**
  ```
  ❌ Return 200 with error in body
  ✅ Return proper error status codes
  ```

- **Don't create deeply nested routes**
  ```
  ❌ /api/v1/users/123/posts/456/comments/789/likes
  ✅ /api/v1/comments/789/likes
  ```

- **Don't forget rate limiting**
  ```
  ❌ Unlimited requests per user
  ✅ Implement rate limiting
  ✅ Return rate limit headers
  ```

## Troubleshooting

### Issue 1: API Versioning Migration

**Problem:** Need to release API v2 while supporting v1.

**Solution:**
```typescript
// 1. Maintain both versions
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// 2. Add deprecation warnings to v1
app.use('/api/v1', (req, res, next) => {
  res.set('X-API-Deprecation', 'API v1 is deprecated. Please migrate to v2 by 2025-01-01');
  res.set('X-API-Version-Current', '2.0');
  next();
});

// 3. Document migration guide
/*
  Migration from v1 to v2:
  - /api/v1/user/:id → /api/v2/users/:id (plural)
  - Response format changed: { user: {...} } → { data: {...} }
  - Authentication now uses Bearer tokens instead of API keys
*/

// 4. Set sunset date for v1
app.use('/api/v1', (req, res, next) => {
  const sunsetDate = new Date('2025-01-01');
  res.set('Sunset', sunsetDate.toUTCString());
  next();
});
```

### Issue 2: Handling Large Response Payloads

**Problem:** API response is too large, causing timeouts.

**Solution:**
```typescript
// 1. Implement pagination
GET /api/v1/users?page=1&limit=100

// 2. Use field selection
GET /api/v1/users?fields=id,name,email

// 3. Implement compression
import compression from 'compression';
app.use(compression());

// 4. Use streaming for large data
router.get('/users/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');

  const stream = User.find().cursor();

  res.write('[');
  let first = true;

  stream.on('data', (doc) => {
    if (!first) res.write(',');
    res.write(JSON.stringify(doc));
    first = false;
  });

  stream.on('end', () => {
    res.write(']');
    res.end();
  });
});

// 5. Implement cursor-based pagination for large datasets
GET /api/v1/users?cursor=eyJpZCI6IjEyMyJ9&limit=100
```

### Issue 3: API Documentation Out of Sync

**Problem:** API documentation doesn't match actual implementation.

**Solution:**
```typescript
// Use OpenAPI/Swagger with code generation
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'User management API'
    },
    servers: [
      { url: 'http://localhost:3000/api/v1' }
    ]
  },
  apis: ['./routes/*.ts'] // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Annotate your routes
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/users', async (req, res) => {
  // Implementation
});
```

### Issue 4: Inconsistent Error Responses

**Problem:** Different endpoints return errors in different formats.

**Solution:**
```typescript
// Create centralized error handler
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

// Error handler middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details })
      }
    });
  }

  // Unexpected errors
  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Use throughout application
router.post('/users', async (req, res, next) => {
  try {
    if (!req.body.email) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Email is required');
    }

    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      throw new ApiError(409, 'CONFLICT', 'User already exists');
    }

    // Create user...
  } catch (error) {
    next(error);
  }
});
```

---

**Token Count: ~4,128 tokens**

This skill provides comprehensive API design patterns that help developers create well-structured, maintainable, and industry-standard REST APIs.
