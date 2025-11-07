# Documentation Writer

## Purpose

Expert guidance for creating clear, maintainable technical documentation including README files, API documentation, code comments, architecture docs, and changelogs that improve code maintainability and team collaboration.

## When to Use

- **Project setup** - Creating README and initial documentation
- **API development** - Documenting endpoints and parameters
- **Code reviews** - Ensuring proper inline documentation
- **Onboarding** - Helping new developers understand the codebase
- **Knowledge sharing** - Documenting architectural decisions
- **Open source** - Creating contributor-friendly documentation
- **Maintenance** - Updating docs when code changes
- **Release management** - Maintaining changelogs

## Core Concepts

### 1. Documentation Types

| Type | Purpose | Audience | Update Frequency |
|------|---------|----------|-----------------|
| **README** | Project overview and getting started | All developers | Every major change |
| **API Docs** | Endpoint specifications | API consumers | Every API change |
| **Code Comments** | Explain complex logic | Code maintainers | With code changes |
| **Architecture Docs** | System design and decisions | Technical team | Architecture changes |
| **User Guides** | How to use the product | End users | Feature releases |
| **Changelog** | Version history | All stakeholders | Every release |
| **Contributing Guide** | How to contribute | Contributors | As needed |

### 2. Documentation Hierarchy

```
Documentation Structure
├── README.md                    (Start here - project overview)
├── docs/
│   ├── getting-started.md       (Installation & quick start)
│   ├── architecture.md          (System design)
│   ├── api/
│   │   ├── authentication.md    (Auth guide)
│   │   ├── endpoints.md         (API reference)
│   │   └── examples.md          (Usage examples)
│   ├── guides/
│   │   ├── development.md       (Dev workflow)
│   │   ├── deployment.md        (Deploy guide)
│   │   └── troubleshooting.md   (Common issues)
│   └── adr/                     (Architecture Decision Records)
│       ├── 001-database-choice.md
│       └── 002-auth-strategy.md
├── CHANGELOG.md                 (Version history)
├── CONTRIBUTING.md              (How to contribute)
└── LICENSE.md                   (License info)
```

### 3. README Structure

Essential sections for a good README:

```markdown
# Project Name

Brief one-liner description

## Features
- Key feature 1
- Key feature 2

## Installation
Step-by-step install instructions

## Quick Start
Minimal example to get started

## Usage
Common use cases

## API Reference
Link to detailed API docs

## Configuration
Environment variables, config files

## Development
Setup for contributors

## Testing
How to run tests

## Deployment
How to deploy

## Contributing
How to contribute

## License
License information

## Contact/Support
How to get help
```

### 4. Code Comment Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Explain Why, Not What** | Code shows what; comments explain why | ✅ "Using setTimeout to avoid race condition" |
| **Document Public APIs** | All public functions need docs | JSDoc, docstrings |
| **Update with Code** | Keep comments current | Delete outdated comments |
| **Avoid Obvious Comments** | Don't state the obvious | ❌ "Increment i by 1" |
| **Use TODO Comments** | Mark incomplete work | `// TODO: Add error handling` |
| **Document Workarounds** | Explain unusual solutions | "Workaround for Safari bug" |

### 5. API Documentation Standards

**OpenAPI/Swagger Format:**
```yaml
paths:
  /users:
    get:
      summary: Get all users
      description: Returns a paginated list of users
      parameters:
        - name: page
          in: query
          description: Page number
          required: false
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                  meta:
                    type: object
```

## Examples

### Example 1: Comprehensive README

```markdown
# E-Commerce API

A RESTful API for managing an e-commerce platform with user authentication, product catalog, shopping cart, and order management.

[![Build Status](https://github.com/user/repo/workflows/CI/badge.svg)](https://github.com/user/repo/actions)
[![Coverage](https://codecov.io/gh/user/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/user/repo)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👤 User management with role-based access control
- 📦 Product catalog with categories and search
- 🛒 Shopping cart with persistent storage
- 💳 Order processing and payment integration
- 📧 Email notifications for order updates
- 📊 Admin dashboard with analytics

## Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **Cache:** Redis 7+
- **Authentication:** JWT
- **Testing:** Jest, Supertest
- **Documentation:** Swagger/OpenAPI

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Redis 7.x or higher
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/username/ecommerce-api.git
cd ecommerce-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Run database migrations

```bash
npm run migrate
```

### 5. Seed the database (optional)

```bash
npm run seed
```

## Quick Start

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Try it out

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

## API Documentation

Interactive API documentation is available at:

- **Development:** http://localhost:3000/api-docs
- **Production:** https://api.example.com/api-docs

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/products` | List products |
| POST | `/api/cart` | Add to cart |
| POST | `/api/orders` | Create order |

For detailed API reference, see [API Documentation](docs/api/README.md).

## Usage Examples

### Authentication

```javascript
// Register
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const { token } = await response.json();

// Use token for authenticated requests
const products = await fetch('http://localhost:3000/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Managing Products

```javascript
// Get all products with filters
const products = await fetch(
  'http://localhost:3000/api/products?category=electronics&minPrice=100&sort=-price',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

// Get single product
const product = await fetch('http://localhost:3000/api/products/123', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

For more examples, see [Usage Guide](docs/guides/usage.md).

## Development

### Project Structure

```
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── app.ts           # Express app setup
├── tests/               # Test files
├── docs/                # Documentation
├── migrations/          # Database migrations
└── scripts/             # Utility scripts
```

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run migrate      # Run database migrations
npm run migrate:undo # Undo last migration
npm run seed         # Seed database
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Style

This project uses ESLint and Prettier for code formatting. Code is automatically formatted on commit using Husky pre-commit hooks.

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Deployment

### Docker

Build and run with Docker:

```bash
# Build image
docker build -t ecommerce-api .

# Run container
docker run -p 3000:3000 --env-file .env ecommerce-api
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

See [Deployment Guide](docs/guides/deployment.md) for detailed instructions on deploying to:
- AWS (EC2, ECS, Lambda)
- Heroku
- DigitalOcean
- Railway

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | No | development |
| `PORT` | Server port | No | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 7d |

For complete configuration reference, see [Configuration Guide](docs/configuration.md).

## Troubleshooting

### Common Issues

**1. Database connection error**

```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Solution: Ensure PostgreSQL is running and credentials are correct.

**2. Port already in use**

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

Solution: Change PORT in `.env` or kill process using port 3000.

For more solutions, see [Troubleshooting Guide](docs/guides/troubleshooting.md).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 🐛 Issues: [GitHub Issues](https://github.com/user/repo/issues)
- 📖 Docs: [Full Documentation](https://docs.example.com)

## Acknowledgments

- Thanks to all [contributors](https://github.com/user/repo/graphs/contributors)
- Built with [Express.js](https://expressjs.com)
- Inspired by [best practices guide](https://github.com/goldbergyoni/nodebestpractices)

---

Made with ❤️ by [Your Team](https://example.com)
```

### Example 2: JSDoc Comments

```typescript
/**
 * User service for managing user operations
 *
 * @class UserService
 * @description Handles user creation, authentication, and profile management
 */
export class UserService {
  /**
   * Creates a new user account
   *
   * @param {CreateUserDto} userData - User registration data
   * @param {string} userData.name - Full name of the user
   * @param {string} userData.email - Email address (must be unique)
   * @param {string} userData.password - Plain text password (will be hashed)
   * @param {string} [userData.role='user'] - User role (default: 'user')
   *
   * @returns {Promise<User>} The created user object (without password)
   *
   * @throws {ValidationError} If email format is invalid or password too weak
   * @throws {ConflictError} If email already exists
   * @throws {InternalError} If user creation fails
   *
   * @example
   * const user = await userService.createUser({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   password: 'SecurePass123',
   *   role: 'admin'
   * });
   *
   * @see {@link getUserById} for retrieving users
   * @see {@link updateUser} for updating user info
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    // Validation
    const errors = this.validateUserData(userData);
    if (errors.length > 0) {
      throw new ValidationError('Invalid user data', errors);
    }

    // Check for existing user
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    // Create user with hashed password
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: await this.hashPassword(userData.password),
      role: userData.role || 'user'
    });

    await user.save();

    // Send welcome email asynchronously
    this.emailService.sendWelcomeEmail(user.email, user.name)
      .catch(err => logger.error('Failed to send welcome email', { err }));

    return user;
  }

  /**
   * Retrieves a user by their ID
   *
   * @param {string} userId - The user's unique identifier
   * @returns {Promise<User>} The user object
   * @throws {NotFoundError} If user doesn't exist
   *
   * @example
   * const user = await userService.getUserById('507f1f77bcf86cd799439011');
   */
  async getUserById(userId: string): Promise<User> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Hashes a plain text password using bcrypt
   *
   * @private
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   *
   * @description Uses bcrypt with salt rounds of 10 for secure hashing.
   * This is a CPU-intensive operation and should not be called frequently.
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}

// ============================================
// Type Documentation
// ============================================

/**
 * User data transfer object for user creation
 *
 * @interface CreateUserDto
 * @property {string} name - User's full name (2-50 characters)
 * @property {string} email - Valid email address
 * @property {string} password - Password (minimum 8 characters)
 * @property {string} [role] - User role: 'admin' | 'user' | 'moderator'
 */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user' | 'moderator';
}

/**
 * User model representing a registered user
 *
 * @interface User
 * @property {string} id - Unique user identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} password - Hashed password (bcrypt)
 * @property {string} role - User's role
 * @property {boolean} isActive - Account active status
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'moderator';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Example 3: API Documentation with Swagger

```typescript
// ============================================
// Swagger Documentation in Code
// ============================================

import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Returns a paginated list of users with optional filtering
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user, moderator]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *     examples:
 *       application/json:
 *         data:
 *           - id: "507f1f77bcf86cd799439011"
 *             name: "John Doe"
 *             email: "john@example.com"
 *             role: "user"
 *         meta:
 *           page: 1
 *           limit: 20
 *           total: 1
 *           totalPages: 1
 */
router.get('/users', userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns a single user by their unique identifier
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/users/:id', userController.getUser);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: User's full name
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john@example.com"
 *         role:
 *           type: string
 *           enum: [admin, user, moderator]
 *           description: User's role
 *           example: "user"
 *         isActive:
 *           type: boolean
 *           description: Whether the account is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *           example: "2024-11-06T10:00:00Z"
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Authentication required
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     example: "UNAUTHORIZED"
 *                   message:
 *                     type: string
 *                     example: "Authentication required"
 */
```

### Example 4: CHANGELOG Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dark mode support for UI components
- Export functionality for reports

### Changed
- Improved search performance by 40%

### Fixed
- Memory leak in event listeners

## [2.1.0] - 2024-11-06

### Added
- User profile customization
- Two-factor authentication support
- Email notification preferences
- API rate limiting per user tier

### Changed
- Updated authentication flow to use refresh tokens
- Migrated from MongoDB to PostgreSQL
- Improved error messages for better debugging

### Deprecated
- Legacy `/api/v1/auth/login` endpoint (use `/api/v2/auth/login`)

### Removed
- Support for Node.js 14 (EOL)

### Fixed
- Security vulnerability in password reset flow
- Race condition in order processing
- Memory leak in WebSocket connections

### Security
- Updated dependencies to patch CVE-2024-XXXXX
- Implemented rate limiting on auth endpoints
- Added input sanitization for user-generated content

## [2.0.0] - 2024-10-15

### Added
- Complete rewrite of frontend in React
- GraphQL API endpoint
- Real-time notifications via WebSocket
- Admin dashboard with analytics

### Changed
- **BREAKING:** API response format changed
- **BREAKING:** Authentication now requires JWT instead of sessions
- Database schema updated (migration required)

### Removed
- **BREAKING:** Removed legacy SOAP API

### Migration Guide
See [v2 Migration Guide](docs/migrations/v2.md) for upgrading from v1.x

## [1.5.2] - 2024-09-20

### Fixed
- Critical bug in payment processing
- XSS vulnerability in comment system

### Security
- Updated Express to 4.18.2

## [1.5.1] - 2024-09-10

### Fixed
- Login redirect loop on Safari
- Image upload failing for files > 5MB

## [1.5.0] - 2024-09-01

### Added
- Shopping cart persistence
- Product recommendations
- Wishlist feature

### Changed
- Improved mobile responsive design
- Faster page load times

### Fixed
- Cart total calculation with discounts
- Search results pagination

## [1.0.0] - 2024-08-01

### Added
- Initial release
- User authentication
- Product catalog
- Shopping cart
- Order management
- Payment integration

[Unreleased]: https://github.com/user/repo/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/user/repo/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/user/repo/compare/v1.5.2...v2.0.0
[1.5.2]: https://github.com/user/repo/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/user/repo/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/user/repo/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

## Common Patterns

### Pattern 1: Architecture Decision Record (ADR)

```markdown
# ADR 001: Database Selection

## Status
Accepted

## Context
We need to choose a database for our e-commerce platform that handles:
- User data with complex relationships
- Product catalog with categories and attributes
- Order transactions requiring ACID compliance
- High read/write throughput (10,000+ requests/minute)

## Decision
We will use PostgreSQL as our primary database.

## Consequences

### Positive
- Strong ACID compliance for transactions
- Excellent support for complex queries and joins
- Mature ecosystem with good tooling
- Horizontal scaling with read replicas
- JSON support for flexible product attributes

### Negative
- Requires more server resources than NoSQL alternatives
- Slightly more complex setup than MongoDB
- Need to design schema upfront

### Neutral
- Team needs training on SQL optimization
- Will use Prisma ORM for easier database access

## Alternatives Considered

### MongoDB
- Pros: Flexible schema, easy to get started
- Cons: No ACID transactions (at the time), complex queries are harder
- Rejected because: Transaction support is critical for payments

### MySQL
- Pros: Widely used, good performance
- Cons: Less advanced features than PostgreSQL
- Rejected because: PostgreSQL's JSON support is superior

## References
- [PostgreSQL vs MongoDB](https://www.example.com/article)
- Team discussion: Slack thread from 2024-10-15
```

### Pattern 2: TODO Comments

```typescript
// TODO: Add caching layer for frequently accessed products
// FIXME: Memory leak when processing large file uploads
// HACK: Temporary workaround for Safari bug - remove when fixed
// NOTE: This calculation must match the mobile app logic
// WARNING: Changing this affects billing - consult finance team
// OPTIMIZE: This query could be improved with proper indexing
```

### Pattern 3: Inline Documentation

```typescript
/**
 * Calculate the final price after applying discounts and taxes
 *
 * Order of operations is critical:
 * 1. Calculate subtotal (price * quantity for all items)
 * 2. Apply discount percentage to subtotal
 * 3. Calculate tax on discounted amount
 * 4. Add tax to get final total
 *
 * Example:
 * - Subtotal: $100
 * - Discount (10%): -$10 → $90
 * - Tax (20%): +$18
 * - Final: $108
 */
function calculateTotal(cart: Cart): number {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  // Apply discount before tax (business requirement from finance dept)
  const afterDiscount = cart.discount
    ? subtotal * (1 - cart.discount)
    : subtotal;

  // Tax calculated on discounted amount
  const tax = cart.taxRate
    ? afterDiscount * cart.taxRate
    : 0;

  return afterDiscount + tax;
}
```

## Best Practices

### DO ✅

- **Write documentation as you code**
  ```
  ✅ Document function while writing it
  ✅ Update README when adding features
  ✅ Keep changelog current with each PR
  ```

- **Use clear, simple language**
  ```
  ✅ "Install dependencies with npm install"
  ❌ "Execute package installation via npm"
  ```

- **Include code examples**
  ```markdown
  ✅ Show actual usage:
  ```javascript
  const user = await userService.createUser({ name: 'John' });
  ```
  ```

- **Keep documentation close to code**
  ```
  ✅ JSDoc comments above functions
  ✅ README in project root
  ✅ API docs generated from code
  ```

- **Use consistent formatting**
  ```
  ✅ Same heading styles
  ✅ Consistent code block language tags
  ✅ Standard markdown conventions
  ```

- **Link related documentation**
  ```markdown
  ✅ See [API Reference](docs/api.md) for details
  ✅ Related: [Authentication Guide](docs/auth.md)
  ```

### DON'T ❌

- **Don't write obvious comments**
  ```typescript
  // ❌ BAD
  i++; // Increment i by 1

  // ✅ GOOD (no comment needed - code is self-explanatory)
  i++;
  ```

- **Don't let documentation get outdated**
  ```markdown
  ❌ README says "Install Node 12" but code requires Node 18
  ❌ Comment says "Returns string" but function returns object
  ```

- **Don't document everything**
  ```typescript
  // ❌ Over-documented
  /**
   * Gets user name
   * @returns user name
   */
  getName(): string { return this.name; }

  // ✅ Self-explanatory, no docs needed
  getName(): string { return this.name; }
  ```

- **Don't use jargon without explanation**
  ```markdown
  ❌ "Use idempotent PUT requests with HATEOAS"
  ✅ "Use PUT requests that can be safely repeated. Each response includes links to related resources."
  ```

- **Don't skip the "why"**
  ```typescript
  // ❌ What, but not why
  // Wait 100ms
  await sleep(100);

  // ✅ Explains why
  // Wait 100ms to avoid rate limiting (API allows 10 req/second)
  await sleep(100);
  ```

## Troubleshooting

### Issue 1: Documentation Gets Out of Sync

**Problem:** Docs don't match current code.

**Solution:**
```bash
# 1. Add docs to code review checklist
- [ ] Documentation updated
- [ ] README reflects changes
- [ ] API docs regenerated

# 2. Automate docs generation
npm run docs:generate

# 3. Add docs check to CI
npm run docs:check

# 4. Use Conventional Commits for auto-changelog
git commit -m "feat: add user profile"
# Automatically added to CHANGELOG
```

### Issue 2: No One Reads the Documentation

**Problem:** Team doesn't read or follow docs.

**Solution:**
```markdown
# Make docs discoverable
- Put README at project root
- Link docs in PR template
- Show docs link in CLI help
- Make docs searchable

# Make docs scannable
- Use clear headings
- Add table of contents
- Use bullet points
- Include quick examples

# Make docs helpful
- Focus on common use cases
- Include troubleshooting section
- Add FAQs
- Provide working examples
```

### Issue 3: Too Much or Too Little Documentation

**Problem:** Either overwhelming detail or missing key info.

**Solution:**
```markdown
# Find the right balance:

## Quick Start (Minimal)
- 5-minute setup
- One simple example
- Link to full docs

## Full Documentation (Comprehensive)
- Installation details
- All configuration options
- Multiple examples
- Troubleshooting
- API reference

# Progressive disclosure:
1. Quick start → Get running fast
2. Tutorials → Learn key concepts
3. How-to guides → Solve specific problems
4. Reference → Complete details
```

### Issue 4: Maintaining Multiple Doc Versions

**Problem:** Need docs for multiple versions (v1, v2, etc.).

**Solution:**
```bash
# Use version branches
docs/
  ├── v1/       # Docs for version 1.x
  ├── v2/       # Docs for version 2.x
  └── latest/   # Current development

# Or use doc versioning tools
- Docusaurus (supports versioning)
- GitBook (branch-based)
- Read the Docs (version selector)

# Mark deprecated features
## Authentication (Deprecated)
> ⚠️ **Deprecated:** Use [v2 auth](../v2/auth.md) instead.
> This will be removed in v3.0.0.
```

---

**Token Count: ~2,510 tokens**

This skill provides comprehensive guidance for creating and maintaining effective technical documentation that improves code understanding and team collaboration.
