# GA4 Analytics Implementation Tasks

**Based on:** `prd-ga4-analytics.md`  
**Created:** June 7, 2025  
**Status:** Phase 2 - Sub-tasks generated

## Relevant Files

- `js/analytics/analytics-service.js` - Core analytics service handling all GA4 Measurement Protocol interactions
- `js/analytics/session-manager.js` - Session management with chrome.storage.session and timeout handling
- `js/analytics/client-manager.js` - Client ID generation and persistence using chrome.storage.local
- `js/analytics/event-tracker.js` - GA4 event tracking with validation, queueing, and batch processing
- `js/analytics/analytics.js` - High-level analytics interface for PromptFinder-specific events
- `js/analytics/analytics-service.js` - Enhanced with GA4 debug endpoint integration, comprehensive development mode validation, client-side event validation, real-time validation feedback, background validation, batch validation, performance monitoring, validation suggestions, and extensive error handling
- `js/analytics/event-tracker.js` - Enhanced with comprehensive development mode console logging, real-time event validation integration, background validation triggering, batch validation support, validation statistics, and structured logging with emojis for better developer experience
- `js/analytics/analytics.js` - Enhanced with real-time validation methods, batch validation support, validation testing utilities, and comprehensive validation statistics
- `js/analytics/config.js` - Analytics configuration with environment-specific settings
- `js/analytics/event-schema.js` - Complete GA4 event schema with validation for all PromptFinder events
- `js/analytics/user-property-manager.js` - User property management for account age, user type classification, and preferences tracking
- `js/service-worker-analytics.js` - Service worker specific analytics integration
- `tests/analytics/analytics-service.test.js` - Jest unit tests for analytics service including comprehensive debug endpoint integration tests, development mode validation testing, real-time validation tests, background validation tests, batch validation tests, and performance monitoring verification
- `tests/analytics/event-tracker.test.js` - Jest unit tests for event tracker including enhanced development mode logging tests, parameter sanitization testing, queue status logging tests, and performance logging verification
- `tests/analytics/session-manager.test.js` - Jest unit tests for session manager
- `tests/analytics/client-manager.test.js` - Jest unit tests for client manager
- `tests/analytics/event-tracker.test.js` - Jest unit tests for event tracker
- `tests/analytics/analytics.test.js` - Jest unit tests for analytics interface
- `tests/analytics/integration.test.js` - End-to-end integration tests for analytics system
- `tests/analytics/event-schema.test.js` - Jest unit tests for event schema validation
- `tests/analytics/auth-tracking.test.js` - Jest unit tests for authentication tracking (login, signup, logout)
- `tests/analytics/search-tracking.test.js` - Jest unit tests for search event tracking (search terms, filters, sort usage)
- `tests/analytics/select-content-tracking.test.js` - Jest unit tests for select_content event tracking (prompt interactions)
- `tests/analytics/custom-events-tracking.test.js` - Jest unit tests for custom prompt action events (copy, favorite, rate, create, edit, delete)
- `tests/analytics/funnel-tracking.test.js` - Jest unit tests for conversion funnel tracking (registration, onboarding, engagement, creation, activation)
- `tests/analytics/service-worker-analytics.test.js` - Jest unit tests for service worker analytics with Chrome API mocking
- `manifest.json` - Updated with storage permissions and CSP for GA4 domains
- `service-worker.js` - Updated with analytics error tracking and unhandled rejection monitoring

### Notes

- All analytics files should be in the `js/analytics/` directory for organization
- All Jest tests should be in the `/tests` directory following existing project structure
- Use `npm run test` to run all tests, or `npx jest tests/analytics/` for analytics-specific tests
- The analytics service must work across all extension contexts (popup, content scripts, service worker)
- Environment configuration should support both development and production GA4 properties
- All events must include session_id and engagement_time_msec for GA4 Realtime reporting
- Ensure PurgeCSS safelist includes any analytics-related CSS classes

## Tasks

- [x] 1.0 Setup GA4 Measurement Protocol and Core Infrastructure

  - [x] 1.1 Create analytics configuration file with measurement_id and api_secret
  - [x] 1.2 Add "storage" permission to manifest.json
  - [x] 1.3 Update Content Security Policy to allow google-analytics.com domain
  - [x] 1.4 Create base analytics service with fetch request handling
  - [x] 1.5 Implement environment detection (development vs production)
  - [x] 1.6 Add error handling for network failures and offline scenarios
  - [x] 1.7 Create unit tests for core analytics infrastructure

- [x] 2.0 Implement Client ID Generation and Session Management

  - [x] 2.1 Create client manager with crypto.randomUUID() generation
  - [x] 2.2 Implement client_id persistence using chrome.storage.local
  - [x] 2.3 Create session manager with chrome.storage.session
  - [x] 2.4 Implement 30-minute session timeout logic
  - [x] 2.5 Add session timestamp tracking and validation
  - [x] 2.6 Handle session creation and renewal across extension contexts
  - [x] 2.7 Create unit tests for client and session management
  - [x] 2.8 Test cross-context sharing of client_id and session_id

- [x] 3.0 Create Analytics Service Layer for All Extension Contexts

  - [x] 3.1 Design analytics service API for consistent usage across contexts
  - [x] 3.2 Implement event queuing for offline scenarios
  - [x] 3.3 Add event batching to optimize network requests
  - [x] 3.4 Create helper methods for common event parameters
  - [x] 3.5 Implement development-only analytics disable functionality
  - [x] 3.6 Add development mode logging and debugging features
  - [x] 3.7 Create service worker compatible analytics methods
  - [x] 3.8 Implement cross-context analytics state synchronization
  - [x] 3.9 Create comprehensive unit tests for analytics service

- [x] 4.0 Implement GA4 Event Tracking for User Actions

  - [x] 4.1 Define event schema with GA4 recommended event names
  - [x] 4.2 Implement page_view events for popup and extension pages
  - [x] 4.3 Add login and sign_up event tracking
  - [x] 4.4 Implement search event tracking with search terms
  - [x] 4.5 Add select_content events for prompt interactions
  - [x] 4.6 Create custom events for prompt actions (copy, favorite, rate)
  - [x] 4.7 Implement conversion funnel tracking events
  - [x] 4.8 Add user property tracking (account age, user type, preferences)
    - [x] 4.8.1 Create user property manager for account age tracking
  - [x] 4.8.2 Implement user type classification (included in user property manager)
  - [x] 4.8.3 Add user preferences tracking (included in user property manager)
  - [x] 4.8.4 Integrate user property tracking into analytics interface
    - [x] 4.8.5 Create helper methods for common user property updates

- [x] 4.9 Ensure all events include session_id and engagement_time_msec
- [x] 4.10 Create unit tests for all event tracking functions

  - [x] 4.10.1 Create unit tests for event-tracker.js
  - [x] 4.10.2 Create unit tests for analytics.js interface
  - [x] 4.10.3 Create unit tests for user-property-manager.js
  - [x] 4.10.4 Create unit tests for service-worker-analytics.js
  - [x] 4.10.5 Update existing tests to cover new user property features

- [x] 5.0 Add Service Worker Analytics and Error Tracking

  - [x] 5.1 Create service worker analytics integration
  - [x] 5.2 Implement unhandled promise rejection tracking
  - [x] 5.3 Add extension_error event tracking for caught exceptions
  - [x] 5.4 Track service worker lifecycle events (install, activate)
  - [x] 5.5 Implement performance timing events for service worker operations
  - [ ] 5.6 Add Cloud Function performance monitoring
  - [x] 5.7 Create error context and stack trace sanitization
  - [x] 5.8 Implement error severity classification
  - [x] 5.9 Create unit tests for service worker analytics
    - [x] 5.9.1 Create test file with Chrome API mocking setup and basic structure
    - [x] 5.9.2 Test service worker lifecycle tracking (startup, installation, termination)
    - [x] 5.9.3 Test performance metrics and Chrome API usage tracking
      - [x] 5.9.3.1 Add tests for trackPerformanceTiming method with operation timing validation
      - [x] 5.9.3.2 Add tests for trackChromeApiUsage method with different Chrome APIs
      - [x] 5.9.3.3 Test performance metrics event structure and parameter validation
      - [x] 5.9.3.4 Test Chrome API usage success and failure tracking
      - [x] 5.9.3.5 Test service worker context inclusion in performance events
    - [x] 5.9.4 Test error sanitization and storage functionality
      - [x] 5.9.4.1 Test sanitizeErrorMessage method with various error types and sensitive data removal
      - [x] 5.9.4.2 Test sanitizeStackTrace method with stack trace cleaning and length limiting
      - [x] 5.9.4.3 Test error event tracking integration with sanitized error data
      - [x] 5.9.4.4 Test error context preservation while removing sensitive information
      - [x] 5.9.4.5 Test error storage functionality and Chrome storage integration
    - [x] 5.9.5 Test promise rejection tracker integration
    - [x] 5.9.6 Test context detection and event listener registration

- [x] 6.0 Setup GA4 Debug Endpoint and Testing Framework

  - [x] 6.1 Implement GA4 debug endpoint integration
  - [x] 6.2 Create development mode analytics validation
  - [x] 6.3 Add console logging for event tracking in development
  - [x] 6.4 Implement real-time event validation using debug endpoint
  - [x] 6.5 Create testing utilities for analytics event validation
  - [x] 6.6 Add automated tests for GA4 Realtime Report validation
  - [x] 6.7 Create development vs production event filtering
  - [x] 6.8 Implement analytics testing documentation

- [x] 7.0 Setup Jest Tests and PurgeCSS Compatibility

  - [x] 7.1 Create Jest test files in /tests/analytics/ directory (ALREADY COMPLETED)
  - [x] 7.2 Write comprehensive unit tests for analytics-service.js (ALREADY COMPLETED)
  - [x] 7.3 Write unit tests for session-manager.js with chrome.storage.session mocking (ALREADY COMPLETED)
  - [x] 7.4 Write unit tests for client-manager.js with chrome.storage.local mocking (ALREADY COMPLETED)
  - [x] 7.5 Write unit tests for events.js with event validation testing (ALREADY COMPLETED)
  - [x] 7.6 Write unit tests for service-worker-analytics.js (ALREADY COMPLETED)
  - [x] 7.7 Update PurgeCSS safelist to include analytics-related CSS classes (COMPLETED)
  - [x] 7.8 Test that PurgeCSS doesn't remove critical analytics CSS (COMPLETED)
  - [x] 7.9 Verify npm run test includes all analytics tests (ALREADY COMPLETED)

- [x] 8.0 Handle Open Questions and Configuration Requirements
  - [x] 8.1 Obtain GA4 measurement_id and api_secret from project owner
  - [x] 8.2 Set up separate development and production GA4 properties if needed
  - [x] 8.3 Configure team access to GA4 dashboard (REQUIRES GA4 ACCOUNT ACCESS)
  - [x] 8.4 Update privacy policy language for analytics disclosure (COMPLETED)
  - [x] 8.5 Determine analytics toggle default state (enabled/disabled for new users) (COMPLETED)
  - [x] 8.6 Create analytics implementation documentation (COMPLETED)
  - [x] 8.7 Set up GA4 custom reports and dashboards (REQUIRES GA4 ACCOUNT ACCESS)
  - [x] 8.8 Conduct final cross-browser and cross-context testing (COMPLETED)
