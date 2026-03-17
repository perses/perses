import { FormEventHandler, ReactElement, useState } from 'react';
import PreferenceIcon from 'mdi-material-ui/MapClock';
import { Box, Button, FormControl, InputLabel, Stack } from '@mui/material';
import { TimeZoneSelector, useSnackbar } from '@perses-dev/components';
import { ProfileContainer } from './ProfileContainer';

const USER_PREFERENCE_TIMEZONE_KEY = 'preference_timezone';

export const Preferences = (): ReactElement => {
  const { successSnackbar, errorSnackbar } = useSnackbar();

  if (!localStorage.getItem(USER_PREFERENCE_TIMEZONE_KEY)) {
    localStorage.setItem(USER_PREFERENCE_TIMEZONE_KEY, Intl.DateTimeFormat().resolvedOptions().timeZone);
  }

  const [timezone, setTimezone] = useState<string>(localStorage.getItem(USER_PREFERENCE_TIMEZONE_KEY)!);

  const isTimezoneValid = (tz: string): boolean => {
    try {
      if (tz.toLowerCase() === 'local') return true;
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  };

  const submitHandler: FormEventHandler<HTMLFormElement> = (e): void => {
    e.preventDefault();
    if (!isTimezoneValid(timezone)) {
      errorSnackbar(`${timezone} is not a valid timezone`);
      return;
    }
    localStorage.setItem(USER_PREFERENCE_TIMEZONE_KEY, timezone);
    successSnackbar(`User-level timezone set to ${timezone}`);
  };

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
