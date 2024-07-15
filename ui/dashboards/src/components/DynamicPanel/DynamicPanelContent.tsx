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

import { PanelDefinition, UnknownSpec } from '@perses-dev/core';
import { PluginLoader } from '@perses-dev/plugin-runtime';

interface DynamicPanelContentProps {
  definition?: PanelDefinition<UnknownSpec>;
  contentDimensions?: { width: number; height: number };
}

export function DynamicPanelContent({ definition, contentDimensions }: DynamicPanelContentProps) {
  if (!definition?.spec.plugin.kind) {
    throw new Error('Missing plugin kind in panel definition');
  }

  return (
    <PluginLoader<DynamicPanelContentProps>
      plugin={{
        name: definition.spec.plugin.kind,
        moduleName: 'Chart',
      }}
      props={{ definition, contentDimensions }}
    />
  );
}
