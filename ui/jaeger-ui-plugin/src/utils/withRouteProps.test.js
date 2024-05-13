// Copyright (c) 2023 The Jaeger Authors.
//
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

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import withRouteProps from './withRouteProps';
import { useHistory, HistoryProvider } from './useHistory';

jest.mock('./useHistory', () => ({
  useHistory: jest.fn(),
  HistoryProvider: ({ children }) => <div>{children}</div>,
}));

describe('withRouteProps', () => {
  test('passes route props to WrappedComponent', () => {
    const mockHistory = {
      push: jest.fn(),
      replace: jest.fn(),
      location: { pathname: '/test', search: '?param=value' },
    };

    useHistory.mockReturnValue(mockHistory);

    const WrappedComponent = jest.fn(() => null);
    const ComponentWithRouteProps = withRouteProps(WrappedComponent);
    render(
      <HistoryProvider history={mockHistory}>
        <MemoryRouter initialEntries={['/test?param=value']}>
          <Route path="/test">
            <ComponentWithRouteProps />
          </Route>
        </MemoryRouter>
      </HistoryProvider>
    );

    expect(WrappedComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        location: expect.objectContaining({
          pathname: '/test',
          search: '?param=value',
        }),
        pathname: '/test',
        search: '?param=value',
        params: {},
        history: mockHistory,
      }),
      {}
    );
  });
});
