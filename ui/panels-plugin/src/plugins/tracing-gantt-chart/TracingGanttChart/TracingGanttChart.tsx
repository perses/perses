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

import { ReactElement, useMemo, useRef, useState } from 'react';
import { Box, Stack, useTheme } from '@mui/material';
import { Span, Trace } from '@perses-dev/core';
import { TracingGanttChartOptions } from '../gantt-chart-model';
import { MiniGanttChart } from './MiniGanttChart/MiniGanttChart';
import { DetailPane } from './DetailPane/DetailPane';
import { Viewport } from './utils';
import { GanttTable } from './GanttTable/GanttTable';
import { GanttTableProvider } from './GanttTable/GanttTableProvider';
import { ResizableDivider } from './GanttTable/ResizableDivider';
import { AttributeLinks } from './DetailPane/Attributes';
import { getTraceModel } from './trace';

export interface TracingGanttChartProps {
  options: TracingGanttChartOptions;
  attributeLinks?: AttributeLinks;
  trace: Trace;
}

/**
 * The core GanttChart panel for Perses.
 *
 * The UI/UX of this panel is based on Jaeger UI, licensed under Apache License, Version 2.0.
 * https://github.com/jaegertracing/jaeger-ui
 */
export function TracingGanttChart(props: TracingGanttChartProps): ReactElement {
  const { options, attributeLinks, trace: coreTrace } = props;

  const theme = useTheme();
  const trace = useMemo(() => {
    // calculate (and memoize) common properties, for example start and end time of the trace
    return getTraceModel(coreTrace);
  }, [coreTrace]);
  const [viewport, setViewport] = useState<Viewport>({
    startTimeUnixMs: trace.startTimeUnixMs,
    endTimeUnixMs: trace.endTimeUnixMs,
  });
  const [selectedSpan, setSelectedSpan] = useState<Span | undefined>(undefined);

  const ganttChart = useRef<HTMLDivElement>(null);
  // tableWidth only comes to effect if the detail pane is visible.
  // setTableWidth() is only called by <ResizableDivider />
  const [tableWidth, setTableWidth] = useState<number>(0.82);
  const gap = 2;

  return (
    <Stack ref={ganttChart} direction="row" sx={{ height: '100%', minHeight: '240px', gap }}>
      <Stack sx={{ flexGrow: 1, gap }}>
        <MiniGanttChart options={options} trace={trace} viewport={viewport} setViewport={setViewport} />
        <GanttTableProvider>
          <GanttTable
            options={options}
            trace={trace}
            viewport={viewport}
            selectedSpan={selectedSpan}
            onSpanClick={setSelectedSpan}
          />
        </GanttTableProvider>
      </Stack>
      {selectedSpan && (
        <>
          <ResizableDivider parentRef={ganttChart} spacing={parseInt(theme.spacing(gap))} onMove={setTableWidth} />
          <Box sx={{ width: `${(1 - tableWidth) * 100}%`, overflow: 'auto' }}>
            <DetailPane
              attributeLinks={attributeLinks}
              trace={trace}
              span={selectedSpan}
              onCloseBtnClick={() => setSelectedSpan(undefined)}
            />
          </Box>
        </>
      )}
    </Stack>
  );
}
