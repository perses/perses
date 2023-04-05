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
