// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { EventProperties, UserTraits } from './analytics-spi';
import { analyticsProviderProxy } from './analytics-provider-proxy';
import { analyticsRegistry, AnalyticsConfig } from './analytics-registry';

/**
 * Configure the analytics system.
 * Must be called before using analytics tracking methods.
 * @param config - Analytics configuration with providers and optional event prefix
 */
export function configureAnalytics(config: AnalyticsConfig): void {
  analyticsRegistry.configure(config);
}

/**
 * Track a custom event.
 * Event name will be prefixed with the configured prefix if set.
 * @param eventName - Name of the event to track
 * @param properties - Optional properties associated with the event
 * @example
 * trackEvent('button_clicked', { button_name: 'create_dashboard', location: 'header' })
 */
export function trackEvent(eventName: string, properties?: EventProperties): void {
  analyticsProviderProxy.trackEvent(eventName, properties);
}

/**
 * Track a page view.
 * @param pageName - Name or path of the page
 * @param properties - Optional properties associated with the page view
 * @example
 * trackPageView('/dashboards', { project: 'my-project' })
 */
export function trackPageView(pageName: string, properties?: EventProperties): void {
  analyticsProviderProxy.trackPageView(pageName, properties);
}

/**
 * Identify a user for analytics tracking.
 * @param userId - Unique identifier for the user
 * @param traits - Optional traits/attributes of the user
 * @example
 * identifyUser('user-123', { email: 'user@example.com', role: 'admin' })
 */
export function identifyUser(userId: string, traits?: UserTraits): void {
  analyticsProviderProxy.identifyUser(userId, traits);
}

/**
 * Reset/clear the current user identity.
 * Should be called on logout or when switching users.
 */
export function resetAnalytics(): void {
  analyticsProviderProxy.reset();
}
