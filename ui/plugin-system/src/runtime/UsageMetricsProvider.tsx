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

import { fetch, QueryDefinition } from '@perses-dev/core';
import { createContext, ReactElement, ReactNode, useContext } from 'react';

type QueryState = 'pending' | 'success' | 'error';

interface UsageMetrics {
  project: string;
  dashboard: string;
  startRenderTime: number;
  renderDurationMs: number;
  renderErrorCount: number;
  pendingQueries: Map<string, QueryState>;
}

interface UsageMetricsProps {
  project: string;
  dashboard: string;
  children: ReactNode;
}

interface UseUsageMetricsResults {
  markQuery: (definition: QueryDefinition, state: QueryState) => void;
}

export const UsageMetricsContext = createContext<UsageMetrics | undefined>(undefined);

export const useUsageMetricsContext = (): UsageMetrics | undefined => {
  return useContext(UsageMetricsContext);
};

export const useUsageMetrics = (): UseUsageMetricsResults => {
  const ctx = useUsageMetricsContext();

  return {
    markQuery: (definition: QueryDefinition, newState: QueryState): void => {
      if (ctx === undefined) {
        return;
      }

      const definitionKey = JSON.stringify(definition);
      if (ctx.pendingQueries.has(definitionKey) && newState === 'pending') {
        // Never allow transitions back to pending, to avoid re-sending stats on a re-render.
        return;
      }

      if (ctx.pendingQueries.get(definitionKey) !== newState) {
        ctx.pendingQueries.set(definitionKey, newState);
        if (newState === 'error') {
          ctx.renderErrorCount += 1;
        }

        const allDone = [...ctx.pendingQueries.values()].every((p) => p !== 'pending');
        if (ctx.renderDurationMs === 0 && allDone) {
          ctx.renderDurationMs = Date.now() - ctx.startRenderTime;
          submitMetrics(ctx);
        }
      }
    },
  };
};

const submitMetrics = async (stats: UsageMetrics): Promise<void> => {
  await fetch('/api/v1/view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project: stats.project,
      dashboard: stats.dashboard,
      render_time: stats.renderDurationMs / 1000,
      render_errors: stats.renderErrorCount,
    }),
  });
};

export const UsageMetricsProvider = ({ project, dashboard, children }: UsageMetricsProps): ReactElement => {
  const ctx = {
    project: project,
    dashboard: dashboard,
    renderErrorCount: 0,
    startRenderTime: Date.now(),
    renderDurationMs: 0,
    pendingQueries: new Map(),
  };

  return <UsageMetricsContext.Provider value={ctx}>{children}</UsageMetricsContext.Provider>;
};
