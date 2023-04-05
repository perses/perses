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

import { act, renderHook } from '@testing-library/react';
import { PanelDefinition, QueryDefinition, TimeSeriesQueryDefinition } from '@perses-dev/core';
import { usePanelEditor } from './usePanelEditor';

describe('usePanelEditor', () => {
  const initialQueries: TimeSeriesQueryDefinition[] = [
    {
      kind: 'TimeSeriesQuery',
      spec: {
        plugin: {
          kind: 'PrometheusTimeSeriesQuery',
          spec: {
            query: 'node_memory_MemFree_bytes{job="node",instance="$instance"}',
          },
        },
      },
    },
  ];

  const TEST_PANEL_DEFINITION: PanelDefinition = {
    kind: 'Panel',
    spec: {
      display: {
        name: 'Test Panel',
        description: '',
      },
      plugin: {
        kind: 'TimeSeriesChart',
        spec: {},
      },
      queries: initialQueries,
    },
  };

  describe('setQueries', () => {
    const queries: QueryDefinition[] = [
      {
        kind: 'TimeSeriesQuery',
        spec: {
          plugin: {
            kind: 'PrometheusTimeSeriesQuery',
            spec: {
              query: 'up',
            },
          },
        },
      },
    ];

    describe('if hideQueryEditor is false', () => {
      const { result } = renderHook(() => {
        return usePanelEditor(TEST_PANEL_DEFINITION);
      });

      it('should set queries if queries are defined', () => {
        act(() => {
          result.current.setQueries(queries);
        });

        expect(result.current.panelDefinition.spec.queries).toEqual(queries);
      });

      it('should set queries to previous queries if queries are undefined', () => {
        act(() => {
          result.current.setQueries(undefined);
        });
        expect(result.current.panelDefinition.spec.queries).toEqual(queries);
      });
    });

    describe('if hideQueryEditor is true', () => {
      it('should set queries to undefined', () => {
        const { result } = renderHook(() => {
          return usePanelEditor(TEST_PANEL_DEFINITION);
        });
        act(() => {
          result.current.setQueries(queries, true);
        });
        expect(result.current.panelDefinition.spec.queries).toEqual(undefined);
      });
    });
  });
});
