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

import { Box } from '@mui/material';
import { QueryDefinition } from '@perses-dev/core';
import { DataQueriesProvider } from '@perses-dev/plugin-system';
import { PanelEditorValues } from '../../context';
import { Panel, PanelProps } from '../Panel';

const PANEL_PREVIEW_HEIGHT = 300;

export function PanelPreview({ name, description, kind, spec, queries }: PanelEditorValues) {
  const definition: PanelProps['definition'] = {
    kind: 'Panel',
    spec: {
      queries,
      display: {
        name,
        description: description === '' ? undefined : description,
      },
      plugin: {
        kind,
        spec,
      },
    },
  };

  if (kind === '') {
    return null;
  }

  // ex: markdown panel does not have a query
  if (!queries) {
    return (
      <Box height={PANEL_PREVIEW_HEIGHT}>
        <Panel definition={definition} />
      </Box>
    );
  }

  // map TimeSeriesQueryDefinition to Definition<UnknownSpec>
  const definitions = queries.length
    ? queries.map((query: QueryDefinition) => {
        return {
          kind: query.spec.plugin.kind,
          spec: query.spec.plugin.spec,
        };
      })
    : [];

  return (
    <Box height={PANEL_PREVIEW_HEIGHT}>
      <DataQueriesProvider definitions={definitions}>
        <Panel definition={definition} />
      </DataQueriesProvider>
    </Box>
  );
}
