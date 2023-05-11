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
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Typography,
} from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
import { useTimeRange } from '@perses-dev/plugin-system';
import { isRelativeTimeRange, SAVE_DEFAULTS_DIALOG_TEXT } from '@perses-dev/core';
import { useSaveChangesConfirmationDialog } from '../../context';

export const SaveChangesConfirmationDialog = () => {
  const [saveDefaultTimeRange, setSaveDefaultTimeRange] = useState(true);
  const [saveDefaultVariables, setSaveDefaultVariables] = useState(true);

  const { saveChangesConfirmationDialog: dialog } = useSaveChangesConfirmationDialog();
  const isOpen = dialog !== undefined;

  const { timeRange } = useTimeRange();
  const currentTimeRangeText = isRelativeTimeRange(timeRange)
    ? `(${timeRange.pastDuration})`
    : '(Absolute time ranges can not be saved)';

  const timeRangeInfoText = `Save current time period as new default ${currentTimeRangeText}`;

  return (
    <Dialog open={isOpen}>
      {dialog !== undefined && (
        <>
          <DialogTitle>Save Dashboard</DialogTitle>
          <IconButton
            aria-label="Close"
            onClick={dialog.onCancel}
            sx={(theme) => ({
              position: 'absolute',
              top: theme.spacing(0.5),
              right: theme.spacing(0.5),
            })}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent dividers sx={{ width: '500px' }}>
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
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              onClick={() => {
                return dialog.onSaveChanges(saveDefaultTimeRange, saveDefaultVariables);
              }}
            >
              Save Changes
            </Button>
            <Button variant="outlined" color="secondary" onClick={dialog.onCancel}>
              Cancel
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};
