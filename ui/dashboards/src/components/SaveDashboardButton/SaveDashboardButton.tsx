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
import { isRelativeTimeRange } from '@perses-dev/core';
import { useTimeRange } from '@perses-dev/plugin-system';
import {
  OnSaveDashboard,
  useDashboard,
  useEditMode,
  useSaveChangesConfirmationDialog,
  useTemplateVariableActions,
} from '../../context';

export interface SaveDashboardButtonProps extends Pick<ButtonProps, 'fullWidth'> {
  onSave?: OnSaveDashboard;
  isDisabled: boolean;
  variant?: 'contained' | 'text' | 'outlined';
}

export const SaveDashboardButton = ({ onSave, isDisabled, variant = 'contained' }: SaveDashboardButtonProps) => {
  const [isSavingDashboard, setSavingDashboard] = useState<boolean>(false);
  const { dashboard, setDashboard } = useDashboard();
  const { getSavedVariablesStatus, setVariableDefaultValues } = useTemplateVariableActions();
  const { isSavedVariableModified } = getSavedVariablesStatus();
  const { timeRange } = useTimeRange();
  const { setEditMode } = useEditMode();
  const { openSaveChangesConfirmationDialog, closeSaveChangesConfirmationDialog } = useSaveChangesConfirmationDialog();

  const onSaveButtonClick = () => {
    const isSavedDurationModified =
      isRelativeTimeRange(timeRange) && dashboard.spec.duration !== timeRange.pastDuration;

    // Save dashboard if active timeRange from plugin-system is relative and different than currently saved
    if (isSavedDurationModified || isSavedVariableModified) {
      openSaveChangesConfirmationDialog({
        onSaveChanges: (saveDefaultTimeRange, saveDefaultVariables) => {
          if (isRelativeTimeRange(timeRange) && saveDefaultTimeRange === true) {
            dashboard.spec.duration = timeRange.pastDuration;
          }
          if (saveDefaultVariables === true) {
            const variables = setVariableDefaultValues();
            dashboard.spec.variables = variables;
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

  const saveDashboard = async () => {
    if (onSave) {
      try {
        setSavingDashboard(true);
        await onSave(dashboard);
        setSavingDashboard(false);
        closeSaveChangesConfirmationDialog();
        setEditMode(false);
        setDashboard(dashboard);
      } catch (error) {
        setSavingDashboard(false);
        throw new Error(`An error occurred while saving the dashboard. ${error}`);
      }
    } else {
      setEditMode(false);
    }
  };

  return (
    <Button variant={variant} onClick={onSaveButtonClick} disabled={isDisabled || isSavingDashboard}>
      Save
    </Button>
  );
};
