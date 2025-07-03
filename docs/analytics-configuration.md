# DesignPrompts Analytics Configuration Guide

## Overview

This document outlines the configuration decisions and setup requirements for DesignPrompts's GA4 analytics implementation.

## Analytics Toggle Default State

### Current Configuration: **ENABLED BY DEFAULT**

**Decision Rationale:**

- **Product improvement**: Analytics data is essential for identifying and fixing issues
- **User experience optimization**: Usage data helps prioritize feature development
- **Error tracking**: Critical for maintaining extension quality and stability
- **Anonymous collection**: No personal data is collected, reducing privacy concerns

### Implementation Details

```javascript
// In js/analytics/config.js
const ANALYTICS_ENABLED_BY_DEFAULT = true;

// Analytics is enabled unless explicitly disabled
function isAnalyticsEnabled() {
  // For new users, analytics is enabled by default
  // Users can contact support to opt out if desired
  return getCurrentConfig().enableAnalytics !== false;
}
```

### Privacy Considerations

- **Transparent disclosure**: Clear privacy policy explains all data collection
- **Minimal data collection**: Only anonymous usage and performance metrics
- **No PII**: Zero personal information collection by design
- **User control**: Contact-based opt-out available for privacy-conscious users

### Future User-Facing Controls

**Planned for future releases:**

- Settings page toggle for analytics on/off
- First-run consent dialog with clear explanation
- Granular controls for different types of analytics
- Easy one-click disable option

```javascript
// Future implementation example
const analyticsSettings = {
  usageAnalytics: true, // Feature usage tracking
  errorTracking: true, // Technical error reporting
  performanceMetrics: true, // Load time and performance
  conversionEvents: false, // User funnel tracking (optional)
};
```

## GA4 Account Configuration

### Environment Setup

**Development Property:**

- **Measurement ID**: `G-0E14FPYC5W`
- **API Secret**: `UmhKBYThRLS4Bp-YGShMfA`
- **Purpose**: Testing and development validation

**Production Property:**

- **Measurement ID**: `G-NS4KTS6DW6`
- **API Secret**: `WO9ij02eTTumxvPAs4NSwg`
- **Purpose**: Live user analytics data

### Team Access Requirements

**GA4 Dashboard Access Levels:**

1. **Administrator Access** (Full permissions)
   - Project lead/owner
   - Senior developers
   - Data analysts
2. **Editor Access** (Can modify reports and configs)

   - Lead developers
   - Product managers
   - QA leads

3. **Viewer Access** (Read-only)
   - All developers
   - Customer support team
   - Stakeholders

**Required GA4 Access Setup:**

```
# Team members needing access:
project-owner@company.com        → Administrator
lead-developer@company.com       → Editor
product-manager@company.com      → Editor
qa-lead@company.com             → Editor
developer-1@company.com         → Viewer
developer-2@company.com         → Viewer
support-team@company.com        → Viewer
stakeholder@company.com         → Viewer
```

## Custom Reports and Dashboards

### Essential Reports to Create

**1. Daily Active Users (DAU)**

- Active users by day/week/month
- User retention cohorts
- New vs returning users

**2. Feature Usage Analytics**

- Most used extension features
- Feature adoption rates
- User flow through main actions

**3. Performance Monitoring**

- Extension load times
- Error rates and types
- Service worker performance

**4. Conversion Funnels**

- Registration to first usage
- First session to prompt interaction
- Prompt viewing to copying/favoriting

**5. Technical Health Dashboard**

- Error tracking summary
- Performance metrics overview
- Browser compatibility data

### Custom Dimensions Setup

**Required Custom Dimensions in GA4:**

```javascript
// User Properties
user_type: 'new_user' | 'returning_user' | 'power_user';
account_age_days: number;
preferred_categories: array;
extension_version: string;

// Event Properties
prompt_category: string;
search_terms: string(anonymized);
feature_name: string;
error_type: string;
performance_metric: string;
```

## Development vs Production Configuration

### Environment Detection

```javascript
// Automatic environment detection
function getEnvironment() {
  if (chrome.runtime.getManifest().update_url === undefined) {
    return 'development'; // Unpacked extension
  }
  return 'production';
}
```

### Development Configuration

- **Debug endpoint**: Events sent to GA4 debug endpoint for validation
- **Console logging**: Detailed logging for debugging
- **Test data filtering**: Development events tagged for exclusion
- **Real-time validation**: All events validated against GA4 schema

### Production Configuration

- **Standard endpoint**: Events sent to production GA4 endpoint
- **Minimal logging**: Error-level logging only
- **Data integrity**: Production-ready event filtering
- **Performance optimized**: Minimal overhead analytics implementation

## Data Retention and Compliance

### GA4 Data Retention

- **Standard retention**: 14 months (GA4 default)
- **User properties**: Retained for full retention period
- **Events**: Auto-deleted after retention period
- **Custom parameters**: Subject to same retention rules

### Privacy Compliance

- **GDPR compliance**: Anonymous data collection only
- **CCPA compliance**: No personal data sale or sharing
- **Chrome Store policies**: Full compliance with extension analytics guidelines
- **Google Analytics ToS**: Following all GA4 terms of service

## Testing and Validation

### Development Testing

1. **Debug endpoint validation**: All events validate successfully
2. **Real-time report testing**: Events appear in GA4 Realtime reports
3. **Cross-context testing**: Analytics work across popup, content scripts, service worker
4. **Performance testing**: <100ms impact on extension startup

### Production Monitoring

1. **Event success rate**: Monitor for >99% event delivery success
2. **Error tracking**: Alert on unusual error rates or patterns
3. **Performance impact**: Ongoing monitoring of analytics overhead
4. **Data quality**: Regular validation of event parameters and values

## Implementation Status

### ✅ Completed Items

- [x] GA4 properties created for development and production
- [x] Measurement Protocol integration implemented
- [x] Anonymous client ID generation and storage
- [x] Session management with 30-minute timeout
- [x] Cross-context analytics support (popup, content scripts, service worker)
- [x] Event validation with GA4 debug endpoint
- [x] Development vs production environment filtering
- [x] Comprehensive Jest test suite (25 test suites, 774+ tests)
- [x] PurgeCSS compatibility for analytics CSS classes
- [x] Privacy policy documentation
- [x] Analytics testing and validation utilities

### 🎯 Next Steps (Requires GA4 Account Access)

- [ ] Create custom reports and dashboards in GA4
- [ ] Set up team access permissions
- [ ] Configure custom dimensions and metrics
- [ ] Set up automated alerts for critical issues
- [ ] Create analytics documentation for ongoing maintenance

## Contact Information

**For analytics questions or configuration changes:**

- Technical issues: Development team
- Account access: Project administrator
- Privacy concerns: Privacy officer or legal team
- Data requests: Data protection officer

---

_This configuration reflects the current analytics implementation as of the completion of GA4 Analytics Tasks 1.0-8.0_
