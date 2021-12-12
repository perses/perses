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

import { usePlotContext } from '../UPlotContext';
import { useGraphCursorPosition, useOverlappingSeries } from './graph-cursor';
import TooltipContent from './TooltipContent';

/**
 * Listens for update to current Cursor position and renders a Tooltip with the relevant data
 */
function TooltipPlugin() {
  const { data, getSeries } = usePlotContext();
  const cursor = useGraphCursorPosition();
  const focusedSeries = useOverlappingSeries(cursor, getSeries(), data);

  if (!cursor) {
    return null;
  }

  const { focusedSeriesIdx, focusedPointIdx, coords } = cursor;
  if (!focusedPointIdx || !focusedSeriesIdx) {
    return null;
  }

  const x = data[0][focusedPointIdx] ?? 0;
  return <TooltipContent top={coords.plotCanvas.y} left={coords.plotCanvas.x} x={x} focusedSeries={focusedSeries} />;
}

export default TooltipPlugin;
