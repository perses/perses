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

import { JSONSpecEditor } from '@perses-dev/components';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { StatChartOptions } from './stat-chart-model';

export type StatChartOptionsEditorProps = OptionsEditorProps<StatChartOptions>;

export function StatChartOptionsEditor(props: StatChartOptionsEditorProps) {
  // TODO: replace with form controls for visual editing
  return <JSONSpecEditor {...props} />;
}
