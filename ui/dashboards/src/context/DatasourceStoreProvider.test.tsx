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

import { renderHook, waitFor } from '@testing-library/react';
import {
  DatasourcePlugin,
  DatasourceSelectItemGroup,
  MockPlugin,
  mockPluginRegistry,
  PluginRegistry,
  useListDatasourceSelectItems,
} from '@perses-dev/plugin-system';
import { DatasourceStoreProvider } from '@perses-dev/dashboards';
import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DashboardResource,
  DashboardSpec,
  Datasource,
  DatasourceSpec,
  GlobalDatasource,
  ProjectDatasource,
} from '@perses-dev/core';

const PROJECT = 'perses';
const FAKE_PLUGIN_KIND = 'FakeDatasourcePluginKind';

const FakeDataSourcePlugin: DatasourcePlugin = {
  createClient: jest.fn().mockReturnValue(undefined),
  OptionsEditorComponent: () => {
    return <div>Edit options here</div>;
  },
  createInitialOptions: () => ({ direct_url: '' }),
};

const MOCK_DS_PLUGIN: MockPlugin = {
  pluginType: 'Datasource',
  kind: FAKE_PLUGIN_KIND,
  plugin: FakeDataSourcePlugin,
};

interface TestData {
  input: {
    // datasources input. Considered empty if not defined
    datasources: {
      local: Record<string, DatasourceSpec | undefined>; // `| undefined` is to make jest accept the type as parametrizable
      project: Datasource[];
      global: Datasource[];
    };
  };
  expected: {
    result: DatasourceSelectItemGroup[];
  };
}

function definedInDashboard(props: { default: boolean }): DatasourceSpec {
  return { default: props.default, plugin: { kind: FAKE_PLUGIN_KIND, spec: {} } };
}

function definedInProject(props: { name: string; default: boolean }): ProjectDatasource {
  return {
    kind: 'Datasource',
    metadata: { name: props.name, project: PROJECT },
    spec: { default: props.default, plugin: { kind: FAKE_PLUGIN_KIND, spec: {} } },
  };
}

function definedGlobally(props: { name: string; default: boolean }): GlobalDatasource {
  return {
    kind: 'GlobalDatasource',
    metadata: { name: props.name },
    spec: { default: props.default, plugin: { kind: FAKE_PLUGIN_KIND, spec: {} } },
  };
}

describe('DatasourceStoreProvider::useListDatasourceSelectItems', () => {
  test.each([
    {
      title: 'should return [] if no datasources',
      input: {
        datasources: {
          local: {},
          project: [],
          global: [],
        },
      },
      expected: {
        result: [],
      },
    },
    {
      title: 'datasources from different groups with different names',
      input: {
        datasources: {
          local: {
            localDatasourceA: definedInDashboard({ default: false }),
          },
          project: [definedInProject({ name: 'projectDatasourceA', default: false })],
          global: [definedGlobally({ name: 'globalDatasourceA', default: false })],
        },
      },
      expected: {
        result: [
          {
            editLink: undefined,
            group: `Default Datasource Plugin for ${FAKE_PLUGIN_KIND}`,
            items: [
              {
                name: 'Default (localDatasourceA from dashboard)',
                selector: {
                  kind: FAKE_PLUGIN_KIND,
                },
              },
            ],
          },
          {
            editLink: undefined,
            group: 'dashboard',
            items: [
              {
                name: 'localDatasourceA',
                overridden: false,
                selector: {
                  group: 'dashboard',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'localDatasourceA',
                },
              },
            ],
          },
          {
            editLink: '/projects/perses/datasources',
            group: 'project',
            items: [
              {
                name: 'projectDatasourceA',
                overridden: false,
                selector: {
                  group: 'project',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'projectDatasourceA',
                },
              },
            ],
          },
          {
            editLink: '/admin/datasources',
            group: 'global',
            items: [
              {
                name: 'globalDatasourceA',
                overridden: false,
                selector: {
                  group: 'global',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'globalDatasourceA',
                },
              },
            ],
          },
        ],
      },
    },
    {
      title: 'default datasource',
      input: {
        datasources: {
          local: {},
          project: [],
          global: [definedGlobally({ name: 'datasourceA', default: true })],
        },
      },
      expected: {
        result: [
          {
            editLink: undefined,
            group: `Default Datasource Plugin for ${FAKE_PLUGIN_KIND}`,
            items: [
              {
                name: 'Default (datasourceA from global)',
                selector: {
                  kind: FAKE_PLUGIN_KIND,
                },
              },
            ],
          },
          {
            editLink: '/admin/datasources',
            group: 'global',
            items: [
              {
                name: 'datasourceA',
                overridden: false,
                selector: {
                  group: 'global',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'datasourceA',
                },
              },
            ],
          },
        ],
      },
    },
    {
      title: 'only one datasource can be default (local has precedence)',
      input: {
        datasources: {
          local: {
            ['localDatasourceA']: definedInDashboard({ default: true }),
          },
          project: [definedInProject({ name: 'projectDatasourceA', default: true })],
          global: [definedGlobally({ name: 'globalDatasourceA', default: true })],
        },
      },
      expected: {
        result: [
          {
            editLink: undefined,
            group: `Default Datasource Plugin for ${FAKE_PLUGIN_KIND}`,
            items: [
              {
                name: 'Default (localDatasourceA from dashboard)',
                selector: {
                  kind: FAKE_PLUGIN_KIND,
                },
              },
            ],
          },
          {
            editLink: undefined,
            group: 'dashboard',
            items: [
              {
                name: 'localDatasourceA',
                overridden: false,
                selector: {
                  group: 'dashboard',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'localDatasourceA',
                },
              },
            ],
          },
          {
            editLink: '/projects/perses/datasources',
            group: 'project',
            items: [
              {
                name: 'projectDatasourceA',
                overridden: false,
                selector: {
                  group: 'project',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'projectDatasourceA',
                },
              },
            ],
          },
          {
            editLink: '/admin/datasources',
            group: 'global',
            items: [
              {
                name: 'globalDatasourceA',
                overridden: false,
                selector: {
                  group: 'global',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'globalDatasourceA',
                },
              },
            ],
          },
        ],
      },
    },
    {
      title: 'overridden datasources cannot be set as default',
      input: {
        datasources: {
          local: {},
          project: [definedInProject({ name: 'datasourceA', default: false })],
          global: [definedGlobally({ name: 'datasourceA', default: true })],
        },
      },
      expected: {
        result: [
          {
            editLink: undefined,
            group: `Default Datasource Plugin for ${FAKE_PLUGIN_KIND}`,
            items: [
              {
                // This is the default datasource because first of the list
                name: 'Default (datasourceA from project)',
                selector: {
                  kind: FAKE_PLUGIN_KIND,
                },
              },
            ],
          },
          {
            editLink: '/projects/perses/datasources',
            group: 'project',
            items: [
              {
                name: 'datasourceA',
                overridden: false,
                overriding: true,
                selector: {
                  group: 'project',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'datasourceA',
                },
              },
            ],
          },
          {
            editLink: '/admin/datasources',
            group: 'global',
            items: [
              {
                name: 'datasourceA',
                overridden: true,
                overriding: true, // Oddity coming from the algorithm. Not harmful as overriding is not checked if overridden is true
                selector: {
                  group: 'global',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'datasourceA',
                },
              },
            ],
          },
        ],
      },
    },
    {
      title: 'complex case with several overrides and a default coming from global',
      input: {
        datasources: {
          local: {
            ['datasourceA']: definedInDashboard({ default: false }),
          },
          project: [definedInProject({ name: 'datasourceB', default: false })],
          global: [
            definedGlobally({ name: 'defaultDatasource', default: true }),
            definedGlobally({ name: 'datasourceB', default: false }),
            definedGlobally({ name: 'datasourceA', default: false }),
          ],
        },
      },
      expected: {
        result: [
          {
            group: `Default Datasource Plugin for ${FAKE_PLUGIN_KIND}`,
            items: [
              {
                name: 'Default (defaultDatasource from global)',
                selector: {
                  kind: FAKE_PLUGIN_KIND,
                },
              },
            ],
          },
          {
            editLink: undefined,
            group: 'dashboard',
            items: [
              {
                name: 'datasourceA',
                overridden: false,
                overriding: true,
                selector: {
                  group: 'dashboard',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'datasourceA',
                },
              },
            ],
          },
          {
            editLink: '/projects/perses/datasources',
            group: 'project',
            items: [
              {
                name: 'datasourceB',
                overridden: false,
                overriding: true,
                selector: {
                  group: 'project',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'datasourceB',
                },
              },
            ],
          },
          {
            editLink: '/admin/datasources',
            group: 'global',
            items: [
              {
                name: 'defaultDatasource',
                overridden: false,
                selector: {
                  group: 'global',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'defaultDatasource',
                },
              },
              {
                name: 'datasourceB',
                overridden: true,
                overriding: true, // Oddity coming from the algorithm. Not harmful as overriding is not checked if overridden is true
                selector: {
                  group: 'global',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'datasourceB',
                },
              },
              {
                name: 'datasourceA',
                overridden: true,
                overriding: true, // Oddity coming from the algorithm. Not harmful as overriding is not checked if overridden is true
                selector: {
                  group: 'global',
                  kind: FAKE_PLUGIN_KIND,
                  name: 'datasourceA',
                },
              },
            ],
          },
        ],
      },
    },
  ])('$title', async (data: TestData) => {
    const datasourceApiMock = {
      buildProxyUrl: jest.fn().mockReturnValue(''),
      getDatasource: jest.fn().mockReturnValue(Promise.resolve([])),
      getGlobalDatasource: jest.fn().mockReturnValue(Promise.resolve([])),
      listDatasources: jest.fn().mockReturnValue(Promise.resolve(data.input.datasources.project)),
      listGlobalDatasources: jest.fn().mockReturnValue(Promise.resolve(data.input.datasources.global)),
    };
    const queryClient = new QueryClient();
    const dashboard = {
      spec: { datasources: data.input.datasources.local } as Partial<DashboardSpec>,
    } as DashboardResource;
    const wrapper = ({ children }: PropsWithChildren) => {
      return (
        <PluginRegistry {...mockPluginRegistry(MOCK_DS_PLUGIN)}>
          <QueryClientProvider client={queryClient}>
            <DatasourceStoreProvider
              dashboardResource={dashboard}
              projectName={PROJECT}
              datasourceApi={datasourceApiMock}
            >
              {children}
            </DatasourceStoreProvider>
          </QueryClientProvider>
        </PluginRegistry>
      );
    };
    const { result } = renderHook(() => useListDatasourceSelectItems(FAKE_PLUGIN_KIND), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual(data.expected.result);
  });
});
