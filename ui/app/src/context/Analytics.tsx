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

import React, { createContext, ReactElement, useContext, useEffect, useMemo } from 'react';
import {
  configureAnalytics,
  trackEvent as coreTrackEvent,
  trackPageView as coreTrackPageView,
  identifyUser as coreIdentifyUser,
  resetAnalytics as coreResetAnalytics,
  AnalyticsConfig,
  EventProperties,
  UserTraits,
} from '@perses-dev/core';

/**
 * Analytics context type with tracking methods.
 */
interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: EventProperties) => void;
  trackPageView: (pageName: string, properties?: EventProperties) => void;
  identifyUser: (userId: string, traits?: UserTraits) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

/**
 * Props for the AnalyticsProvider component.
 */
export interface AnalyticsProviderProps {
  /**
   * Analytics configuration with providers and optional event prefix.
   * If not provided, analytics will be disabled (no-op).
   */
  config?: AnalyticsConfig;
  children: React.ReactNode;
}

/**
 * Provider component that initializes the analytics system.
 * Wrap your application with this component to enable analytics tracking.
 * @example
 * <AnalyticsProvider config={{ providers: [new PostHogProvider()], eventPrefix: 'perses_' }}>
 *   <App />
 * </AnalyticsProvider>
 */
export function AnalyticsProvider({ config, children }: AnalyticsProviderProps): ReactElement {
  useEffect(() => {
    if (config) {
      configureAnalytics(config);
    }
  }, [config]);

  const contextValue = useMemo(
    () => ({
      trackEvent: coreTrackEvent,
      trackPageView: coreTrackPageView,
      identifyUser: coreIdentifyUser,
      reset: coreResetAnalytics,
    }),
    []
  );

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>;
}

/**
 * Hook to access analytics tracking methods.
 * @returns Analytics tracking methods
 * @throws Error if used outside of AnalyticsProvider
 * @example
 * const { trackEvent } = useAnalytics();
 * trackEvent('button_clicked', { button_name: 'save' });
 */
export function useAnalytics(): AnalyticsContextType {
  const ctx = useContext(AnalyticsContext);
  if (ctx === undefined) {
    throw new Error('No AnalyticsContext found. Did you forget a Provider?');
  }
  return ctx;
}
