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

import { useState } from 'react';
import { Button, ButtonProps } from '@mui/material';
import { DashboardResource, isRelativeTimeRange } from '@perses-dev/core';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useDashboard, useEditMode, useSaveChangesConfirmationDialog, useTemplateVariableActions } from '../../context';

export interface SaveDashboardButtonProps extends Pick<ButtonProps, 'fullWidth'> {
  onSave?: (entity: DashboardResource) => Promise<DashboardResource>;
  isReadonly: boolean;
  variant?: 'contained' | 'text' | 'outlined';
}

export const SaveDashboardButton = ({ onSave, isReadonly, variant = 'contained' }: SaveDashboardButtonProps) => {
  const [isSavingDashboard, setSavingDashboard] = useState<boolean>(false);
  const { dashboard } = useDashboard();
  const { setVariableDefaultValues } = useTemplateVariableActions();
  const { timeRange } = useTimeRange();
  const { setEditMode } = useEditMode();
  const { openSaveChangesConfirmationDialog, closeSaveChangesConfirmationDialog } = useSaveChangesConfirmationDialog();

  const onSaveButtonClick = () => {
    const isSelectedVariablesUpdated = true;
    setVariableDefaultValues();

    const isTimeRangeUpdated = isRelativeTimeRange(timeRange) && dashboard.spec.duration !== timeRange.pastDuration;

    // Save dashboard if active timeRange from plugin-system is relative and different than currently saved
    if (isTimeRangeUpdated || isSelectedVariablesUpdated) {
      openSaveChangesConfirmationDialog({
        onSaveChanges: (variableDefinitions, saveDefaultTimeRange, saveDefaultVariables) => {
          if (isRelativeTimeRange(timeRange) && saveDefaultTimeRange === true) {
            dashboard.spec.duration = timeRange.pastDuration;
          }
          if (saveDefaultVariables === true) {
            dashboard.spec.variables = variableDefinitions;
          }
          saveDashboard();
        },
        onCancel: () => {
          closeSaveChangesConfirmationDialog();
        },
      });
    } else {
      saveDashboard();
    }
  };

  const saveDashboard = () => {
    if (onSave !== undefined) {
      setSavingDashboard(true);
      onSave(dashboard)
        .then(() => {
          setSavingDashboard(false);
          closeSaveChangesConfirmationDialog();
          setEditMode(false);
        })
        .catch(() => {
          setSavingDashboard(false);
        });
    } else {
      setEditMode(false);
    }
  };

  return (
    <Button variant={variant} onClick={onSaveButtonClick} disabled={isReadonly || isSavingDashboard}>
      Save
    </Button>
  );
};
