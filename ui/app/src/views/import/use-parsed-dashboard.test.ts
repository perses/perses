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

import { act, renderHook } from '@testing-library/react';

import type * as ParseDashboardModule from './parse-dashboard';
import { parseDashboard } from './parse-dashboard';
import { useParsedDashboard } from './use-parsed-dashboard';

vi.mock('./parse-dashboard', async (importOriginal) => {
  const original = await importOriginal<typeof ParseDashboardModule>();
  return { ...original, parseDashboard: vi.fn(original.parseDashboard) };
});

const parseDashboardMock = vi.mocked(parseDashboard);
const DEBOUNCE_MS = 100;

describe('useParsedDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    parseDashboardMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not parse again while the definition changes but the debounced value does not', () => {
    const { result, rerender } = renderHook(({ definition }) => useParsedDashboard(definition, DEBOUNCE_MS), {
      initialProps: { definition: '' },
    });
    expect(result.current).toEqual({ dashboard: undefined, isPending: false });
    expect(parseDashboardMock).toHaveBeenCalledTimes(1);

    // Simulate typing: each keystroke re-renders with a new definition before the delay elapses.
    for (const definition of ['p', 'pa', 'pan', 'pane', 'panel', 'panels: []']) {
      rerender({ definition });
      act(() => vi.advanceTimersByTime(DEBOUNCE_MS - 1));
      expect(result.current).toEqual({ dashboard: undefined, isPending: true });
    }
    expect(parseDashboardMock).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toEqual({ dashboard: { kind: 'grafana', data: { panels: [] } }, isPending: false });
    expect(parseDashboardMock).toHaveBeenCalledTimes(2);
    expect(parseDashboardMock).toHaveBeenLastCalledWith('panels: []');
  });

  it('does not parse again on re-renders with the same definition', () => {
    const { result, rerender } = renderHook(({ definition }) => useParsedDashboard(definition, DEBOUNCE_MS), {
      initialProps: { definition: 'panels: []' },
    });
    const { dashboard } = result.current;
    expect(parseDashboardMock).toHaveBeenCalledTimes(1);

    rerender({ definition: 'panels: []' });
    rerender({ definition: 'panels: []' });
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
    expect(parseDashboardMock).toHaveBeenCalledTimes(1);
    // The same object is returned, so that the flows can tell whether the dashboard changed.
    expect(result.current.dashboard).toBe(dashboard);
  });
});
