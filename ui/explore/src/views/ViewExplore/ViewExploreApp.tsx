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
import { ReactNode } from 'react';
import { ExploreManager } from '../../components/ExploreManager';
import { ExplorerManagerProvider } from '../../components/ExploreManager/ExplorerManagerProvider';

export interface ViewAppProps {
  exploreTitleComponent?: ReactNode;
}

export function ViewExploreApp(props: ViewAppProps) {
  const { exploreTitleComponent } = props;

  const chartsTheme = useChartsTheme();

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
        <ExplorerManagerProvider>
          <ExploreManager exploreTitleComponent={exploreTitleComponent} />
        </ExplorerManagerProvider>
      </ChartsProvider>
    </Box>
  );
}
