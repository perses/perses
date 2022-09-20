// Copyright 2021 The Perses Authors
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
import { DashboardSpec } from '@perses-dev/core';
import { GridLayout, GridItemContent } from './GridLayout';

export interface DashboardProps extends BoxProps {
  spec: DashboardSpec;
}

/**
 * Renders a Dashboard for the provided Dashboard spec.
 */
export function Dashboard(props: DashboardProps) {
  const { spec, ...others } = props;

  return (
    <Box {...others}>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {spec.layouts.map((layout, idx) => (
          <GridLayout
            key={`${JSON.stringify(spec.layouts)} ${idx}`} // reset grid layout states when spec.layout changes
            groupIndex={idx}
            definition={layout}
            renderGridItemContent={(definition, groupIndex) => (
              <GridItemContent content={definition.content} spec={spec} groupIndex={groupIndex} />
            )}
          />
        ))}
      </ErrorBoundary>
    </Box>
  );
}
