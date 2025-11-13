// Copyright 2023 The Perses Authors
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

import { ReactElement, useMemo } from 'react';
import { VirtualizedSeries } from './VirtualizedSeries';
import { NearbySeriesArray } from './types';

export interface TooltipContentProps {
  series: NearbySeriesArray | null;
  wrapLabels?: boolean;
  // LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377]
  allowActions?: boolean;
  onSelected?: (seriesIdx: number) => void;
  // LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377]
}

export function TooltipContent(props: TooltipContentProps): ReactElement | null {
  const {
    series,
    wrapLabels,
    // LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377]
    onSelected,
    allowActions,
    // LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377]
  } = props;

  const sortedFocusedSeries = useMemo(() => {
    if (series === null) return null;
    return series.sort((a, b) => (a.y > b.y ? -1 : 1));
  }, [series]);

  if (series === null || sortedFocusedSeries === null) {
    return null;
  }
  // LOGZ.IO CHANGE START:: Performance optimization [APPZ-359]
  return (
    <VirtualizedSeries
      allowActions={allowActions}
      sortedFocusedSeries={sortedFocusedSeries}
      wrapLabels={wrapLabels}
      onSelected={onSelected}
    />
  );
  // LOGZ.IO CHANGE END:: Performance optimization [APPZ-359]
}
