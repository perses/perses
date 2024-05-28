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

import { PanelProps } from '@perses-dev/plugin-system';
import { TracingGanttChartOptions } from './tracing-view-model';
import { store, history } from '../../utils/configure-store';
import { Provider } from 'react-redux'
import { Box } from '@mui/material';
import { HistoryProvider } from '../../utils/useHistory';
import { TracingGanttChartComponent } from './TracingGanttChartComponent';

export type TracingGanttChartPanelProps = PanelProps<TracingGanttChartOptions>;

export function TracingGanttChartPanel(props: TracingGanttChartPanelProps) {
  const { contentDimensions } = props;

  if (contentDimensions === undefined) return null;

  return (
    <Provider store={store}>
      <HistoryProvider history={history}>
        <Box
          width={contentDimensions.width}
          height={contentDimensions.height}
          style={{position: "absolute"}}
        >
          <TracingGanttChartComponent />
        </Box>
      </HistoryProvider>
    </Provider>
  );
}
