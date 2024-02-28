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

import { HTTPDatasourceAPI } from './datasource-api';

interface TestData {
  input: {
    project?: string;
    dashboard?: string;
    name?: string;
  };
  expected: string;
}

describe('buildProxyUrl', () => {
  test.each([
    {
      title: 'should build global datasource proxy url',
      input: { name: 'datasourceA' },
      expected: '/proxy/globaldatasources/datasourceA',
    },
    {
      title: 'should build project datasource proxy url',
      input: { project: 'projectA', name: 'datasourceA' },
      expected: '/proxy/projects/projectA/datasources/datasourceA',
    },
    {
      title: 'should build dashboard datasource proxy url',
      input: { project: 'projectA', dashboard: 'dashboardA', name: 'datasourceA' },
      expected: '/proxy/projects/projectA/dashboards/dashboardA/datasources/datasourceA',
    },
    {
      title: 'should build unsaved global datasource proxy url',
      input: {},
      expected: '/proxy/unsaved/globaldatasources',
    },
    {
      title: 'should build unsaved project datasource proxy url',
      input: { project: 'projectA' },
      expected: '/proxy/unsaved/projects/projectA/datasources',
    },
    {
      title: 'should build unsaved dashboard datasource proxy url',
      input: { project: 'projectA', dashboard: 'dashboardA' },
      expected: '/proxy/unsaved/projects/projectA/dashboards/dashboardA/datasources',
    },
  ])('$title', (data: TestData) => {
    expect(new HTTPDatasourceAPI().buildProxyUrl(data.input)).toEqual(data.expected);
  });
});
