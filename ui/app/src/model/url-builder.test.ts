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

import buildURL from './url-builder';

describe('URLBuilderUtil', () => {
  const testSuite = [
    {
      title: 'if no params, should return no params in the uri',
      expectedURI: '/api/v1/test',
      parameter: {
        resource: 'test',
      },
    },
    {
      title: 'check if set project is considered',
      expectedURI: '/api/v1/projects/perses/test',
      parameter: {
        resource: 'test',
        project: 'perses',
      },
    },
    {
      title: 'complete test',
      expectedURI: '/api/v1/projects/perses/test/superName',
      parameter: {
        resource: 'test',
        project: 'perses',
        name: 'superName',
      },
    },
  ];

  testSuite.forEach(({ title, expectedURI, parameter }) => {
    it(title, () => {
      expect(buildURL(parameter)).toEqual(expectedURI);
    });
  });
});
