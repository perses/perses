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

import { renderHook } from '@testing-library/react';

import { useRedirectQueryParam } from './auth-client';

const { mockUseQueryParam, mockApiPrefix } = vi.hoisted(() => ({
  mockUseQueryParam: vi.fn(),
  mockApiPrefix: { current: '' },
}));

vi.mock('use-query-params', async (importOriginal) => ({
  ...(await importOriginal()),
  useQueryParam: mockUseQueryParam,
}));

vi.mock('../../config', () => ({
  get PERSES_APP_CONFIG(): { api_prefix: string } {
    return { api_prefix: mockApiPrefix.current };
  },
}));

describe('useRedirectQueryParam', () => {
  afterEach(() => {
    mockApiPrefix.current = '';
  });

  it('returns the rd query param when present, regardless of api_prefix or the absolute option', () => {
    mockApiPrefix.current = '/perses';
    mockUseQueryParam.mockReturnValue(['/dashboards/my-dashboard']);

    expect(renderHook(() => useRedirectQueryParam()).result.current).toEqual('/dashboards/my-dashboard');
    expect(renderHook(() => useRedirectQueryParam({ absolute: true })).result.current).toEqual(
      '/dashboards/my-dashboard',
    );
  });

  it('falls back to "/" by default when no rd query param is present, regardless of api_prefix', () => {
    mockApiPrefix.current = '/perses';
    mockUseQueryParam.mockReturnValue([undefined]);

    const { result } = renderHook(() => useRedirectQueryParam());

    expect(result.current).toEqual('/');
  });

  it('falls back to api_prefix when absolute is true, no rd query param is present, and api_prefix is set', () => {
    mockApiPrefix.current = '/perses';
    mockUseQueryParam.mockReturnValue([undefined]);

    const { result } = renderHook(() => useRedirectQueryParam({ absolute: true }));

    expect(result.current).toEqual('/perses');
  });

  it('falls back to "/" when absolute is true, no rd query param is present, and api_prefix is empty', () => {
    mockApiPrefix.current = '';
    mockUseQueryParam.mockReturnValue([undefined]);

    const { result } = renderHook(() => useRedirectQueryParam({ absolute: true }));

    expect(result.current).toEqual('/');
  });
});
