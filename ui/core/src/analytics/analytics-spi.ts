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

/**
 * Properties associated with an analytics event.
 * Key-value pairs of event metadata.
 */
export type EventProperties = Record<string, unknown>;

/**
 * User traits for identification.
 * Key-value pairs of user attributes.
 */
export type UserTraits = Record<string, unknown>;

/**
 * Service Provider Interface for analytics providers.
 * All analytics implementations must implement this interface.
 */
export interface AnalyticsProvider {
  /**
   * Unique identifier for this provider.
   */
  readonly name: string;

  /**
   * Track a custom event.
   * @param eventName - Name of the event to track
   * @param properties - Optional properties associated with the event
   */
  trackEvent(eventName: string, properties?: EventProperties): void;

  /**
   * Track a page view.
   * @param pageName - Name or path of the page
   * @param properties - Optional properties associated with the page view
   */
  trackPageView(pageName: string, properties?: EventProperties): void;

  /**
   * Identify a user.
   * @param userId - Unique identifier for the user
   * @param traits - Optional traits/attributes of the user
   */
  identifyUser(userId: string, traits?: UserTraits): void;

  /**
   * Reset/clear the current user identity.
   * Called on logout or when switching users.
   */
  reset(): void;
}
