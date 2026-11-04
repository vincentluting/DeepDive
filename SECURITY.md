# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

**Email**: security@deepdive.careers

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will acknowledge reports within 48 hours and aim to resolve critical issues within 7 days.

## Security Measures

- **Authentication**: bcrypt (12 rounds) password hashing, 30-day session tokens
- **CSRF**: Double-submit cookie pattern on all state-changing endpoints
- **Rate Limiting**: Redis-backed with in-memory fallback
- **API Guards**: 5-tier route protection (`guardRoute`) — public, read, write, admin, super
- **Input Validation**: Zod schemas on all API request bodies
- **SQL Injection**: Parameterized queries via tagged template literals (Neon serverless driver)
- **XSS**: React's built-in escaping + no `dangerouslySetInnerHTML`
- **Data Privacy**: User data export and account deletion available in Settings > Privacy

## Supported Versions

Only the latest deployed version receives security updates.
