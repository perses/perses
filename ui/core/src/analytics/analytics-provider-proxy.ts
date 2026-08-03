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

import { AnalyticsProvider, EventProperties, UserTraits } from './analytics-spi';
import { analyticsRegistry } from './analytics-registry';

/**
 * Proxy that routes analytics calls to all registered providers.
 * Handles event name prefixing and error isolation per provider.
 */
class AnalyticsProviderProxy implements AnalyticsProvider {
  readonly name = 'AnalyticsProviderProxy';

  /**
   * Apply the configured prefix to an event name.
   * @param eventName - Original event name
   * @returns Prefixed event name
   */
  private applyPrefix(eventName: string): string {
    const prefix = analyticsRegistry.getEventPrefix();
    return prefix ? `${prefix}${eventName}` : eventName;
  }

  /**
   * Execute a function on all registered providers with error isolation.
   * If one provider throws, others still execute.
   * @param fn - Function to execute on each provider
   */
  private executeOnProviders(fn: (provider: AnalyticsProvider) => void): void {
    const providers = analyticsRegistry.getProviders();
    providers.forEach((provider) => {
      try {
        fn(provider);
      } catch (error) {
        console.error(`Analytics provider '${provider.name}' error:`, error);
      }
    });
  }

  trackEvent(eventName: string, properties?: EventProperties): void {
    const prefixedEventName = this.applyPrefix(eventName);
    this.executeOnProviders((provider) => {
      provider.trackEvent(prefixedEventName, properties);
    });
  }

  trackPageView(pageName: string, properties?: EventProperties): void {
    this.executeOnProviders((provider) => {
      provider.trackPageView(pageName, properties);
    });
  }

  identifyUser(userId: string, traits?: UserTraits): void {
    this.executeOnProviders((provider) => {
      provider.identifyUser(userId, traits);
    });
  }

  reset(): void {
    this.executeOnProviders((provider) => {
      provider.reset();
    });
  }
}

// Singleton proxy instance
export const analyticsProviderProxy = new AnalyticsProviderProxy();
