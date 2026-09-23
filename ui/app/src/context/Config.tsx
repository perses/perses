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

import { buildRelativeTimeOption } from '@perses-dev/components';
import type { TimeOption } from '@perses-dev/components';
import { TimeRangeSettingsProvider } from '@perses-dev/plugin-system';
import { parseDurationString } from '@perses-dev/spec';
import type { DurationString } from '@perses-dev/spec';
import { milliseconds } from 'date-fns';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import type { ReactElement } from 'react';
import React, { createContext, useContext, useMemo } from 'react';

import { PersesLoader } from '../components/PersesLoader';
import type {
  Banner,
  ConfigModel,
  ImportantDashboardGroupConfig,
  ImportantDashboardSelectorConfig,
} from '../model/config-client';
import { useConfig } from '../model/config-client';
import { UserPreferencesContextProvider } from './UserPreferences';

interface ConfigContextType {
  config: ConfigModel;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigContextProvider(props: { children: React.ReactNode }): ReactElement {
  const { data, isLoading } = useConfig();
  const contextValue = useMemo<ConfigContextType | undefined>(() => (data ? { config: data } : undefined), [data]);
  const defaultPreferences = useMemo(
    () => ({ timezone: data?.frontend.default_user_preferences?.timezone ?? 'local' }),
    [data?.frontend.default_user_preferences?.timezone],
  );

  const timeRangeOptions = useMemo(
    () => data?.frontend.time_range?.options?.map((option: DurationString) => buildRelativeTimeOption(option)),
    [data?.frontend.time_range?.options],
  );

  const autoRefreshOptions = useMemo((): TimeOption[] => {
    const timeOptions = [...(data?.frontend.auto_refresh?.options ?? [])];

    /* preserve an explicit Off option while adding the configured positive intervals */
    if (!timeOptions.some((to) => milliseconds(parseDurationString(to)) === 0)) {
      timeOptions.push('0s');
    }

    /* ensure user input is sorted */
    timeOptions.sort((a, b) => milliseconds(parseDurationString(a)) - milliseconds(parseDurationString(b)));

    return timeOptions.map((option: DurationString) => {
      return {
        value: { pastDuration: option },
        display: milliseconds(parseDurationString(option)) === 0 ? 'Off' : option,
      };
    });
  }, [data?.frontend.auto_refresh?.options]);

  if (isLoading || data === undefined || contextValue === undefined) {
    return <PersesLoader />;
  }
  return (
    <ConfigContext.Provider value={contextValue}>
      <UserPreferencesContextProvider defaultPreferences={defaultPreferences}>
        <TimeRangeSettingsProvider
          showCustom={!data.frontend.time_range?.disable_custom}
          showZoomButtons={!data.frontend.time_range?.disable_zoom}
          disableAutoRefresh={!!data.frontend.auto_refresh?.disable}
          options={timeRangeOptions}
          autoRefreshIntervalOptions={autoRefreshOptions}
        >
          {props.children}
        </TimeRangeSettingsProvider>
      </UserPreferencesContextProvider>
    </ConfigContext.Provider>
  );
}

export function useConfigContext(): ConfigContextType {
  const ctx = useContext(ConfigContext);
  if (ctx === undefined) {
    throw new Error('No ConfigContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useIsGlobalDatasourceEnabled(): boolean {
  const { config } = useConfigContext();
  return !config.datasource.global.disable;
}

export function useIsProjectDatasourceEnabled(): boolean {
  const { config } = useConfigContext();
  return !config.datasource.project.disable;
}

export function useIsLocalDatasourceEnabled(): boolean {
  const { config } = useConfigContext();
  return !config.datasource.disable_local;
}

export function useIsGlobalVariableEnabled(): boolean {
  const { config } = useConfigContext();
  return !config.variable.global.disable;
}

export function useIsProjectVariableEnabled(): boolean {
  const { config } = useConfigContext();
  return !config.variable.project.disable;
}

export function useIsLocalVariableEnabled(): boolean {
  const { config } = useConfigContext();
  return !config.variable.disable_local;
}

export function useIsExplorerEnabled(): boolean {
  const { config } = useConfigContext();
  return config.frontend.explorer.enable;
}

export function useIsKeyboardShortcutsEnabled(): boolean {
  const { config } = useConfigContext();
  return config.frontend.enable_keyboard_shortcuts ?? true;
}

export function useDefaultRowsPerPage(): number {
  const { config } = useConfigContext();
  return config.frontend.default_user_preferences?.rows_per_page ?? 25;
}

export function useIsLockModeAvailable(): boolean {
  const { config } = useConfigContext();
  return config.frontend.enable_lock_mode ?? false;
}

export function useIsEphemeralDashboardEnabled(): boolean {
  const { config } = useConfigContext();
  return config.ephemeral_dashboard.enable;
}

export function useIsReadonly(): boolean {
  const { config } = useConfigContext();
  return config.security.readonly;
}

export function useIsAuthEnabled(): boolean {
  const { config } = useConfigContext();
  return config.security.enable_auth;
}

export function useIsSignUpDisable(): boolean {
  const { config } = useConfigContext();
  return config.security.authentication.disable_sign_up;
}

export function useHasImportantDashboards(): boolean {
  return useImportantDashboardGroups().some((group) => (group.dashboards?.length ?? 0) > 0);
}

export function useShouldNormalizeResourceNames(): boolean {
  const { config } = useConfigContext();
  return !config.database.file?.case_sensitive || !config.database.sql?.case_sensitive;
}

export function useImportantDashboardGroups(): ImportantDashboardGroupConfig[] {
  const { config } = useConfigContext();
  const shouldNormalizeResourceNames = useShouldNormalizeResourceNames();

  return useMemo(() => {
    return (config.frontend.important_dashboards ?? []).map((group) => {
      const dashboards = (group.dashboards ?? []).map((selector) => {
        if (!shouldNormalizeResourceNames) {
          return selector;
        }
        const normalizedSelector: ImportantDashboardSelectorConfig = {
          project: selector.project.toLowerCase(),
        };
        if (selector.dashboard !== undefined) {
          normalizedSelector.dashboard = selector.dashboard.toLowerCase();
        }
        return normalizedSelector;
      });

      return {
        title: group.title,
        description: group.description,
        dashboards,
      };
    });
  }, [config.frontend.important_dashboards, shouldNormalizeResourceNames]);
}

export function useImportantDashboardSelectors(): ImportantDashboardSelectorConfig[] {
  const importantDashboardGroups = useImportantDashboardGroups();

  return useMemo(() => {
    return importantDashboardGroups.flatMap((group) => group.dashboards ?? []);
  }, [importantDashboardGroups]);
}

export function useInformation(): string {
  const { config } = useConfigContext();

  const html = useMemo(
    () => marked.parse(config.frontend.information ?? '', { gfm: true, async: false }),
    [config.frontend.information],
  );
  return useMemo(() => DOMPurify.sanitize(html), [html]);
}

export function useBanner(): Banner | undefined {
  const { config } = useConfigContext();
  const bannerConfig = config.frontend.banner;

  const html = useMemo(
    () => marked.parse(bannerConfig?.message ?? '', { gfm: true, async: false }),
    [bannerConfig?.message],
  );

  const sanitizedHtml = useMemo(() => DOMPurify.sanitize(html), [html]);

  const banner = useMemo(() => {
    if (!bannerConfig?.message || !bannerConfig.severity) {
      return undefined;
    }
    return {
      severity: bannerConfig.severity,
      message: sanitizedHtml,
    };
  }, [bannerConfig, sanitizedHtml]);

  return banner;
}

export function useIsNativeAuthnProviderEnabled(): boolean {
  const { config } = useConfigContext();
  return config.security.authentication.providers.enable_native;
}

export function useIsExternalAuthnProviderEnabled(): boolean {
  const { config } = useConfigContext();
  return (
    !!config.security.authentication.providers.oidc?.length || !!config.security.authentication.providers.oauth?.length
  );
}

export function useIsDelegatedAuthnProviderEnabled(): boolean {
  const { config } = useConfigContext();
  return !!config.security.authentication.providers.kubernetes?.enable;
}
