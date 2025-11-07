# Testing Best Practices

## Purpose

Comprehensive testing strategies and best practices for building reliable software through effective unit tests, integration tests, end-to-end tests, and implementing test-driven development (TDD) methodologies.

## When to Use

- **Writing new features** - Implement tests alongside or before code (TDD)
- **Refactoring code** - Ensure tests prevent regressions
- **Bug fixing** - Write tests that reproduce bugs before fixing
- **CI/CD pipelines** - Automate test execution for quality gates
- **Code reviews** - Verify test coverage and quality
- **API development** - Test all endpoints and scenarios
- **Legacy code** - Add tests before making changes
- **Test strategy planning** - Define testing approach for projects

## Core Concepts

### 1. Test Pyramid

```
          /\
         /  \
        / E2E \          10% - End-to-End Tests
       /______\          - Full system tests
      /        \         - Slow, expensive
     /Integration\       30% - Integration Tests
    /____________\       - Test component interactions
   /              \      - Moderate speed
  /   Unit Tests   \     60% - Unit Tests
 /__________________\    - Test individual functions
                         - Fast, cheap, many tests
```

| Level | Purpose | Speed | Cost | Quantity | Example |
|-------|---------|-------|------|----------|---------|
| **Unit** | Test individual functions/methods | Very Fast | Low | Many | Test `calculateTotal()` |
| **Integration** | Test component interactions | Medium | Medium | Some | Test API + Database |
| **E2E** | Test complete user flows | Slow | High | Few | Test login → purchase flow |

### 2. Test Types

| Type | Description | When to Use | Tools |
|------|-------------|-------------|-------|
| **Unit Tests** | Test single functions in isolation | Always, for business logic | Jest, Mocha, Pytest |
| **Integration Tests** | Test multiple components together | API endpoints, DB queries | Supertest, Pytest |
| **E2E Tests** | Test from user perspective | Critical user journeys | Playwright, Cypress |
| **Smoke Tests** | Basic functionality check | After deployments | Custom scripts |
| **Regression Tests** | Ensure bugs don't reoccur | After bug fixes | All test types |
| **Performance Tests** | Measure speed and scalability | Before releases | k6, JMeter |
| **Security Tests** | Check for vulnerabilities | APIs, auth systems | OWASP ZAP, Snyk |

### 3. AAA Pattern (Arrange-Act-Assert)

```typescript
test('should calculate total with discount', () => {
  // Arrange - Set up test data
  const cart = {
    items: [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 }
    ],
    discount: 0.1 // 10% discount
  };

  // Act - Execute the function
  const total = calculateTotal(cart);

  // Assert - Verify the result
  expect(total).toBe(225); // (200 + 50) * 0.9 = 225
});
```

### 4. Test Coverage Metrics

| Metric | Description | Target | Notes |
|--------|-------------|--------|-------|
| **Line Coverage** | % of lines executed | 80%+ | Most common metric |
| **Branch Coverage** | % of decision branches tested | 75%+ | Better than line coverage |
| **Function Coverage** | % of functions called | 90%+ | Easy to achieve |
| **Statement Coverage** | % of statements executed | 80%+ | Similar to line coverage |

**Note:** 100% coverage doesn't mean bug-free code. Focus on meaningful tests.

### 5. Test Doubles

| Type | Description | When to Use |
|------|-------------|-------------|
| **Mock** | Fake object that verifies interactions | Verify function was called |
| **Stub** | Provides predefined responses | Replace external dependencies |
| **Spy** | Records how it was used | Track function calls |
| **Fake** | Working implementation (simplified) | In-memory database for tests |
| **Dummy** | Placeholder (never used) | Fill parameter lists |

## Examples

### Example 1: Unit Testing with Jest (TypeScript)

```typescript
// ============================================
// Source Code: cart.service.ts
// ============================================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  discount?: number;
  taxRate?: number;
}

export class CartService {
  calculateItemTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  calculateSubtotal(cart: Cart): number {
    return cart.items.reduce(
      (sum, item) => sum + this.calculateItemTotal(item),
      0
    );
  }

  calculateDiscount(subtotal: number, discountRate: number): number {
    if (discountRate < 0 || discountRate > 1) {
      throw new Error('Discount rate must be between 0 and 1');
    }
    return subtotal * discountRate;
  }

  calculateTax(amount: number, taxRate: number): number {
    return amount * taxRate;
  }

  calculateTotal(cart: Cart): number {
    const subtotal = this.calculateSubtotal(cart);
    const discount = cart.discount
      ? this.calculateDiscount(subtotal, cart.discount)
      : 0;
    const afterDiscount = subtotal - discount;
    const tax = cart.taxRate
      ? this.calculateTax(afterDiscount, cart.taxRate)
      : 0;

    return afterDiscount + tax;
  }

  isEmpty(cart: Cart): boolean {
    return cart.items.length === 0;
  }

  getItemCount(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

// ============================================
// Test Code: cart.service.test.ts
// ============================================

import { CartService, Cart, CartItem } from './cart.service';

describe('CartService', () => {
  let cartService: CartService;

  // Setup - runs before each test
  beforeEach(() => {
    cartService = new CartService();
  });

  describe('calculateItemTotal', () => {
    it('should calculate total for single item', () => {
      // Arrange
      const item: CartItem = {
        id: '1',
        name: 'Product',
        price: 100,
        quantity: 2
      };

      // Act
      const result = cartService.calculateItemTotal(item);

      // Assert
      expect(result).toBe(200);
    });

    it('should handle zero quantity', () => {
      const item: CartItem = {
        id: '1',
        name: 'Product',
        price: 100,
        quantity: 0
      };

      const result = cartService.calculateItemTotal(item);

      expect(result).toBe(0);
    });

    it('should handle decimal prices', () => {
      const item: CartItem = {
        id: '1',
        name: 'Product',
        price: 9.99,
        quantity: 3
      };

      const result = cartService.calculateItemTotal(item);

      expect(result).toBeCloseTo(29.97, 2); // 2 decimal places
    });
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal for multiple items', () => {
      const cart: Cart = {
        items: [
          { id: '1', name: 'Item 1', price: 100, quantity: 2 },
          { id: '2', name: 'Item 2', price: 50, quantity: 1 }
        ]
      };

      const result = cartService.calculateSubtotal(cart);

      expect(result).toBe(250); // (100*2) + (50*1)
    });

    it('should return 0 for empty cart', () => {
      const cart: Cart = { items: [] };

      const result = cartService.calculateSubtotal(cart);

      expect(result).toBe(0);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate 10% discount correctly', () => {
      const result = cartService.calculateDiscount(100, 0.1);
      expect(result).toBe(10);
    });

    it('should throw error for invalid discount rate (negative)', () => {
      expect(() => {
        cartService.calculateDiscount(100, -0.1);
      }).toThrow('Discount rate must be between 0 and 1');
    });

    it('should throw error for invalid discount rate (>1)', () => {
      expect(() => {
        cartService.calculateDiscount(100, 1.5);
      }).toThrow('Discount rate must be between 0 and 1');
    });

    it('should handle 0% discount', () => {
      const result = cartService.calculateDiscount(100, 0);
      expect(result).toBe(0);
    });

    it('should handle 100% discount', () => {
      const result = cartService.calculateDiscount(100, 1);
      expect(result).toBe(100);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total without discount or tax', () => {
      const cart: Cart = {
        items: [
          { id: '1', name: 'Item 1', price: 100, quantity: 2 }
        ]
      };

      const result = cartService.calculateTotal(cart);

      expect(result).toBe(200);
    });

    it('should calculate total with discount', () => {
      const cart: Cart = {
        items: [
          { id: '1', name: 'Item 1', price: 100, quantity: 2 }
        ],
        discount: 0.1 // 10% discount
      };

      const result = cartService.calculateTotal(cart);

      expect(result).toBe(180); // 200 - 20
    });

    it('should calculate total with tax', () => {
      const cart: Cart = {
        items: [
          { id: '1', name: 'Item 1', price: 100, quantity: 2 }
        ],
        taxRate: 0.2 // 20% tax
      };

      const result = cartService.calculateTotal(cart);

      expect(result).toBe(240); // 200 + 40
    });

    it('should calculate total with both discount and tax', () => {
      const cart: Cart = {
        items: [
          { id: '1', name: 'Item 1', price: 100, quantity: 2 }
        ],
        discount: 0.1,  // 10% discount
        taxRate: 0.2    // 20% tax
      };

      const result = cartService.calculateTotal(cart);

      // Subtotal: 200
      // After discount: 200 - 20 = 180
      // After tax: 180 + 36 = 216
      expect(result).toBe(216);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty cart', () => {
      const cart: Cart = { items: [] };
      expect(cartService.isEmpty(cart)).toBe(true);
    });

    it('should return false for cart with items', () => {
      const cart: Cart = {
        items: [{ id: '1', name: 'Item', price: 10, quantity: 1 }]
      };
      expect(cartService.isEmpty(cart)).toBe(false);
    });
  });

  describe('getItemCount', () => {
    it('should return total quantity of all items', () => {
      const cart: Cart = {
        items: [
          { id: '1', name: 'Item 1', price: 10, quantity: 2 },
          { id: '2', name: 'Item 2', price: 20, quantity: 3 }
        ]
      };

      const result = cartService.getItemCount(cart);

      expect(result).toBe(5); // 2 + 3
    });

    it('should return 0 for empty cart', () => {
      const cart: Cart = { items: [] };
      expect(cartService.getItemCount(cart)).toBe(0);
    });
  });
});
```

### Example 2: Integration Testing with Supertest

```typescript
// ============================================
// API Integration Tests
// ============================================

import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import { connectDB, closeDB, clearDB } from './test-db';

describe('User API Integration Tests', () => {
  // Setup - connect to test database
  beforeAll(async () => {
    await connectDB();
  });

  // Cleanup - clear database after each test
  afterEach(async () => {
    await clearDB();
  });

  // Teardown - close database connection
  afterAll(async () => {
    await closeDB();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123'
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        data: {
          name: userData.name,
          email: userData.email
        }
      });
      expect(response.body.data.password).toBeUndefined();
      expect(response.body.data.id).toBeDefined();

      // Verify user was saved to database
      const user = await User.findById(response.body.data.id);
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should return 422 for invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(422);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('Invalid email')
        })
      );
    });

    it('should return 409 for duplicate email', async () => {
      // Create first user
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password'
      });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Jane Doe',
          email: 'john@example.com', // Duplicate email
          password: 'SecurePass123'
        })
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'PlainTextPassword'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Verify password is hashed
      const user = await User.findById(response.body.data.id);
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Create user
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed-password'
      });

      // Fetch user
      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: user._id.toString(),
        name: user.name,
        email: user.email
      });
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      // Create multiple users
      await User.create([
        { name: 'User 1', email: 'user1@example.com', password: 'pass' },
        { name: 'User 2', email: 'user2@example.com', password: 'pass' },
        { name: 'User 3', email: 'user3@example.com', password: 'pass' }
      ]);

      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2
      });
    });

    it('should filter users by role', async () => {
      await User.create([
        { name: 'Admin', email: 'admin@example.com', password: 'pass', role: 'admin' },
        { name: 'User', email: 'user@example.com', password: 'pass', role: 'user' }
      ]);

      const response = await request(app)
        .get('/api/users')
        .query({ role: 'admin' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe('admin');
    });

    it('should search users by name', async () => {
      await User.create([
        { name: 'John Doe', email: 'john@example.com', password: 'pass' },
        { name: 'Jane Smith', email: 'jane@example.com', password: 'pass' }
      ]);

      const response = await request(app)
        .get('/api/users')
        .query({ search: 'john' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('John Doe');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user name', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'pass'
      });

      const response = await request(app)
        .patch(`/api/users/${user._id}`)
        .send({ name: 'John Updated' })
        .expect(200);

      expect(response.body.data.name).toBe('John Updated');

      // Verify in database
      const updated = await User.findById(user._id);
      expect(updated.name).toBe('John Updated');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'pass'
      });

      await request(app)
        .delete(`/api/users/${user._id}`)
        .expect(204);

      // Verify user is deleted
      const deleted = await User.findById(user._id);
      expect(deleted).toBeNull();
    });
  });
});

// ============================================
// Test Database Helper
// ============================================

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export async function connectDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function closeDB() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
```

### Example 3: E2E Testing with Playwright

```typescript
// ============================================
// E2E Tests with Playwright
// ============================================

import { test, expect } from '@playwright/test';

test.describe('User Registration and Login Flow', () => {
  test('should complete full registration and login flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:3000/register');

    // Fill registration form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', 'SecurePass123');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('.success-message')).toContainText(
      'Registration successful'
    );

    // Should redirect to login page
    await expect(page).toHaveURL('http://localhost:3000/login');

    // Login with new credentials
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', 'SecurePass123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard');

    // Verify user is logged in
    await expect(page.locator('.user-name')).toContainText('John Doe');
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    // Submit without filling form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('.error-message')).toContainText('Name is required');
    await expect(page.locator('.error-message')).toContainText('Email is required');
  });

  test('should prevent registration with existing email', async ({ page }) => {
    // First registration
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', 'Pass123');
    await page.fill('input[name="confirmPassword"]', 'Pass123');
    await page.click('button[type="submit"]');

    // Second registration with same email
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="name"]', 'Jane Doe');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', 'Pass123');
    await page.fill('input[name="confirmPassword"]', 'Pass123');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.error-message')).toContainText(
      'Email already exists'
    );
  });
});

test.describe('Shopping Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });

  test('should add item to cart and complete checkout', async ({ page }) => {
    // Browse products
    await page.goto('http://localhost:3000/products');

    // Add first product to cart
    await page.click('.product-card:first-child button.add-to-cart');

    // Verify cart badge updates
    await expect(page.locator('.cart-badge')).toContainText('1');

    // Go to cart
    await page.click('.cart-icon');
    await expect(page).toHaveURL('http://localhost:3000/cart');

    // Verify item is in cart
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // Proceed to checkout
    await page.click('button.checkout');

    // Fill shipping information
    await page.fill('input[name="address"]', '123 Main St');
    await page.fill('input[name="city"]', 'New York');
    await page.fill('input[name="zipCode"]', '10001');

    // Complete purchase
    await page.click('button.complete-purchase');

    // Verify success
    await expect(page.locator('.success-message')).toContainText(
      'Order placed successfully'
    );
  });
});
```

### Example 4: Mocking with Jest

```typescript
// ============================================
// Testing with Mocks
// ============================================

import { UserService } from './user.service';
import { EmailService } from './email.service';
import { User } from './models/User';

// Mock external dependencies
jest.mock('./email.service');
jest.mock('./models/User');

describe('UserService with Mocks', () => {
  let userService: UserService;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocked email service
    mockEmailService = {
      sendWelcomeEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn()
    } as any;

    userService = new UserService(mockEmailService);
  });

  describe('createUser', () => {
    it('should create user and send welcome email', async () => {
      // Arrange - Mock User.create
      const mockUser = {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      (User.create as jest.Mock).mockResolvedValue(mockUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);

      // Act
      const result = await userService.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'pass123'
      });

      // Assert
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com'
        })
      );

      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'john@example.com',
        'John Doe'
      );

      expect(result).toEqual(mockUser);
    });

    it('should rollback user creation if email fails', async () => {
      // Arrange
      const mockUser = {
        _id: '123',
        delete: jest.fn()
      };

      (User.create as jest.Mock).mockResolvedValue(mockUser);
      mockEmailService.sendWelcomeEmail.mockRejectedValue(
        new Error('Email service down')
      );

      // Act & Assert
      await expect(
        userService.createUser({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'pass123'
        })
      ).rejects.toThrow('Failed to send welcome email');

      // Verify user was deleted (rollback)
      expect(mockUser.delete).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user from database', async () => {
      // Arrange
      const mockUser = {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById('123');

      // Assert
      expect(User.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (User.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        userService.getUserById('999')
      ).rejects.toThrow('User not found');
    });
  });
});

// ============================================
// Spy Example
// ============================================

describe('CartService with Spies', () => {
  it('should call calculateTotal when getting cart summary', () => {
    const cartService = new CartService();

    // Create spy on calculateTotal method
    const calculateTotalSpy = jest.spyOn(cartService, 'calculateTotal');

    const cart = {
      items: [
        { id: '1', name: 'Item', price: 100, quantity: 2 }
      ]
    };

    // Act
    cartService.getCartSummary(cart);

    // Assert that calculateTotal was called
    expect(calculateTotalSpy).toHaveBeenCalledWith(cart);
    expect(calculateTotalSpy).toHaveBeenCalledTimes(1);

    // Restore original implementation
    calculateTotalSpy.mockRestore();
  });
});
```

## Common Patterns

### Pattern 1: Test Data Builders

```typescript
class UserBuilder {
  private user: Partial<User> = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    isActive: true
  };

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withRole(role: string): this {
    this.user.role = role;
    return this;
  }

  asAdmin(): this {
    this.user.role = 'admin';
    return this;
  }

  inactive(): this {
    this.user.isActive = false;
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

// Usage
const adminUser = new UserBuilder()
  .withName('Admin User')
  .asAdmin()
  .build();

const inactiveUser = new UserBuilder()
  .withEmail('inactive@example.com')
  .inactive()
  .build();
```

### Pattern 2: Parameterized Tests

```typescript
describe.each([
  [100, 2, 200],
  [50, 3, 150],
  [9.99, 4, 39.96],
  [0, 10, 0]
])('calculateItemTotal(%i, %i)', (price, quantity, expected) => {
  it(`should return ${expected}`, () => {
    const item = { id: '1', name: 'Item', price, quantity };
    const result = cartService.calculateItemTotal(item);
    expect(result).toBeCloseTo(expected, 2);
  });
});
```

### Pattern 3: Snapshot Testing

```typescript
test('renders user profile correctly', () => {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg'
  };

  const component = render(<UserProfile user={user} />);

  // Save snapshot
  expect(component).toMatchSnapshot();
});
```

## Best Practices

### DO ✅

- **Write tests first (TDD)** when possible
  ```typescript
  // 1. Write failing test
  test('should calculate discount', () => {
    expect(calculateDiscount(100, 0.1)).toBe(10);
  });

  // 2. Write minimal code to pass
  // 3. Refactor
  ```

- **Test behavior, not implementation**
  ```typescript
  // ✅ Good - Tests behavior
  test('should create user and return user data', async () => {
    const user = await userService.createUser(data);
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email', data.email);
  });

  // ❌ Bad - Tests implementation details
  test('should call database.insert', async () => {
    await userService.createUser(data);
    expect(database.insert).toHaveBeenCalled();
  });
  ```

- **Use descriptive test names**
  ```typescript
  // ✅ Good
  test('should return 404 when user does not exist')

  // ❌ Bad
  test('test1')
  test('getUserById')
  ```

- **Keep tests independent**
  ```typescript
  // Each test should work in isolation
  // Don't rely on other tests running first
  ```

- **Test edge cases**
  ```typescript
  test('should handle empty string');
  test('should handle null value');
  test('should handle negative numbers');
  test('should handle maximum integer');
  ```

- **Use setup and teardown**
  ```typescript
  beforeEach(() => {
    // Setup test data
  });

  afterEach(() => {
    // Cleanup
  });
  ```

### DON'T ❌

- **Don't test external libraries**
  ```typescript
  // ❌ Don't test that lodash works
  test('lodash sum works', () => {
    expect(_.sum([1, 2, 3])).toBe(6);
  });
  ```

- **Don't write flaky tests**
  ```typescript
  // ❌ Bad - Time-dependent, may fail randomly
  test('should process within 100ms', async () => {
    const start = Date.now();
    await process();
    expect(Date.now() - start).toBeLessThan(100);
  });
  ```

- **Don't test multiple things in one test**
  ```typescript
  // ❌ Bad - Testing too much
  test('user operations', () => {
    const user = createUser();
    expect(user).toBeDefined();

    const updated = updateUser(user);
    expect(updated.name).toBe('New Name');

    deleteUser(user);
    expect(getUser(user.id)).toBeNull();
  });
  ```

- **Don't ignore failing tests**
  ```typescript
  // ❌ Don't skip tests
  test.skip('broken test', () => { ... });

  // Fix or remove them!
  ```

## Troubleshooting

### Issue 1: Slow Tests

**Problem:** Test suite takes too long to run.

**Solution:**
```typescript
// 1. Run tests in parallel
// package.json
{
  "scripts": {
    "test": "jest --maxWorkers=4"
  }
}

// 2. Use test.only during development
test.only('specific test', () => { ... });

// 3. Mock external services
// 4. Use in-memory database for integration tests
// 5. Run E2E tests only in CI
```

### Issue 2: Flaky Tests

**Problem:** Tests pass sometimes, fail other times.

**Solution:**
```typescript
// 1. Avoid time-dependent tests
// ❌ Bad
expect(Date.now()).toBe(expectedTime);

// ✅ Good
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-11-06'));

// 2. Wait for async operations
await waitFor(() => {
  expect(element).toBeInTheDocument();
});

// 3. Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

### Issue 3: Hard to Test Code

**Problem:** Code is difficult to unit test.

**Solution:**
```typescript
// Use dependency injection

// ❌ Hard to test
class UserService {
  async createUser(data) {
    const db = new Database(); // Hard-coded dependency
    return await db.save(data);
  }
}

// ✅ Easy to test
class UserService {
  constructor(private db: Database) {}

  async createUser(data) {
    return await this.db.save(data);
  }
}

// In tests, inject mock
const mockDb = { save: jest.fn() };
const service = new UserService(mockDb);
```

### Issue 4: Low Test Coverage

**Problem:** Coverage reports show low percentages.

**Solution:**
```bash
# 1. Generate coverage report
npm test -- --coverage

# 2. View detailed report
open coverage/lcov-report/index.html

# 3. Focus on untested files first
# 4. Add tests for critical paths
# 5. Set coverage thresholds

# jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

**Token Count: ~3,456 tokens**

This skill provides comprehensive testing strategies for writing effective tests across all levels of the testing pyramid.
