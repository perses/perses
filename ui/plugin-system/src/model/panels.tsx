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

import { PanelDefinition } from '@perses-dev/core';
import { InitialOptionsCallback, OptionsEditor } from './visual-editing';

/**
 * Plugin the provides custom visualizations inside of a Panel.
 */
export interface PanelPlugin<Spec = unknown> {
  PanelComponent: React.ComponentType<PanelProps<Spec>>;
  OptionsEditorComponent: OptionsEditor<Spec>;
  createInitialOptions: InitialOptionsCallback<Spec>;
}

/**
 * The props provided by Perses to a panel plugin's PanelComponent.
 */
export interface PanelProps<Spec> {
  definition: PanelDefinition<Spec>;
  contentDimensions?: {
    width: number;
    height: number;
  };
}
