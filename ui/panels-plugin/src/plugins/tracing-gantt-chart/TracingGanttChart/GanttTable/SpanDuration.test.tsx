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

import { render, RenderResult } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { ChartsProvider, testChartsTheme } from '@perses-dev/components';
import { MOCK_GANTT_TRACE } from '../../../../test';
import { GanttTableProvider } from './GanttTableProvider';
import { SpanDuration, SpanDurationProps } from './SpanDuration';

describe('SpanDuration', () => {
  const renderComponent = (props: SpanDurationProps): RenderResult => {
    return render(
      <ChartsProvider chartsTheme={testChartsTheme}>
        <GanttTableProvider>
          <SpanDuration {...props} />
        </GanttTableProvider>
      </ChartsProvider>
    );
  };

  it('render span bar', () => {
    renderComponent({
      options: {},
      span: MOCK_GANTT_TRACE.rootSpan.childSpans[0]!.childSpans[0]!,
      viewport: {
        startTimeUnixMs: MOCK_GANTT_TRACE.startTimeUnixMs,
        endTimeUnixMs: MOCK_GANTT_TRACE.endTimeUnixMs,
      },
    });
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(parseInt(screen.getByText('150ms').style.left)).toEqual(44); // 44%, on the right side of the span bar
    expect(screen.getByTestId('span-duration-bar').style.backgroundColor).toEqual('rgba(83, 83, 83, 0.9)');
  });

  it('render span bar duration on left side', () => {
    renderComponent({
      options: {},
      span: MOCK_GANTT_TRACE.rootSpan.childSpans[0]!.childSpans[0]!,
      viewport: {
        startTimeUnixMs: MOCK_GANTT_TRACE.startTimeUnixMs + 290,
        endTimeUnixMs: MOCK_GANTT_TRACE.startTimeUnixMs + 400,
      },
    });
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(parseInt(screen.getByText('150ms').style.left)).toEqual(9); // 9%, on the left side of the span bar
  });

  it('render span bar with colors from eCharts theme', () => {
    renderComponent({
      options: { visual: { palette: { mode: 'categorical' } } },
      span: MOCK_GANTT_TRACE.rootSpan.childSpans[0]!.childSpans[0]!,
      viewport: {
        startTimeUnixMs: MOCK_GANTT_TRACE.startTimeUnixMs,
        endTimeUnixMs: MOCK_GANTT_TRACE.endTimeUnixMs,
      },
    });
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByTestId('span-duration-bar').style.backgroundColor).toEqual('rgb(0, 114, 178)'); // #0072B2 from Perses color palette (theme-gen.ts)
  });
});
