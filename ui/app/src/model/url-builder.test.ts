// Copyright 2022 The Perses Authors
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

import buildURL from './url-builder';

describe('buildURL', () => {
  const testSuite = [
    {
      title: 'if no params, should return no params in the uri',
      expectedURI: '/api/v1/test',
      parameters: {
        resource: 'test',
      },
    },
    {
      title: 'check if set project is considered',
      expectedURI: '/api/v1/projects/perses/test',
      parameters: {
        resource: 'test',
        project: 'perses',
      },
    },
    {
      title: 'complete test',
      expectedURI: '/api/v1/projects/perses/test/superName',
      parameters: {
        resource: 'test',
        project: 'perses',
        name: 'superName',
      },
    },
    {
      title: 'a french project name',
      expectedURI: '/api/v1/projects/%C3%A7a%20marche',
      parameters: {
        resource: 'projects',
        name: 'ça marche',
      },
    },
    {
      title: 'a french project and a french resource name',
      expectedURI: '/api/v1/projects/%C3%A7a%20marche/dashboards/h%C3%B4pital',
      parameters: {
        resource: 'dashboards',
        project: 'ça marche',
        name: 'hôpital',
      },
    },
    {
      title: 'url with query parameters',
      expectedURI: '/api/v1/globaldatasources?kind=PrometheusDatasource&name=Demo',
      parameters: {
        resource: 'globaldatasources',
        queryParams: {
          kind: 'PrometheusDatasource',
          name: 'Demo',
        },
      },
    },
  ];

  testSuite.forEach(({ title, expectedURI, parameters }) => {
    it(title, () => {
      expect(buildURL(parameters)).toEqual(expectedURI);
    });
  });
});
