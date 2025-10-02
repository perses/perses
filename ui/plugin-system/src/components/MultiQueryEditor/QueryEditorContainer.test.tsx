// Copyright 2025 The Perses Authors
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

import { screen, cleanup } from '@testing-library/react';
import { QueryDefinition, QueryPluginType } from '@perses-dev/core';
import { renderWithContext } from '../../test';
import { QueryEditorContainer } from './QueryEditorContainer';

describe('QueryEditorContainer', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const querySpec = { query: 'any-fake-query', limit: 20, datasource: undefined };
  const renderingProps: Record<string, { queryTypes: string[]; value: object }> = {
    TimeSeriesQuery: {
      queryTypes: ['TimeSeriesQuery'],
      value: {
        kind: 'TimeSeriesQuery',
        spec: {
          plugin: {
            kind: 'PrometheusTimeSeriesQuery',
            spec: querySpec,
          },
        },
      },
    },
    TraceQuery: {
      queryTypes: ['TraceQuery'],
      value: {
        kind: 'TraceQuery',
        spec: {
          plugin: {
            kind: 'TempoTraceQuery',
            spec: querySpec,
          },
        },
      },
    },
  };

  Object.keys(renderingProps).forEach((key) => {
    it(`should render ${key} with run query button`, () => {
      renderWithContext(
        <QueryEditorContainer
          queryTypes={renderingProps[key]?.queryTypes as QueryPluginType[]}
          index={1}
          query={renderingProps[key]?.value as QueryDefinition}
          isCollapsed={false}
          onDelete={jest.fn()}
          onChange={jest.fn()}
          onCollapseExpand={jest.fn()}
        />
      );
      const runQuerybutton = screen.getByTestId('run_query_button');
      expect(runQuerybutton).toBeInTheDocument();
    });
  });
});
