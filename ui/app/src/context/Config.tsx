// Copyright 2023 The Perses Authors
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

import React, { createContext, useContext, useMemo } from 'react';
import { marked } from 'marked';
import * as DOMPurify from 'dompurify';
import { CircularProgress, Stack } from '@mui/material';
import { ConfigModel, useConfig } from '../model/config-client';

interface ConfigContextType {
  config: ConfigModel;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigContextProvider(props: { children: React.ReactNode }) {
  const { data, isLoading } = useConfig();
  if (isLoading || data === undefined) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }
  return <ConfigContext.Provider value={{ config: data }}>{props.children}</ConfigContext.Provider>;
}

export function useConfigContext(): ConfigContextType {
  const ctx = useContext(ConfigContext);
  if (ctx === undefined) {
    throw new Error('No ConfigContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useIsReadonly() {
  const { config } = useConfigContext();
  return config.security.readonly;
}

export function useImportantDashboardSelectors() {
  const { config } = useConfigContext();
  return config.important_dashboards;
}

export function useInformation() {
  const { config } = useConfigContext();

  const html = useMemo(() => marked.parse(config.information, { gfm: true }), [config.information]);
  const sanitizedHTML = useMemo(() => DOMPurify.sanitize(html), [html]);

  return sanitizedHTML;
}
