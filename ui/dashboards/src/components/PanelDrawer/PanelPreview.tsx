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

import { useRef } from 'react';
import { Box } from '@mui/material';
import { QueryDefinition } from '@perses-dev/core';
import { DataQueriesProvider } from '@perses-dev/plugin-system';
import { PanelEditorValues } from '../../context';
import { Panel } from '../Panel';
import { useSuggestedStepMs } from '../../utils';

const PANEL_PREVIEW_HEIGHT = 300;
const PANEL_PREVIEW_DEFAULT_WIDTH = 840;

export function PanelPreview({ panelDefinition }: Pick<PanelEditorValues, 'panelDefinition'>) {
  const boxRef = useRef<HTMLDivElement>(null);
  let width = PANEL_PREVIEW_DEFAULT_WIDTH;
  if (boxRef.current !== null) {
    width = boxRef.current.getBoundingClientRect().width;
  }
  const suggestedStepMs = useSuggestedStepMs(width);

  if (panelDefinition.spec.plugin.kind === '') {
    return null;
  }

  const queries = panelDefinition.spec.queries ?? [];

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
    <Box ref={boxRef} height={PANEL_PREVIEW_HEIGHT}>
      <DataQueriesProvider definitions={definitions} options={{ suggestedStepMs }}>
        <Panel definition={panelDefinition} />
      </DataQueriesProvider>
    </Box>
  );
}
