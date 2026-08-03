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

import { AnalyticsProvider } from './analytics-spi';

/**
 * Configuration for the analytics system.
 */
export interface AnalyticsConfig {
  /**
   * Optional prefix to prepend to all event names.
   * Example: if prefix is 'perses_', event 'button_clicked' becomes 'perses_button_clicked'
   */
  eventPrefix?: string;

  /**
   * List of analytics providers to use.
   * Multiple providers can be active simultaneously.
   */
  providers: AnalyticsProvider[];
}

/**
 * Registry for managing analytics providers.
 * Singleton pattern to maintain global analytics configuration.
 */
class AnalyticsRegistry {
  private providers: AnalyticsProvider[] = [];
  private eventPrefix = '';

  /**
   * Configure the analytics system with providers and settings.
   * @param config - Analytics configuration
   */
  configure(config: AnalyticsConfig): void {
    this.providers = config.providers;
    this.eventPrefix = config.eventPrefix ?? '';
  }

  /**
   * Register a single analytics provider.
   * @param provider - Provider to register
   */
  registerProvider(provider: AnalyticsProvider): void {
    if (!this.providers.find((p) => p.name === provider.name)) {
      this.providers.push(provider);
    }
  }

  /**
   * Unregister a provider by name.
   * @param providerName - Name of provider to remove
   */
  unregisterProvider(providerName: string): void {
    this.providers = this.providers.filter((p) => p.name !== providerName);
  }

  /**
   * Get all registered providers.
   * @returns Array of registered providers
   */
  getProviders(): AnalyticsProvider[] {
    return [...this.providers];
  }

  /**
   * Get the configured event prefix.
   * @returns Event prefix string
   */
  getEventPrefix(): string {
    return this.eventPrefix;
  }

  /**
   * Set the event prefix.
   * @param prefix - Prefix to prepend to event names
   */
  setEventPrefix(prefix: string): void {
    this.eventPrefix = prefix;
  }

  /**
   * Clear all providers and reset configuration.
   */
  reset(): void {
    this.providers = [];
    this.eventPrefix = '';
  }
}

// Singleton instance
export const analyticsRegistry = new AnalyticsRegistry();
