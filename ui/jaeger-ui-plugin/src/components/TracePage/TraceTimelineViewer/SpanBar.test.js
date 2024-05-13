// Copyright (c) 2017 Uber Technologies, Inc.
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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/';

import SpanBar from './SpanBar';

describe('<SpanBar>', () => {
  const shortLabel = 'omg-so-awesome';
  const longLabel = 'omg-awesome-long-label';

  const props = {
    longLabel,
    shortLabel,
    color: '#fff',
    hintSide: 'right',
    viewEnd: 1,
    viewStart: 0,
    getViewedBounds: s => {
      // Log entries
      if (s === 10) {
        return { start: 0.1, end: 0.1 };
      }
      if (s === 20) {
        return { start: 0.2, end: 0.2 };
      }
      return { error: 'error' };
    },
    rpc: {
      viewStart: 0.25,
      viewEnd: 0.75,
      color: '#000',
    },
    tracestartTime: 0,
    span: {
      logs: [
        {
          timestamp: 10,
          fields: [
            { key: 'message', value: 'oh the log message' },
            { key: 'something', value: 'else' },
          ],
        },
        {
          timestamp: 10,
          fields: [
            { key: 'message', value: 'oh the second log message' },
            { key: 'something', value: 'different' },
          ],
        },
        {
          timestamp: 20,
          fields: [
            { key: 'message', value: 'oh the next log message' },
            { key: 'more', value: 'stuff' },
          ],
        },
      ],
    },
  };

  it('renders without exploding', () => {
    render(<SpanBar {...props} />);
    const labelElm = screen.getByText(shortLabel);
    expect(labelElm).toBeInTheDocument();
    expect(screen.queryByText(longLabel)).toBeNull();
    fireEvent.mouseOver(labelElm);
    expect(screen.getByText(longLabel)).toBeInTheDocument();
    expect(screen.queryByText(shortLabel)).toBeNull();
    fireEvent.mouseOut(labelElm);
    expect(screen.getByText(shortLabel)).toBeInTheDocument();
    expect(screen.queryByText(longLabel)).toBeNull();
  });

  it('log markers count', () => {
    // 3 log entries, two grouped together with the same timestamp
    render(<SpanBar {...props} />);
    expect(screen.getAllByTestId('SpanBar--logMarker').length).toEqual(2);
  });

  it('Critical Path is rendered', () => {
    const newProps = {
      ...props,
      criticalPath: [
        {
          spanId: 'Test-SpanId',
          section_start: 10,
          section_end: 20,
        },
      ],
      getViewedBounds: () => ({ start: 0.1, end: 0.5 }),
    };
    const wrapper = render(<SpanBar {...newProps} />);
    expect(wrapper.getAllByTestId('SpanBar--criticalPath').length).toEqual(1);
  });
});
