// Copyright 2024 The Perses Authors
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

import React, { createContext, ReactElement, useContext, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { DashboardSelector, DurationString } from '@perses-dev/core';
import { TimeRangeSettingsProvider } from '@perses-dev/plugin-system';
import { buildRelativeTimeOption } from '@perses-dev/components';
import { ConfigModel, useConfig } from '../model/config-client';
import { PersesLoader } from '../components/PersesLoader';

interface ConfigContextType {
  config: ConfigModel;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigContextProvider(props: { children: React.ReactNode }): ReactElement {
  const { data, isLoading } = useConfig();
  if (isLoading || data === undefined) {
    return <PersesLoader />;
  }
  return (
    <ConfigContext.Provider value={{ config: data }}>
      <TimeRangeSettingsProvider
        showCustom={!data.frontend.time_range.disable_custom}
        options={data.frontend.time_range.options?.map((opt: DurationString) => buildRelativeTimeOption(opt))}
      >
        {props.children}
      </TimeRangeSettingsProvider>
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

export function useImportantDashboardSelectors(): DashboardSelector[] {
  const { config } = useConfigContext();
  return useMemo(() => {
    if (!config.database.file?.case_sensitive || !config.database.sql?.case_sensitive) {
      return (config.frontend.important_dashboards ?? []).map((selector) => {
        return {
          project: selector.project.toLowerCase(),
          dashboard: selector.dashboard.toLowerCase(),
        };
      });
    }
    return config.frontend.important_dashboards ?? [];
  }, [config.database.file?.case_sensitive, config.database.sql?.case_sensitive, config.frontend.important_dashboards]);
}

export function useInformation(): string {
  const { config } = useConfigContext();

  const html = useMemo(
    () => marked.parse(config.frontend.information ?? '', { gfm: true, async: false }),
    [config.frontend.information]
  );
  return useMemo(() => DOMPurify.sanitize(html), [html]);
}

export function useIsNativeProviderEnabled(): boolean {
  const { config } = useConfigContext();
  return config.security.authentication.providers.enable_native;
}

export function useIsExternalProviderEnabled(): boolean {
  const { config } = useConfigContext();
  return (
    !!config.security.authentication.providers.oidc?.length || !!config.security.authentication.providers.oauth?.length
  );
}
