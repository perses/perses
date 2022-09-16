// Copyright 2022 The Perses Authors
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

import { PanelPlugin } from '@perses-dev/plugin-system';
import { createInitialEmptyChartOptions, EmptyChartOptions } from './empty-chart-model';
import { EmptyChartOptionsEditor } from './EmptyChartOptionsEditor';
import { EmptyChartPanel } from './EmptyChartPanel';

/**
 * The core EmptyChart panel plugin for Perses.
 */
export const EmptyChart: PanelPlugin<EmptyChartOptions> = {
  PanelComponent: EmptyChartPanel,
  OptionsEditorComponent: EmptyChartOptionsEditor,
  createInitialOptions: createInitialEmptyChartOptions,
};
