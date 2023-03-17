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
import { useEditMode } from '../../context';
import { AddPanelButton } from '../AddPanelButton';
import { EditVariablesButton } from '../Variables';
import { EditButton } from '../EditButton';

export interface EmptyDashboardProps {
  /**
   * The title, which should be relatively short text.
   */
  title?: string;

  /**
   * Descriptive text, which can be a bit longer.
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
   * the default buttons will be displayed. Set to `false` to disable the default
   * buttons.
   */
  actions?: JSX.Element | boolean;

  /**
   * Handler for clicking the edit button when the dashboard is in "view" mode.
   * Required when using the default empty state.
   */
  onEditButtonClick?: () => void;
}

const DEFAULT_TITLE = "Let's get started";

const DEFAULT_DESCRIPTION = {
  edit: 'We currently support time series charts, gauge charts, stat charts and more!',
  view: 'This dashboard is currently empty. Get started by clicking the edit button.',
};

// Constants from specifics in designs to make the default messaging look good.
const CONTAINER_WIDTH = '450px';
const PRIMARY_CONTENT_WIDTH = '289px';

const COMMON_BUTTON_PROPS = {
  variant: 'outlined',
  color: 'secondary',
} as const;

type EmptyDashboardActionsProps = Pick<EmptyDashboardProps, 'actions' | 'onEditButtonClick'> & {
  isEditMode: boolean;
};

const EmptyDashboardActions = ({ actions, isEditMode, onEditButtonClick }: EmptyDashboardActionsProps) => {
  if (actions && typeof actions !== 'boolean') {
    // Custom actions
    return actions;
  }

  if (actions === false) {
    // Disable default actions
    return null;
  }

  if (isEditMode) {
    // Default edit mode actions
    return (
      <>
        <AddPanelButton variant="outlined" color="secondary" label="Add Panel" fullWidth />
        <EditVariablesButton variant="outlined" color="secondary" label="Add Variables" fullWidth />
      </>
    );
  }

  if (onEditButtonClick) {
    // Default view mode actions
    return <EditButton {...COMMON_BUTTON_PROPS} label="Edit Dashboard" onClick={onEditButtonClick} />;
  }

  return null;
};

/**
 * Communicate that a dashboard is empty and prompt the user to get started.
 */
export const EmptyDashboard = ({
  title = DEFAULT_TITLE,
  description,
  additionalText,
  actions,
  onEditButtonClick,
}: EmptyDashboardProps) => {
  const { isEditMode } = useEditMode();

  const defaultDescription = isEditMode ? DEFAULT_DESCRIPTION.edit : DEFAULT_DESCRIPTION.view;
  const actionsContent = (
    <EmptyDashboardActions actions={actions} onEditButtonClick={onEditButtonClick} isEditMode={isEditMode} />
  );

  return (
    <Box sx={{ width: CONTAINER_WIDTH, textAlign: 'center', margin: '0 auto' }}>
      <Box sx={{ width: PRIMARY_CONTENT_WIDTH, margin: '0 auto' }}>
        <Typography variant="h2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1">{description ?? defaultDescription}</Typography>
        {actionsContent && (
          <Box sx={{ display: 'flex', gap: 2, marginTop: 1, justifyContent: 'center' }}>{actionsContent}</Box>
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
