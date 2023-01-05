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

import { Box, BoxProps } from '@mui/material';
import { ErrorBoundary, ErrorAlert } from '@perses-dev/components';
import { usePanelGroupIds } from '../../context';
import { GridLayout } from '../GridLayout';

export type DashboardProps = BoxProps;

/**
 * Renders a Dashboard for the provided Dashboard spec.
 */
export function Dashboard(props: DashboardProps) {
  const panelGroupIds = usePanelGroupIds();
  return (
    <Box {...props}>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {panelGroupIds.map((panelGroupId) => (
          <GridLayout key={panelGroupId} panelGroupId={panelGroupId} />
        ))}
      </ErrorBoundary>
    </Box>
  );
}
