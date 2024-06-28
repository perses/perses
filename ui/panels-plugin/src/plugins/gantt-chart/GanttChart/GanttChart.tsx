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

import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { Span } from '@perses-dev/core';
import { MiniGanttChart } from './MiniGanttChart/MiniGanttChart';
import { DetailPane } from './DetailPane/DetailPane';
import { Viewport } from './utils';
import { GanttTable } from './GanttTable/GanttTable';
import { GanttTableProvider } from './GanttTable/GanttTableProvider';

export interface GanttChart {
  rootSpan: Span;
}

/**
 * The core GanttChart panel for Perses.
 *
 * The UI/UX of this panel is based on Jaeger UI, licensed under Apache License, Version 2.0.
 * https://github.com/jaegertracing/jaeger-ui
 */
export function GanttChart(props: GanttChart) {
  const { rootSpan } = props;

  const [selectedSpan, setSelectedSpan] = useState<Span | undefined>(undefined);
  const [viewport, setViewport] = useState<Viewport>({
    startTimeUnixMs: rootSpan.startTimeUnixMs,
    endTimeUnixMs: rootSpan.endTimeUnixMs,
  });

  return (
    <Stack direction="row" sx={{ height: '100%', minHeight: '240px', gap: 2 }}>
      <Stack sx={{ flexGrow: 1 }}>
        <MiniGanttChart rootSpan={rootSpan} viewport={viewport} setViewport={setViewport} />
        <GanttTableProvider>
          <GanttTable rootSpan={rootSpan} viewport={viewport} onSpanClick={setSelectedSpan} />
        </GanttTableProvider>
      </Stack>
      {selectedSpan && (
        <Box sx={{ width: '280px', overflow: 'auto' }}>
          <DetailPane rootSpan={rootSpan} span={selectedSpan} onCloseBtnClick={() => setSelectedSpan(undefined)} />
        </Box>
      )}
    </Stack>
  );
}
