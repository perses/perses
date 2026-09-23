// Copyright The Perses Authors
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

import { Box, Button, FormControl, InputLabel, Stack } from '@mui/material';
import { TimeZoneSelector, useSnackbar } from '@perses-dev/components';
import PreferenceIcon from 'mdi-material-ui/MapClock';
import type { FormEventHandler, ReactElement } from 'react';
import { useCallback, useState } from 'react';

import { useUserPreferences } from '../../context/UserPreferences';
import { ProfileContainer } from './ProfileContainer';

function isTimezoneValid(timezone: string): boolean {
  if (!timezone) return false;
  if (timezone.toLowerCase() === 'local') return true;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export const Preferences = (): ReactElement => {
  const { successSnackbar, errorSnackbar } = useSnackbar();
  const { userPreferences, updateUserPreferences } = useUserPreferences();
  const [timezone, setTimezone] = useState(userPreferences.timezone ?? 'local');

  const submitHandler: FormEventHandler<HTMLFormElement> = useCallback(
    (e): void => {
      e.preventDefault();
      if (!timezone || !isTimezoneValid(timezone)) {
        errorSnackbar(`${timezone} is not a valid timezone`);
        return;
      }

      updateUserPreferences({ timezone });
      successSnackbar(`User-level timezone set to ${timezone}`);
    },
    [timezone, errorSnackbar, successSnackbar, updateUserPreferences],
  );

  return (
    <ProfileContainer icon={<PreferenceIcon sx={{ fontSize: 24 }} />} title="Preferences" testId="Preferences">
      <form onSubmit={submitHandler}>
        <Stack direction="column" spacing={2}>
          <Box sx={{ p: 2, maxWidth: 400 }}>
            <FormControl fullWidth>
              <InputLabel id="timezone-label">Timezone</InputLabel>
              <TimeZoneSelector
                labelId="timezone-label"
                label="Timezone"
                variant="compact"
                onChange={(tz) => setTimezone(tz.value)}
                value={timezone ?? ''}
              />
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </ProfileContainer>
  );
};
