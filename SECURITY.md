# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Open a Public Issue

Please do not create a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send details to: [Your email or create a GitHub Security Advisory]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Time

- We aim to acknowledge reports within 48 hours
- We will provide updates every 7 days
- We will work with you to understand and resolve the issue

### 4. Disclosure

- We will coordinate public disclosure with you
- We prefer coordinated disclosure after a fix is available
- We will credit you in the security advisory (if desired)

## Security Considerations

LocalMind is designed with privacy in mind:

### Data Storage
- All conversations are stored locally in browser localStorage
- No data is sent to external servers
- No telemetry or analytics

### Ollama Connection
- Connects to localhost only (127.0.0.1:11434)
- Uses HTTP (not HTTPS) as it's local-only
- No authentication required (local trust model)

### Code Execution
- Renders markdown safely using react-markdown
- Code blocks are display-only (no execution)
- No eval() or arbitrary code execution

### Dependencies
- Regularly updated to patch security issues
- Run `npm audit` to check for vulnerabilities
- Run `npm audit fix` to apply fixes

## Best Practices for Users

1. **Keep Ollama Updated**: Run `brew upgrade ollama` regularly
2. **Keep LocalMind Updated**: Download latest releases
3. **Verify Downloads**: Check DMG signatures and sizes
4. **Local Use Only**: Don't expose Ollama to the network
5. **Review System Prompts**: Be cautious with custom system prompts from untrusted sources

## Known Security Limitations

1. **No Code Signing**: Initial release is not code-signed (requires Apple Developer account)
2. **Local Trust Model**: Assumes localhost environment is trusted
3. **No Encryption at Rest**: Conversations stored in plain text in localStorage

## Future Security Enhancements

- [ ] Code signing with Apple Developer certificate
- [ ] Optional conversation encryption
- [ ] Secure credential storage (if needed for future features)
- [ ] Regular security audits

## Questions?

For general security questions, open a GitHub Discussion.

Thank you for helping keep LocalMind secure! 🔒
