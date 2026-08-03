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

import { IAnalyticsTracker, EventProperties } from '@perses-dev/dashboards';
import { useAnalytics } from '../context/Analytics';

/**
 * Adapter that bridges perses-upstream analytics to the IAnalyticsTracker interface
 * expected by @perses-dev/dashboards components.
 */
export class AnalyticsTrackerAdapter implements IAnalyticsTracker {
  constructor(private trackEventFn: (eventName: string, properties?: EventProperties) => void) {}

  trackEvent(eventName: string, properties?: EventProperties): void {
    console.log('[AnalyticsTrackerAdapter] Received event:', eventName, properties);
    this.trackEventFn(eventName, properties);
  }
}

/**
 * Hook to create an analytics tracker adapter from the current analytics context
 */
export function useAnalyticsTracker(): IAnalyticsTracker {
  const { trackEvent } = useAnalytics();
  return new AnalyticsTrackerAdapter(trackEvent);
}
