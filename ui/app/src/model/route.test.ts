// Copyright 2024 The Perses Authors
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

import { AdminRoute, extractBasePathName } from './route';

describe('extractBasePathName', () => {
  const testSuite = [
    {
      title: 'empty base path',
      path: '/',
      expectedBasePath: '',
    },
    {
      title: 'empty base path with prefix',
      path: '/foo',
      expectedBasePath: '/foo',
    },
    {
      title: 'regular path with no prefix',
      path: AdminRoute,
      expectedBasePath: '',
    },
    {
      title: 'regular admin path for datasources',
      path: '/admin/datasources',
      expectedBasePath: '',
    },
    {
      title: 'regular path with prefix',
      path: `/foo${AdminRoute}`,
      expectedBasePath: '/foo',
    },
    {
      title: 'regular dashboard path with no prefix',
      path: '/projects/perses/dashboards/dashboardA',
      expectedBasePath: '',
    },
    {
      title: 'regular dashboard path with prefix',
      path: '/foo/projects/perses/dashboards/dashboardA',
      expectedBasePath: '/foo',
    },
  ];
  testSuite.forEach(({ title, path, expectedBasePath }) => {
    it(title, () => {
      expect(extractBasePathName(path)).toEqual(expectedBasePath);
    });
  });
});
