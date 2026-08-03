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

import { AnalyticsProvider, EventProperties, UserTraits } from '../analytics-spi';

/**
 * Console-based analytics provider for development and debugging.
 * Logs all analytics calls to the browser console.
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'ConsoleAnalyticsProvider';

  trackEvent(eventName: string, properties?: EventProperties): void {
    console.log('[Analytics] Event:', eventName, properties ?? {});
  }

  trackPageView(pageName: string, properties?: EventProperties): void {
    console.log('[Analytics] Page View:', pageName, properties ?? {});
  }

  identifyUser(userId: string, traits?: UserTraits): void {
    console.log('[Analytics] Identify User:', userId, traits ?? {});
  }

  reset(): void {
    console.log('[Analytics] Reset');
  }
}
