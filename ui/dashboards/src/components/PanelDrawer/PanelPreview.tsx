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

import { Box } from '@mui/material';
import { PanelEditorValues } from '../../context/DashboardProvider/panel-editing';
import { Panel, PanelProps } from '../Panel';

export function PanelPreview({ name, description, kind, spec, groupIndex }: PanelEditorValues) {
  const previewValues: PanelProps = {
    definition: {
      kind: 'Panel',
      spec: {
        display: {
          name,
          description,
        },
        plugin: {
          kind,
          spec,
        },
      },
    },
    groupIndex,
    itemIndex: 0, // TODO: what should itemIndex be?
  };

  return (
    <Box height={300}>
      <Panel {...previewValues} />
    </Box>
  );
}
