// Copyright 2022 The Perses Authors
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

import {
  MenuItem,
  Stack,
  Select,
  SelectProps,
  TextField,
  InputLabel,
  FormControl,
  Grid,
  Box,
  Button,
  Typography,
} from '@mui/material';
import { Drawer, ErrorAlert } from '@perses-dev/components';
import { JsonObject } from '@perses-dev/core';
import { PluginBoundary } from '@perses-dev/plugin-system';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useDashboardApp, useLayouts, usePanels } from '../../context';
import { removeWhiteSpacesAndSpecialCharacters } from '../../utils/functions';
import { PanelOptionsEditor, PanelOptionsEditorProps } from './PanelOptionsEditor';

const PanelDrawer = () => {
  const { layouts, addItemToLayout } = useLayouts();
  const { updatePanel } = usePanels();
  const { panelDrawer, closePanelDrawer } = useDashboardApp();

  const [group, setGroup] = useState(0);
  const [panelName, setPanelName] = useState('');
  const [panelDescription, setPanelDescription] = useState('');
  const [kind, setKind] = useState('');
  const [options, setOptions] = useState<JsonObject>({});

  const handleGroupChange: SelectProps<number>['onChange'] = (e) => {
    const { value } = e.target;

    // Handle string (which would be empty string but shouldn't happen since we don't allow a "None" option) by
    // just ignoring it
    if (typeof value === 'string') return;

    setGroup(value);
  };

  const handlePanelNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPanelName(e.target.value);
  };

  const handlePanelDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPanelDescription(e.target.value);
  };

  const handleKindChange: SelectProps<string>['onChange'] = (e) => {
    setKind(e.target.value);
  };

  const handleOptionsChange: PanelOptionsEditorProps['onChange'] = (next) => {
    setOptions(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const panelKey = removeWhiteSpacesAndSpecialCharacters(panelName);
    updatePanel(panelKey, {
      kind,
      display: { name: panelName, description: panelDescription },
      options,
    });

    // find maximum y so new panel is added to the end of the grid
    let maxY = 0;
    layouts[group]?.spec.items.forEach((layout) => {
      if (layout.y > maxY) {
        maxY = layout.y;
      }
    });
    addItemToLayout(group, {
      x: 0,
      y: maxY + 1,
      width: 12,
      height: 6,
      content: { $ref: `#/spec/panels/${panelKey}` },
    });
    closePanelDrawer();
  };

  return (
    <Drawer isOpen={!!panelDrawer} onClose={() => closePanelDrawer()}>
      <form onSubmit={handleSubmit}>
        <PanelDrawerHeader onClose={() => closePanelDrawer()} />
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormControl>
              <InputLabel id="select-group">Group</InputLabel>
              <Select required labelId="select-group" label="Group" value={group} onChange={handleGroupChange}>
                {layouts.map((layout, index) => (
                  <MenuItem key={index} value={index}>
                    {layout.spec.display?.title || `Group ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={8}>
            <Stack spacing={2} sx={{ flexGrow: '1' }}>
              <TextField required label="Panel Name" variant="outlined" onChange={handlePanelNameChange} />
              <TextField label="Description" variant="outlined" onChange={handlePanelDescriptionChange} />
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <FormControl>
              <InputLabel id="panel-type-label">Panel Type</InputLabel>
              <Select required labelId="panel-type-label" label="Panel Type" value={kind} onChange={handleKindChange}>
                {/* TODO: Replace this with options that come from asking the plugin system what panel plugins are available */}
                <MenuItem value="LineChart">Line Chart</MenuItem>
                <MenuItem value="GaugeChart">Gauge Chart</MenuItem>
                <MenuItem value="StatChart">Stat Chart</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={8}>
            <PluginBoundary loadingFallback="Loading..." ErrorFallbackComponent={ErrorAlert}>
              {kind !== '' && <PanelOptionsEditor kind={kind} value={options} onChange={handleOptionsChange} />}
            </PluginBoundary>
          </Grid>
        </Grid>
      </form>
    </Drawer>
  );
};

const PanelDrawerHeader = ({ onClose }: { onClose: () => void }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: (theme) => theme.spacing(2),
        paddingBottom: (theme) => theme.spacing(2),
        borderBottom: (theme) => `1px solid ${theme.palette.grey[100]}`,
      }}
    >
      <Typography variant="h2">{`${action} Panel`}</Typography>
      <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
        <Button type="submit" variant="contained">
          {`${action} Panel`}
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Box>
  );
};

export default PanelDrawer;
