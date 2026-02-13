# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-02-13

### Added
- 🔒 **Security Policy** - Added comprehensive `SECURITY.md` documenting network access and security best practices
- 📖 Security section in README with quick security tips
- Network access documentation for manifest mode
- CSP (Content Security Policy) recommendations
- Security usage guidelines for developers
- `SECURITY.md` and `CHANGELOG.md` now ship with the npm package
- Configurable frame count cap via `REACT_SCROLL_MEDIA_MAX_FRAMES` env var (default 2000, ceiling 8000)

### Fixed
- Security: Documented optional network access in manifest mode
- Clarified when `fetch` is used (only for manifest mode)
- Added migration path for sensitive environments (use manual/pattern modes)
- Removed redundant `Array.isArray` check in manifest validation

### Changed
- Enhanced documentation for network access transparency
- Updated security recommendations in main documentation

### Security
- **Frame URL whitelist** — Only `http:` and `https:` protocols allowed (via `new URL()` parsing), rejects all others
- **Protocol-relative URL rejection** — `//evil.com/image.jpg` is explicitly blocked
- **Configurable frame count cap** — Default 2000, absolute ceiling 8000, override via `REACT_SCROLL_MEDIA_MAX_FRAMES` env var
- **Credential isolation** — `credentials: 'omit'` on manifest fetch prevents cookie/auth token leakage
- **Referrer protection** — `referrerPolicy: 'no-referrer'` prevents leaking the page URL to manifest servers
- **Response size limit** — 1MB max response size prevents memory exhaustion attacks
- **Frame URL sanitization** — Blocks `javascript:`, `data:`, `blob:`, and `vbscript:` protocol URLs to prevent XSS
- **Cache size limit** — Manifest cache capped at 50 entries with LRU eviction to prevent memory DoS
- HTTPS-only enforcement for manifest URLs (existing)
- 10-second timeout protection (existing)
- Content-type and response structure validation (existing)
- Network access is optional — use manual/pattern modes for zero network access

---

## [1.0.4] - 2026-02-10

### Added
- Support for lazy/eager loading modes
- Image decoding optimization to prevent main-thread jank
- Frame caching mechanisms
- Advanced memory management for large sequences (800+ frames)

### Fixed
- Improved performance on resource-constrained devices
- Better error handling in manifest loading

### Changed
- Optimized frame processing pipeline
- Enhanced scroll timeline calculations

---

## [1.0.3] - 2026-02-01

### Added
- Pattern mode for generating frame sequences
- Manifest loading support
- TypeScript type exports
- SSR safety checks

### Fixed
- Fixed scroll position calculations
- Corrected frame interpolation

---

## [1.0.2] - 2026-01-25

### Added
- Basic scroll sequence rendering
- Manual frame list support
- Context provider for scroll timeline

### Fixed
- Improved React 19 compatibility
- Fixed scroll event handling

---

## [1.0.1] - 2026-01-18

### Added
- Initial beta release
- Core scroll-driven animation logic
- Basic React component wrapper

### Fixed
- Early bug fixes and performance tweaks

---

## [1.0.0] - 2026-01-15

### Added
- 🚀 Initial release of react-scroll-media
- Production-ready scroll-driven image sequences
- Zero scroll-jacking implementation
- 60fps performance optimization
- TypeScript support
- Comprehensive documentation

---

## Version Support

| Version | Release Date | Status | Support Until |
|---------|--------------|--------|----------------|
| 1.0.5   | Feb 13, 2026 | ✅ Latest | Feb 13, 2027 |
| 1.0.4   | Feb 10, 2026 | ✅ Current | Feb 10, 2026 |
| 1.0.3   | Feb 1, 2026  | ⚠️ Old | Jan 1, 2027 |
| < 1.0.3 | Earlier      | ❌ EOL | Not supported |

---

## Upgrade Guide

### From 1.0.4 → 1.0.5

No breaking changes. Simply update to get security enhancements and documentation improvements.

```bash
npm install react-scroll-media@latest
```

### Security Note

Version 1.0.5 includes security documentation for manifest mode network access. Review [SECURITY.md](../SECURITY.md) for best practices.

---

## Future Roadmap

### Planned Features
- [ ] Web Worker support for frame processing
- [ ] GPU acceleration for larger sequences
- [ ] Advanced frame interpolation modes
- [ ] Performance monitoring API
- [ ] Cache persistence strategies

### Under Consideration
- Custom scroll containers
- Perspective transforms
- Multi-layer sequences
- Advanced timeline controls

---

For detailed information about each release, visit the [GitHub Releases](https://github.com/iam-saiteja/react-scroll-media/releases) page.

**Last Updated**: February 13, 2026
