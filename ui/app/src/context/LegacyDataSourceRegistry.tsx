// Copyright 2021 The Perses Authors
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

import { useMemo } from 'react';
import { LegacyDatasourcesContext, LegacyDatasources } from '@perses-dev/plugin-system';

export interface LegacyDataSourceRegistryProps {
  children: React.ReactNode;
}

/**
 * Makes DataSource resources available to children.
 */
export function LegacyDataSourceRegistry(props: LegacyDataSourceRegistryProps) {
  const { children } = props;

  // This is just temporarily hardcoded to keep the UI functioning while we work on immplementing the new spec
  const context: LegacyDatasources = useMemo(
    () => ({
      defaultDatasource: {
        spec: {
          kind: 'Prometheus',
          http: {
            url: 'https://prometheus.demo.do.prometheus.io',
          },
        },
      },
    }),
    []
  );

  return <LegacyDatasourcesContext.Provider value={context}>{children}</LegacyDatasourcesContext.Provider>;
}
