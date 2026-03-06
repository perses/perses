import { ReactElement, useState } from 'react';
import PreferenceIcon from 'mdi-material-ui/MapClock';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import { getZoneOffset } from '../../utils/time';
import { useCurrentUser } from '../../model/user-client';
import { ProfileContainer } from './ProfileContainer';

export const Preferences = (): ReactElement => {
  const { data } = useCurrentUser();
  const timeZones = Intl.supportedValuesOf('timeZone');

  const zonesWithOffsets = timeZones.map((zone) => getZoneOffset(zone));
  const [timezone, setTimezone] = useState<string | undefined>(data?.spec?.preferences?.timezone);

  return (
    <ProfileContainer icon={<PreferenceIcon sx={{ fontSize: 24 }} />} title="Preferences" testId="Preferences">
      <Stack direction="column" spacing={2}>
        <Box sx={{ p: 2, maxWidth: 400 }}>
          <FormControl fullWidth>
            <InputLabel id="timezone-select-label">Timezone</InputLabel>
            <Select
              onChange={(e) => setTimezone(e.target.value)}
              labelId="timezone-select-label"
              id="timezone-select"
              value={timezone}
              label="Timezone"
            >
              {zonesWithOffsets.map(({ label, zone }) => (
                <MenuItem key={zone} value={zone}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained">Save</Button>
        </Box>
      </Stack>
    </ProfileContainer>
  );
};
