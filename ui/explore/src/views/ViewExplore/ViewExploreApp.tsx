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
import { ChartsProvider, useChartsTheme } from '@perses-dev/components';
import { PanelEditorValues } from '@perses-dev/dashboards';
import React from 'react';
import { PanelEditorForm } from '../../components/PanelEditor/PanelEditorForm';

export interface ViewAppProps {
  exploreTitleComponent?: React.ReactNode;
}

export function ViewExploreApp(props: ViewAppProps) {
  const { exploreTitleComponent } = props;

  const chartsTheme = useChartsTheme();
  const data: PanelEditorValues = {
    groupId: 0,
    panelDefinition: {
      kind: 'Panel',
      spec: {
        display: {
          name: '',
        },
        plugin: {
          kind: 'TimeSeriesChart',
          spec: {},
        },
        queries: [],
      },
    },
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ChartsProvider chartsTheme={chartsTheme} enablePinning={false}>
        <PanelEditorForm initialAction="update" initialValues={data} exploreTitleComponent={exploreTitleComponent} />
      </ChartsProvider>
    </Box>
  );
}
