// Copyright The Perses Authors
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

import { act, cleanup, render, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';

import type { PageTitleHandle } from './PageTitle';
import { PageTitle } from './PageTitle';

function TitleLayout(): JSX.Element {
  return (
    <>
      <PageTitle />
      <Outlet />
    </>
  );
}

function renderRouter(path: string, basename = '/'): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        Component: TitleLayout,
        children: [
          { index: true, element: null, handle: { title: 'Home' } satisfies PageTitleHandle },
          {
            path: 'sign-in',
            element: null,
            handle: { title: 'Sign In' } satisfies PageTitleHandle,
          },
          {
            path: 'admin',
            handle: { title: 'Administration' } satisfies PageTitleHandle,
            children: [{ path: ':tab', element: null }],
          },
          {
            path: 'projects/:projectName',
            handle: {
              title: ({ projectName }): string | undefined => projectName,
            } satisfies PageTitleHandle,
            children: [
              { index: true, element: null },
              {
                path: 'dashboards/:dashboardName',
                element: null,
                handle: {
                  title: ({ dashboardName }): string | undefined => dashboardName,
                } satisfies PageTitleHandle,
              },
              {
                path: 'dashboard/new',
                element: null,
                handle: { title: 'New Dashboard' } satisfies PageTitleHandle,
              },
            ],
          },
          { path: 'protected', element: <Navigate to="/sign-in" replace /> },
          { path: '*', element: null },
        ],
      },
    ],
    { initialEntries: [path], basename },
  );
  render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  return router;
}

afterEach(() => {
  cleanup();
  document.title = '';
});

it.each([
  ['/', 'Home | Perses'],
  ['/admin/users', 'Administration | Perses'],
  ['/projects/demo', 'demo | Perses'],
  ['/projects/demo/dashboards/overview', 'overview | demo | Perses'],
  ['/projects/demo/dashboard/new', 'New Dashboard | demo | Perses'],
  ['/projects/my%20project/dashboards/CPU%20%26%20Memory', 'CPU & Memory | my project | Perses'],
  ['/unknown', 'Perses'],
])('sets the title for %s', (path, title) => {
  renderRouter(path);
  expect(document.title).toBe(title);
});

it('updates titles when navigating between resources and using browser history', async () => {
  const router = renderRouter('/projects/demo/dashboards/overview');

  await act(() => router.navigate('/projects/production/dashboards/latency'));
  expect(document.title).toBe('latency | production | Perses');

  await act(() => router.navigate('/'));
  expect(document.title).toBe('Home | Perses');

  await act(() => router.navigate(-1));
  expect(document.title).toBe('latency | production | Perses');

  await act(() => router.navigate('/unknown'));
  expect(document.title).toBe('Perses');
});

it('uses the destination title after a redirect', async () => {
  renderRouter('/protected');
  await waitFor(() => expect(document.title).toBe('Sign In | Perses'));
});

it('supports an API prefix and ignores query parameters and hashes', () => {
  renderRouter('/perses/projects/demo/dashboards/overview?start=1h#panel', '/perses');
  expect(document.title).toBe('overview | demo | Perses');
});
