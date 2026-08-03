# Perses Analytics System

A pluggable analytics system for tracking user interactions in Perses. This system allows consuming applications to provide their own analytics providers without adding hard dependencies to the Perses core.

## Architecture

The analytics system follows a provider pattern inspired by the [PatternFly Chatbot tracking system](https://github.com/patternfly/chatbot/tree/main/packages/module/src/tracking):

- **SPI (Service Provider Interface)**: Defines the contract that all analytics providers must implement
- **Registry**: Manages registered analytics providers
- **Proxy**: Routes tracking calls to all registered providers with error isolation
- **API**: Public interface for tracking events, page views, and user identification

## Basic Usage

### 1. Configure Analytics in Your Application

```typescript
import { AnalyticsProvider } from '@perses-dev/app';
import { ConsoleAnalyticsProvider } from '@perses-dev/core';

// Use the built-in console provider for development
const config = {
  providers: [new ConsoleAnalyticsProvider()],
  eventPrefix: 'perses_', // Optional: prefix all events
};

function App() {
  return (
    <AnalyticsProvider config={config}>
      <YourAppComponents />
    </AnalyticsProvider>
  );
}
```

### 2. Track Events in Components

```typescript
import { useAnalytics } from '../context/Analytics';

function CreateDashboardButton() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('button_clicked', {
      button_name: 'create_dashboard',
      location: 'header',
    });
    // ... rest of click handler
  };

  return <button onClick={handleClick}>Create Dashboard</button>;
}
```

### 3. Track Wizard Steps

```typescript
function ProjectCreationWizard() {
  const { trackEvent } = useAnalytics();

  const handleStepComplete = (stepNumber: number, stepName: string) => {
    trackEvent('wizard_step_completed', {
      wizard_name: 'create_project',
      step_number: stepNumber,
      step_name: stepName,
    });
  };

  // ... wizard implementation
}
```

## Event Prefix

The `eventPrefix` configuration option allows you to namespace all events:

```typescript
const config = {
  providers: [myProvider],
  eventPrefix: 'myapp_',
};

// Later when tracking:
trackEvent('button_clicked'); // Sent as 'myapp_button_clicked'
```

## Creating Custom Providers

Implement the `AnalyticsProvider` interface to create your own analytics provider:

```typescript
import { AnalyticsProvider, EventProperties, UserTraits } from '@perses-dev/core';

export class PostHogAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'PostHogAnalyticsProvider';
  private posthog: PostHog;

  constructor(apiKey: string) {
    this.posthog = posthog.init(apiKey);
  }

  trackEvent(eventName: string, properties?: EventProperties): void {
    this.posthog.capture(eventName, properties);
  }

  trackPageView(pageName: string, properties?: EventProperties): void {
    this.posthog.capture('$pageview', { ...properties, page: pageName });
  }

  identifyUser(userId: string, traits?: UserTraits): void {
    this.posthog.identify(userId, traits);
  }

  reset(): void {
    this.posthog.reset();
  }
}
```

## Using Multiple Providers

You can register multiple providers simultaneously:

```typescript
const config = {
  providers: [
    new ConsoleAnalyticsProvider(), // Log to console
    new PostHogAnalyticsProvider('api-key'), // Send to PostHog
    new SegmentAnalyticsProvider('write-key'), // Send to Segment
  ],
  eventPrefix: 'perses_',
};
```

All providers will receive tracking calls. If one provider throws an error, others continue to work.

## API Reference

### Core Functions

- `configureAnalytics(config)` - Initialize the analytics system with providers
- `trackEvent(eventName, properties?)` - Track a custom event
- `trackPageView(pageName, properties?)` - Track a page view
- `identifyUser(userId, traits?)` - Identify a user
- `resetAnalytics()` - Clear user identity (e.g., on logout)

### React Hooks

- `useAnalytics()` - Access analytics tracking methods in React components

### Types

- `AnalyticsProvider` - Interface for implementing custom providers
- `EventProperties` - Type for event metadata (Record<string, unknown>)
- `UserTraits` - Type for user attributes (Record<string, unknown>)
- `AnalyticsConfig` - Configuration object with providers and optional eventPrefix

## No-Op Behavior

If `AnalyticsProvider` is used without a config, or if no providers are registered, all tracking calls become no-ops (silent, no errors thrown). This allows Perses to work perfectly without analytics configured.

## Error Handling

Each provider runs in isolation. If one provider throws an error, it's logged to the console and other providers continue to execute.
