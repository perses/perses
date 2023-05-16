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
import { Checkbox, FormGroup, FormControlLabel, Typography } from '@mui/material';
import { useTimeRange } from '@perses-dev/plugin-system';
import { isRelativeTimeRange, SAVE_DEFAULTS_DIALOG_TEXT } from '@perses-dev/core';
import { Dialog } from '@perses-dev/components';
import { useSaveChangesConfirmationDialog } from '../../context';

export const SaveChangesConfirmationDialog = () => {
  const [saveDefaultTimeRange, setSaveDefaultTimeRange] = useState(true);
  const [saveDefaultVariables, setSaveDefaultVariables] = useState(true);

  const { saveChangesConfirmationDialog: dialog } = useSaveChangesConfirmationDialog();
  const isOpen = dialog !== undefined;

  const { timeRange } = useTimeRange();
  const currentTimeRangeText = isRelativeTimeRange(timeRange)
    ? `(Last ${timeRange.pastDuration})`
    : '(Absolute time ranges can not be saved)';

  const timeRangeInfoText = `Save current time range as new default ${currentTimeRangeText}`;

  return (
    <Dialog open={isOpen}>
      {dialog !== undefined && (
        <>
          <Dialog.Header onClose={() => dialog.onCancel()}>Save Dashboard</Dialog.Header>

          <Dialog.Content>
            <Typography marginBottom={2}>{dialog.description || SAVE_DEFAULTS_DIALOG_TEXT}</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    disabled={!isRelativeTimeRange(timeRange)}
                    checked={saveDefaultTimeRange && isRelativeTimeRange(timeRange)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaveDefaultTimeRange(e.target.checked)}
                  />
                }
                label={timeRangeInfoText}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={saveDefaultVariables}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaveDefaultVariables(e.target.checked)}
                  />
                }
                label="Save current variables values as new default"
              />
            </FormGroup>
          </Dialog.Content>

          <Dialog.Actions>
            <Dialog.PrimaryButton
              onClick={() => {
                return dialog.onSaveChanges(saveDefaultTimeRange, saveDefaultVariables);
              }}
            >
              Save Changes
            </Dialog.PrimaryButton>
            <Dialog.SecondaryButton onClick={() => dialog.onCancel()}>Cancel</Dialog.SecondaryButton>
          </Dialog.Actions>
        </>
      )}
    </Dialog>
  );
};
