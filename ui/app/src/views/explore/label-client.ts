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

import { useTimeRange } from '@perses-dev/plugin-system';
import { useMemo } from 'react';

export interface LabelRequestParams {
  start: string;
  end: string;
}

export interface LabelResponse {
  data?: string[];
}

/** The label endpoints of the Loki datasource client. */
export interface LabelClient {
  labels: (params: LabelRequestParams) => Promise<LabelResponse>;
  labelValues: (params: LabelRequestParams & { labelName: string }) => Promise<LabelResponse>;
}

/** Time range of the label requests, following the explorer time range. */
export function useLabelRequestParams(): LabelRequestParams {
  const { absoluteTimeRange } = useTimeRange();
  return useMemo(
    () => ({ start: absoluteTimeRange.start.toISOString(), end: absoluteTimeRange.end.toISOString() }),
    [absoluteTimeRange],
  );
}
