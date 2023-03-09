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

import { Typography, Box } from '@mui/material';
import { AddPanelButton } from '../AddPanelButton';
import { EditVariablesButton } from '../Variables';

export interface EmptyDashboardProps {
  /**
   * The title for the empty state. This should be relatively short text.
   * If not specified, the default title will be used.
   */
  title?: string;

  /**
   * Descriptive text for the empty state. This can be longer text that gives the
   * user additional information.
   * If not specified, the default description will be used.
   */
  description?: string;

  /**
   * Additional text that will be displayed at the bottom of the empty state.
   * If not specified, no additional text is shown.
   */
  additionalText?: string;

  /**
   * Components that are placed below the title and description that include
   * actions for the user to take (e.g. buttons or links). If not specified,
   * the default "add panel" and "add variable" buttons will be displayed. Set
   * to `false` to disable the default buttons.
   */
  actions?: boolean | React.ReactNode;
}

const DEFAULT_TITLE = "Let's get started";
const DEFAULT_DESCRIPTION = 'We currently support time series charts, gauge charts, stat charts and more!';
const DEFAULT_ACTIONS = (
  <>
    <AddPanelButton variant="secondary" labelType="long" fullWidth={true} />
    <EditVariablesButton variant="secondary" labelType="long" fullWidth={true} />
  </>
);

// Constants from specifics in designs to make the default messaging look good.
const EMPTY_CONTAINER_WIDTH = '450px';
const PRIMARY_CONTENT_WIDTH = '289px';

/**
 * Communicate that a dashboard is empty and prompt the user to get started.
 */
export const EmptyDashboard = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  actions,
  additionalText,
}: EmptyDashboardProps) => {
  // Show actions if it is truthy or if it is undefined. This allows the
  // `undefined` case to fall back to the default while retaining the ability to
  // set `false` to disable the actions entirely.
  const showActions = !!actions || typeof actions === 'undefined';

  return (
    <Box sx={{ width: EMPTY_CONTAINER_WIDTH, textAlign: 'center', margin: '0 auto' }}>
      <Box sx={{ width: PRIMARY_CONTENT_WIDTH, margin: '0 auto' }}>
        <Typography variant="h2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1">{description}</Typography>
        {showActions && (
          <Box sx={{ display: 'flex', gap: 2, marginTop: 1, justifyContent: 'center' }}>
            {actions || DEFAULT_ACTIONS}
          </Box>
        )}
      </Box>
      {additionalText && (
        <Typography variant="subtitle1" sx={{ marginTop: 12 }}>
          {additionalText}
        </Typography>
      )}
    </Box>
  );
};
