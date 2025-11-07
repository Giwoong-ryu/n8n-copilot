# Error Handling Strategies

## Purpose

Comprehensive error handling strategies for building robust production systems, covering error types, exception handling patterns, logging strategies, and user-friendly error responses across different programming paradigms.

## When to Use

- **Production applications** - Building reliable systems with proper error handling
- **API development** - Handling and communicating errors to API consumers
- **Debugging and monitoring** - Setting up effective error tracking and logging
- **User experience** - Providing helpful error messages without exposing internals
- **System resilience** - Implementing retry logic and graceful degradation
- **Microservices** - Handling distributed system failures
- **Error recovery** - Implementing automatic recovery mechanisms
- **Security** - Preventing information leakage through error messages

## Core Concepts

### 1. Error Categories

| Category | Description | Example | Action |
|----------|-------------|---------|--------|
| **Operational Errors** | Expected errors during normal operation | Network timeout, DB connection failed | Handle gracefully, retry if possible |
| **Programmer Errors** | Bugs in the code | TypeError, null reference | Fix the code, don't catch |
| **Validation Errors** | Invalid user input | Invalid email format | Return 400/422 with details |
| **Authentication Errors** | Auth failures | Invalid credentials, expired token | Return 401 |
| **Authorization Errors** | Permission denied | User lacks access rights | Return 403 |
| **Not Found Errors** | Resource doesn't exist | User ID not found | Return 404 |
| **Conflict Errors** | Resource state conflict | Duplicate email | Return 409 |
| **Rate Limit Errors** | Too many requests | API rate limit exceeded | Return 429 |

### 2. Error Handling Hierarchy

```
┌─────────────────────────────────────┐
│   Application-Wide Error Handler    │  ← Catch-all for uncaught errors
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│    Route/Controller Error Handler   │  ← Handle route-specific errors
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│    Service Layer Error Handler      │  ← Business logic errors
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│    Data Layer Error Handler         │  ← Database/external API errors
└─────────────────────────────────────┘
```

### 3. Error Response Format

**Standardized Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "statusCode": 422,
    "timestamp": "2024-11-06T10:00:00Z",
    "path": "/api/v1/users",
    "requestId": "req-abc123",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ]
  }
}
```

### 4. Logging Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| **ERROR** | System errors requiring attention | Database connection failed |
| **WARN** | Potential issues, degraded state | API rate limit approaching |
| **INFO** | Important business events | User registered, Payment processed |
| **DEBUG** | Detailed debugging information | Function entry/exit, variable values |
| **TRACE** | Very detailed debugging | Loop iterations, detailed flow |

### 5. Error Handling Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Fail Fast** | Fail immediately on error | Validation, startup configuration |
| **Fail Safe** | Continue with default/degraded service | Non-critical features, cache failures |
| **Retry** | Attempt operation again | Transient network errors |
| **Circuit Breaker** | Stop trying after repeated failures | External service down |
| **Fallback** | Use alternative method/data | Primary service unavailable |
| **Timeout** | Give up after time limit | Slow external APIs |

## Examples

### Example 1: Node.js/Express Error Handling

```typescript
// ============================================
// Custom Error Classes
// ============================================

class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(422, 'VALIDATION_ERROR', message, true, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`, true);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message, true);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(403, 'FORBIDDEN', message, true);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message, true);
  }
}

class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message, false);
  }
}

// ============================================
// Service Layer with Error Handling
// ============================================

class UserService {
  async createUser(data: CreateUserDto): Promise<User> {
    // Validation
    const errors = [];
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        value: data.email
      });
    }
    if (!data.password || data.password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters'
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid user data', errors);
    }

    try {
      // Check for existing user
      const existing = await User.findOne({ email: data.email });
      if (existing) {
        throw new ConflictError('User with this email already exists');
      }

      // Create user
      const user = new User({
        email: data.email,
        password: await this.hashPassword(data.password),
        name: data.name
      });

      await user.save();
      return user;
    } catch (error) {
      // Handle database errors
      if (error instanceof AppError) {
        throw error; // Re-throw application errors
      }

      // Log unexpected errors
      logger.error('Failed to create user', {
        error: error.message,
        stack: error.stack,
        data
      });

      throw new InternalError('Failed to create user');
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const user = await User.findById(id);

      if (!user) {
        throw new NotFoundError('User');
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to fetch user', {
        error: error.message,
        userId: id
      });

      throw new InternalError('Failed to fetch user');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}

// ============================================
// Controller with Error Handling
// ============================================

class UserController {
  constructor(private userService: UserService) {}

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.createUser(req.body);

      res.status(201).json({
        data: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      next(error); // Pass to error handler middleware
    }
  };

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUserById(req.params.id);

      res.json({
        data: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

// ============================================
// Global Error Handler Middleware
// ============================================

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.id // Assuming request ID middleware
    }
  };

  // Handle operational errors (AppError instances)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.error = {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.id,
      ...(err.details && { details: err.details })
    };

    // Log operational errors (but not as ERROR level unless critical)
    if (err.statusCode >= 500) {
      logger.error('Operational error', {
        error: err.message,
        code: err.code,
        path: req.path,
        requestId: req.id
      });
    } else {
      logger.warn('Client error', {
        error: err.message,
        code: err.code,
        path: req.path,
        requestId: req.id
      });
    }
  } else {
    // Unexpected errors (programmer errors)
    logger.error('Unexpected error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      requestId: req.id
    });

    // Don't expose error details in production
    if (process.env.NODE_ENV === 'production') {
      errorResponse.error.message = 'An unexpected error occurred';
    } else {
      // In development, include more details
      errorResponse.error.message = err.message;
      errorResponse.error['stack'] = err.stack;
    }
  }

  res.status(statusCode).json(errorResponse);
};

// ============================================
// Async Error Wrapper
// ============================================

// Wrapper to avoid try-catch in every route
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ data: user });
}));

// ============================================
// Unhandled Rejection Handler
// ============================================

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });

  // Graceful shutdown
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });

  // Graceful shutdown
  process.exit(1);
});
```

### Example 2: Python Error Handling

```python
# ============================================
# Custom Exception Classes
# ============================================

class AppError(Exception):
    """Base application error"""
    def __init__(self, message, code, status_code, details=None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details

class ValidationError(AppError):
    """Validation error"""
    def __init__(self, message, details=None):
        super().__init__(message, 'VALIDATION_ERROR', 422, details)

class NotFoundError(AppError):
    """Resource not found error"""
    def __init__(self, resource):
        super().__init__(
            f'{resource} not found',
            'NOT_FOUND',
            404
        )

class UnauthorizedError(AppError):
    """Authentication error"""
    def __init__(self, message='Authentication required'):
        super().__init__(message, 'UNAUTHORIZED', 401)

class ConflictError(AppError):
    """Conflict error"""
    def __init__(self, message):
        super().__init__(message, 'CONFLICT', 409)

# ============================================
# Service Layer with Error Handling
# ============================================

import logging
from typing import Optional
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, db):
        self.db = db

    def create_user(self, email: str, password: str, name: str) -> dict:
        """Create a new user with error handling"""
        # Validation
        errors = []
        if not email or not self._is_valid_email(email):
            errors.append({
                'field': 'email',
                'message': 'Invalid email format',
                'value': email
            })

        if not password or len(password) < 8:
            errors.append({
                'field': 'password',
                'message': 'Password must be at least 8 characters'
            })

        if errors:
            raise ValidationError('Invalid user data', details=errors)

        try:
            # Check for existing user
            existing = self.db.users.find_one({'email': email})
            if existing:
                raise ConflictError('User with this email already exists')

            # Create user
            user = {
                'email': email,
                'password': self._hash_password(password),
                'name': name
            }

            result = self.db.users.insert_one(user)
            user['_id'] = result.inserted_id

            logger.info(f'User created successfully: {email}')
            return user

        except AppError:
            raise  # Re-raise application errors

        except Exception as e:
            logger.error(f'Failed to create user: {str(e)}', exc_info=True)
            raise AppError(
                'Failed to create user',
                'INTERNAL_ERROR',
                500
            )

    def get_user_by_id(self, user_id: str) -> dict:
        """Get user by ID with error handling"""
        try:
            user = self.db.users.find_one({'_id': user_id})

            if not user:
                raise NotFoundError('User')

            return user

        except AppError:
            raise

        except Exception as e:
            logger.error(f'Failed to fetch user: {str(e)}', exc_info=True)
            raise AppError(
                'Failed to fetch user',
                'INTERNAL_ERROR',
                500
            )

    @staticmethod
    def _is_valid_email(email: str) -> bool:
        import re
        pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        return re.match(pattern, email) is not None

    @staticmethod
    def _hash_password(password: str) -> str:
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

# ============================================
# Flask Error Handlers
# ============================================

from flask import Flask, jsonify, request
import datetime

app = Flask(__name__)

@app.errorhandler(AppError)
def handle_app_error(error):
    """Handle application errors"""
    response = {
        'error': {
            'code': error.code,
            'message': error.message,
            'statusCode': error.status_code,
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'path': request.path
        }
    }

    if error.details:
        response['error']['details'] = error.details

    # Log based on severity
    if error.status_code >= 500:
        logger.error(f'Application error: {error.message}', exc_info=True)
    else:
        logger.warning(f'Client error: {error.message}')

    return jsonify(response), error.status_code

@app.errorhandler(Exception)
def handle_unexpected_error(error):
    """Handle unexpected errors"""
    logger.error(f'Unexpected error: {str(error)}', exc_info=True)

    response = {
        'error': {
            'code': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred',
            'statusCode': 500,
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'path': request.path
        }
    }

    # Include details in development
    if app.config.get('DEBUG'):
        response['error']['details'] = str(error)

    return jsonify(response), 500

@app.errorhandler(404)
def handle_not_found(error):
    """Handle 404 errors"""
    response = {
        'error': {
            'code': 'NOT_FOUND',
            'message': 'Endpoint not found',
            'statusCode': 404,
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'path': request.path
        }
    }
    return jsonify(response), 404

# ============================================
# Context Manager for Error Handling
# ============================================

@contextmanager
def handle_database_errors():
    """Context manager for database operations"""
    try:
        yield
    except ConnectionError:
        logger.error('Database connection error', exc_info=True)
        raise AppError(
            'Database unavailable',
            'DATABASE_ERROR',
            503
        )
    except TimeoutError:
        logger.error('Database timeout', exc_info=True)
        raise AppError(
            'Database operation timeout',
            'TIMEOUT_ERROR',
            504
        )
    except Exception as e:
        logger.error(f'Database error: {str(e)}', exc_info=True)
        raise AppError(
            'Database operation failed',
            'DATABASE_ERROR',
            500
        )

# Usage
def get_user_with_context(user_id):
    with handle_database_errors():
        return db.users.find_one({'_id': user_id})

# ============================================
# Retry Decorator
# ============================================

import time
from functools import wraps

def retry(max_attempts=3, delay=1, backoff=2, exceptions=(Exception,)):
    """Retry decorator with exponential backoff"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempt = 0
            current_delay = delay

            while attempt < max_attempts:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    attempt += 1
                    if attempt >= max_attempts:
                        logger.error(
                            f'Max retry attempts reached for {func.__name__}',
                            exc_info=True
                        )
                        raise

                    logger.warning(
                        f'Attempt {attempt} failed for {func.__name__}, '
                        f'retrying in {current_delay}s: {str(e)}'
                    )

                    time.sleep(current_delay)
                    current_delay *= backoff

        return wrapper
    return decorator

# Usage
@retry(max_attempts=3, delay=1, backoff=2, exceptions=(ConnectionError,))
def fetch_external_api():
    response = requests.get('https://api.example.com/data')
    response.raise_for_status()
    return response.json()
```

### Example 3: TypeScript with Result Type Pattern

```typescript
// ============================================
// Result Type for Functional Error Handling
// ============================================

type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

class UserServiceWithResult {
  async createUser(data: CreateUserDto): Promise<Result<User, string>> {
    // Validation
    const validationResult = this.validateUserData(data);
    if (!validationResult.ok) {
      return validationResult;
    }

    try {
      // Check for existing user
      const existing = await User.findOne({ email: data.email });
      if (existing) {
        return {
          ok: false,
          error: 'User with this email already exists'
        };
      }

      // Create user
      const user = new User({
        email: data.email,
        password: await this.hashPassword(data.password),
        name: data.name
      });

      await user.save();

      return {
        ok: true,
        value: user
      };
    } catch (error) {
      logger.error('Failed to create user', { error });
      return {
        ok: false,
        error: 'Failed to create user'
      };
    }
  }

  private validateUserData(data: CreateUserDto): Result<void, string> {
    if (!data.email || !this.isValidEmail(data.email)) {
      return { ok: false, error: 'Invalid email format' };
    }

    if (!data.password || data.password.length < 8) {
      return { ok: false, error: 'Password must be at least 8 characters' };
    }

    return { ok: true, value: undefined };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}

// Usage
const result = await userService.createUser(userData);

if (result.ok) {
  console.log('User created:', result.value);
} else {
  console.error('Failed to create user:', result.error);
}
```

### Example 4: Circuit Breaker Pattern

```typescript
// ============================================
// Circuit Breaker Implementation
// ============================================

enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;

  constructor(
    private threshold: number = 5,          // Failures before opening
    private timeout: number = 60000,        // Time before attempting retry (ms)
    private halfOpenSuccesses: number = 2   // Successes needed to close
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();

      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.halfOpenSuccesses) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        logger.info('Circuit breaker closed');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      logger.warn('Circuit breaker opened from HALF_OPEN');
    } else if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      logger.warn('Circuit breaker opened from CLOSED');
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Usage
const apiCircuitBreaker = new CircuitBreaker(5, 60000, 2);

async function callExternalApi() {
  try {
    const result = await apiCircuitBreaker.execute(async () => {
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    });

    return result;
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      logger.warn('Circuit breaker is open, using fallback');
      return getFallbackData();
    }

    throw error;
  }
}
```

## Common Patterns

### Pattern 1: Centralized Error Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write error logs to file
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: 'combined.log'
    })
  ]
});

// Add to external service (e.g., Sentry)
if (process.env.NODE_ENV === 'production') {
  // Sentry integration
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN });

  logger.on('data', (info) => {
    if (info.level === 'error') {
      Sentry.captureException(info.error);
    }
  });
}
```

### Pattern 2: Graceful Degradation

```typescript
async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    // Try to get full profile with recommendations
    const [user, recommendations, preferences] = await Promise.all([
      fetchUser(userId),
      fetchRecommendations(userId),
      fetchPreferences(userId)
    ]);

    return {
      user,
      recommendations,
      preferences
    };
  } catch (error) {
    logger.warn('Failed to fetch complete profile, using partial data', { error });

    try {
      // Fallback: Get just user data
      const user = await fetchUser(userId);

      return {
        user,
        recommendations: [],  // Empty recommendations
        preferences: getDefaultPreferences()  // Default preferences
      };
    } catch (fallbackError) {
      logger.error('Failed to fetch even basic user data', { fallbackError });
      throw new NotFoundError('User');
    }
  }
}
```

### Pattern 3: Error Aggregation for Bulk Operations

```typescript
async function bulkCreateUsers(users: CreateUserDto[]): Promise<BulkResult> {
  const results = {
    successful: [],
    failed: []
  };

  // Process all users, collecting errors instead of failing fast
  await Promise.allSettled(
    users.map(async (userData, index) => {
      try {
        const user = await userService.createUser(userData);
        results.successful.push({
          index,
          data: user
        });
      } catch (error) {
        results.failed.push({
          index,
          data: userData,
          error: error instanceof AppError
            ? { code: error.code, message: error.message }
            : { code: 'UNKNOWN_ERROR', message: 'Failed to create user' }
        });
      }
    })
  );

  return {
    total: users.length,
    successful: results.successful.length,
    failed: results.failed.length,
    results: results
  };
}
```

## Best Practices

### DO ✅

- **Use specific error types for different scenarios**
  ```typescript
  throw new ValidationError('Invalid email');
  throw new NotFoundError('User');
  throw new UnauthorizedError('Token expired');
  ```

- **Log errors with context**
  ```typescript
  logger.error('Failed to create user', {
    email: userData.email,
    error: error.message,
    stack: error.stack,
    requestId: req.id
  });
  ```

- **Sanitize error messages for users**
  ```typescript
  // ✅ User-friendly
  return { error: 'Invalid email format' };

  // ❌ Exposes internals
  return { error: 'MongoError: duplicate key error collection: users.$email_1' };
  ```

- **Implement retry logic for transient errors**
  ```typescript
  @retry(3, 1000)
  async function fetchFromAPI() {
    // Will retry 3 times with 1s delay
  }
  ```

- **Use circuit breakers for external services**
  ```typescript
  await circuitBreaker.execute(() => callExternalAPI());
  ```

- **Handle uncaught exceptions gracefully**
  ```typescript
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error });
    gracefulShutdown();
  });
  ```

### DON'T ❌

- **Don't swallow errors silently**
  ```typescript
  // ❌ BAD
  try {
    await operation();
  } catch (error) {
    // Silent failure
  }

  // ✅ GOOD
  try {
    await operation();
  } catch (error) {
    logger.error('Operation failed', { error });
    throw error; // Or handle appropriately
  }
  ```

- **Don't expose sensitive information in errors**
  ```typescript
  // ❌ BAD
  throw new Error(`Database connection failed: ${dbPassword}`);

  // ✅ GOOD
  throw new Error('Database connection failed');
  ```

- **Don't use errors for control flow**
  ```typescript
  // ❌ BAD
  try {
    const user = await findUser(id);
  } catch (error) {
    // Using not found exception for control flow
    return createNewUser();
  }

  // ✅ GOOD
  const user = await findUser(id);
  if (!user) {
    return createNewUser();
  }
  ```

- **Don't catch errors you can't handle**
  ```typescript
  // ❌ BAD
  try {
    await operation();
  } catch (error) {
    // What now? Can't handle this...
    throw error; // Pointless catch
  }
  ```

- **Don't return different error formats**
  ```typescript
  // ❌ BAD - Inconsistent formats
  return { error: 'Failed' };
  return { message: 'Failed' };
  return { err: 'Failed' };

  // ✅ GOOD - Consistent format
  return { error: { code: 'ERROR', message: 'Failed' } };
  ```

## Troubleshooting

### Issue 1: Unhandled Promise Rejections

**Problem:** Promises rejecting without .catch() handlers.

**Solution:**
```typescript
// Global handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  // Graceful shutdown
  gracefulShutdown();
});

// Use async/await with try-catch
async function handler() {
  try {
    await operation();
  } catch (error) {
    logger.error('Operation failed', { error });
  }
}

// Or use .catch()
operation().catch(error => {
  logger.error('Operation failed', { error });
});
```

### Issue 2: Memory Leaks from Error Stacks

**Problem:** Storing full error stacks causing memory issues.

**Solution:**
```typescript
// Limit stack trace depth
Error.stackTraceLimit = 10;

// Remove stack in production
if (process.env.NODE_ENV === 'production') {
  delete error.stack;
}

// Store only essential info
logger.error('Error occurred', {
  message: error.message,
  code: error.code,
  // Don't store full stack in DB
});
```

### Issue 3: Error Handling in Async Middleware

**Problem:** Express doesn't catch async errors automatically.

**Solution:**
```typescript
// Async wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Use it
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({ user });
}));

// Or use express-async-errors package
require('express-async-errors');
```

### Issue 4: Debugging Production Errors

**Problem:** Can't reproduce error in development.

**Solution:**
```typescript
// Add request ID for tracing
app.use((req, res, next) => {
  req.id = uuid();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Log with request ID
logger.error('Error occurred', {
  requestId: req.id,
  userId: req.user?.id,
  path: req.path,
  method: req.method,
  error: error.message
});

// Use error tracking service
Sentry.captureException(error, {
  extra: {
    requestId: req.id,
    userId: req.user?.id
  }
});
```

---

**Token Count: ~3,891 tokens**

This skill provides comprehensive error handling strategies for building robust production systems with proper error management, logging, and recovery mechanisms.
