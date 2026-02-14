# Security Best Practices - Épargne Finance Tracker

## Current Security Posture

This document outlines the current security implementations and recommendations for the Épargne Personal Finance Tracker application.

---

## ✅ Implemented Security Measures

### 1. XSS Protection
**Location:** `src/pages/Login.tsx`

Error messages from the API are sanitized before display to prevent Cross-Site Scripting (XSS) attacks.

```typescript
const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Usage in error handling
catch (err: any) {
    const errorMessage = err?.message || 'An unexpected error occurred';
    setError(escapeHtml(errorMessage));
}
```

### 2. JWT Token Authentication
**Location:** Backend API, `src/lib/api.ts`

- Tokens passed via `Authorization: Bearer <token>` header (not in URL)
- Token stored securely in a single location (AuthContext)
- Token removed on logout

### 3. Data Validation
**Location:** `src/contexts/AuthContext.tsx`

JSON parsing from localStorage is wrapped in try-catch to prevent crashes from corrupted data:

```typescript
try {
    const parsedUser = JSON.parse(storedUser);
    setToken(storedToken);
    setUser(parsedUser);
} catch (error) {
    console.error('Failed to parse stored user data:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}
```

### 4. TypeScript Type Safety
**Location:** All components

Strong typing prevents many runtime errors and improves code reliability:
- Interface definitions for User, Transaction, MasterItem
- Proper type checking for API responses
- No implicit `any` types (explicitly defined where needed)

---

## ⚠️ Known Security Considerations

### 1. localStorage Token Storage

**Current Implementation:**
```typescript
localStorage.setItem('token', newToken);
localStorage.setItem('user', JSON.stringify(newUser));
```

**Risk Level:** 🟡 MEDIUM (Acceptable for MVP/Local-First App)

**Vulnerabilities:**
- Susceptible to XSS attacks if malicious script executes
- Tokens accessible via browser DevTools
- No automatic expiration

**Why It's Currently Acceptable:**
- This is a personal finance tracker, often used as a local-first application
- User controls their own environment
- Suitable for MVP/prototype stage

**Production Recommendations:**

#### Option 1: httpOnly Cookies (Recommended)
```typescript
// Backend: Set cookie
res.cookie('token', token, {
    httpOnly: true,      // Not accessible via JavaScript
    secure: true,        // Only sent over HTTPS
    sameSite: 'strict',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});

// Frontend: No token storage needed, cookies sent automatically
```

#### Option 2: Enhanced localStorage (Alternative)
```typescript
// 1. Add token expiration
interface TokenData {
    token: string;
    expiresAt: number;
}

const saveToken = (token: string, expiresIn: number) => {
    const data: TokenData = {
        token,
        expiresAt: Date.now() + (expiresIn * 1000)
    };
    localStorage.setItem('authData', JSON.stringify(data));
};

// 2. Validate on load
const loadToken = (): string | null => {
    const stored = localStorage.getItem('authData');
    if (!stored) return null;
    
    const data: TokenData = JSON.parse(stored);
    if (Date.now() > data.expiresAt) {
        localStorage.removeItem('authData');
        return null;
    }
    return data.token;
};

// 3. Consider encryption (for sensitive user data only, not tokens)
import CryptoJS from 'crypto-js';

const encryptData = (data: string, key: string): string => {
    return CryptoJS.AES.encrypt(data, key).toString();
};

const decryptData = (ciphertext: string, key: string): string => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};
```

### 2. Missing Token Refresh Mechanism

**Current Implementation:**
- Token never expires on the frontend
- No automatic token refresh

**Risk Level:** 🟡 MEDIUM

**Recommendation:**
```typescript
// Implement token refresh
const refreshToken = async () => {
    try {
        const response = await apiRequest<{ token: string }>('/auth/refresh', {
            method: 'POST',
            token: currentToken
        });
        return response.token;
    } catch (error) {
        // Token invalid, logout user
        logout();
        throw error;
    }
};

// Check token expiration before API calls
const apiRequestWithRefresh = async <T>(endpoint: string, options: RequestOptions): Promise<T> => {
    try {
        return await apiRequest<T>(endpoint, options);
    } catch (error: any) {
        if (error.status === 401) {
            // Try to refresh token
            const newToken = await refreshToken();
            // Retry with new token
            return await apiRequest<T>(endpoint, { ...options, token: newToken });
        }
        throw error;
    }
};
```

### 3. No CSRF Protection (If Using Cookies)

**Current State:** Not applicable (using Bearer tokens)

**If Migrating to Cookies:**
Implement CSRF tokens:

```typescript
// Backend: Generate CSRF token
const csrfToken = crypto.randomBytes(32).toString('hex');
res.cookie('csrf-token', csrfToken, { sameSite: 'strict' });

// Frontend: Include in requests
const headers = {
    'X-CSRF-Token': getCookie('csrf-token')
};
```

### 4. Input Validation

**Current State:** Basic HTML sanitization on error messages

**Recommendations:**

#### Frontend Validation
```typescript
import { z } from 'zod';

// Already available in the project!
const transactionSchema = z.object({
    amount: z.number().positive().max(1000000),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1).max(50),
    description: z.string().max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Use in form submission
const handleSubmit = async (formData: unknown) => {
    try {
        const validated = transactionSchema.parse(formData);
        // Proceed with validated data
    } catch (error) {
        // Handle validation errors
    }
};
```

#### Backend Validation
Ensure backend also validates all inputs (never trust client-side validation alone).

---

## 🔒 Production Security Checklist

### High Priority

- [ ] **Migrate to httpOnly cookies** for token storage
- [ ] **Implement token refresh** mechanism
- [ ] **Add rate limiting** on authentication endpoints
- [ ] **Enable HTTPS** in production (enforce via HSTS header)
- [ ] **Configure CSP headers** to prevent XSS
- [ ] **Add security headers** (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] **Implement proper logging** for security events
- [ ] **Add CSRF protection** if using cookies

### Medium Priority

- [ ] **Input validation** with Zod schemas on all forms
- [ ] **SQL injection protection** on backend (use parameterized queries)
- [ ] **Implement password complexity** requirements
- [ ] **Add account lockout** after failed login attempts
- [ ] **Sanitize all user inputs** before storage
- [ ] **Audit dependencies** regularly for vulnerabilities
- [ ] **Add security scanning** to CI/CD pipeline

### Low Priority (Nice to Have)

- [ ] **Implement MFA** (Two-Factor Authentication)
- [ ] **Add session management** (view active sessions, logout from all devices)
- [ ] **Implement audit logging** for sensitive operations
- [ ] **Add data encryption at rest** for sensitive fields
- [ ] **Implement backup encryption**
- [ ] **Add Content Security Policy** reporting

---

## Security Headers Configuration

### Recommended Headers for Production

```javascript
// Express.js backend (server/index.js)
const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],  // Tailwind requires unsafe-inline
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
}));

// Custom headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
```

---

## Password Security

### Current Backend Implementation (server/index.js)
```javascript
// Good: Using bcrypt for password hashing
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
```

### Recommendations

1. **Enforce password complexity** on signup:
```typescript
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
```

2. **Add password strength indicator** on signup form

3. **Implement "forgot password"** functionality with secure token reset

---

## API Security

### Current Implementation
✅ JWT authentication
✅ Authorization header usage
✅ Content-Type validation

### Recommendations

1. **Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', authLimiter, loginHandler);
```

2. **Request Size Limiting:**
```javascript
app.use(express.json({ limit: '10kb' }));
```

3. **Validate JWT on every request:**
```javascript
const validateToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check expiration
        if (decoded.exp * 1000 < Date.now()) {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
```

---

## Environment Variables

### Required for Production

Create a `.env.production` file:

```bash
# JWT Configuration
JWT_SECRET=<strong-random-secret-256-bits>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database (if migrating from SQLite)
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=epargne
DB_USER=epargne_user
DB_PASSWORD=<strong-password>

# Security
NODE_ENV=production
HTTPS_ENABLED=true
ALLOWED_ORIGINS=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

**Important:** Never commit `.env` files to version control!

---

## Monitoring and Incident Response

### Recommended Tools

1. **Error Tracking:** Sentry or Rollbar
2. **Security Monitoring:** Snyk or npm audit
3. **Performance Monitoring:** New Relic or DataDog
4. **Logging:** Winston (Node.js) or structured logging

### Security Events to Log

- Failed login attempts (with IP and timestamp)
- Successful logins (with IP and device info)
- Token refresh events
- Authorization failures
- Data modification events (transactions CRUD)
- Account changes (password reset, email change)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'security.log', level: 'warn' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Usage
logger.warn('Failed login attempt', {
    email: req.body.email,
    ip: req.ip,
    timestamp: new Date().toISOString()
});
```

---

## Compliance Considerations

### GDPR (if handling EU user data)

- [ ] Add privacy policy
- [ ] Implement "right to be forgotten" (account deletion)
- [ ] Add data export functionality
- [ ] Log consent for data processing
- [ ] Implement data minimization (don't store unnecessary data)

### Financial Data

- [ ] Encrypt sensitive financial data at rest
- [ ] Implement audit trail for all transactions
- [ ] Regular security audits
- [ ] Penetration testing before production launch

---

## Security Testing

### Manual Security Tests

1. **XSS Testing:**
   - Try injecting `<script>alert('XSS')</script>` in all input fields
   - Verify error messages don't execute scripts

2. **Authentication Testing:**
   - Test with expired/invalid tokens
   - Test with missing tokens
   - Test authorization (accessing other users' data)

3. **SQL Injection Testing:**
   - Try `' OR '1'='1` in login fields
   - Test with special characters in all inputs

### Automated Security Testing

```bash
# npm audit for vulnerability scanning
npm audit

# Fix vulnerabilities
npm audit fix

# OWASP Dependency Check
npm install -g owasp-dependency-check
owasp-dependency-check --project "Epargne" --scan ./

# Snyk for continuous monitoring
npm install -g snyk
snyk test
snyk monitor
```

---

## Conclusion

### Current Security Status: 🟢 GOOD for MVP

The application has solid foundations with:
- Basic XSS protection
- JWT authentication
- Type safety
- Error handling

### Before Production Launch: Complete High Priority Items

Focus on:
1. httpOnly cookies for token storage
2. Token expiration and refresh
3. Rate limiting
4. HTTPS enforcement
5. Security headers

### Continuous Security

- Regular dependency updates
- Security audits
- Monitoring and logging
- Incident response plan

---

**Document Version:** 1.0  
**Last Updated:** February 14, 2026  
**Next Review:** Before production deployment
