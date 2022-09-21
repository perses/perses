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
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { OptionsEditorProps, useListPluginMetadata, usePlugin } from '@perses-dev/plugin-system';
import { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { useDashboardApp, useLayouts, usePanels } from '../../context';
import { removeWhiteSpacesAndSpecialCharacters } from '../../utils/functions';

interface PanelDrawerHeaderProps {
  onClose: () => void;
  panelKey?: string;
}

const PanelDrawer = () => {
  const { layouts } = useLayouts();
  const { panels, updatePanel } = usePanels();
  const { panelDrawer, closePanelDrawer } = useDashboardApp();

  const panelKey = panelDrawer?.panelKey;
  const panelGroupIndex = panelDrawer?.groupIndex;
  const panelDefinition = panelKey ? panels[panelKey] : undefined;

  const defaultGroup = panelGroupIndex ?? 0;
  const defaultPanelName = panelDefinition?.spec.display.name ?? '';
  const defaultPanelDescription = panelDefinition?.spec.display.description ?? '';
  const defaultKind = panelDefinition?.spec.plugin.kind ?? '';
  const defaultOptions = panelDefinition?.spec.plugin.spec;

  const [group, setGroup] = useState(defaultGroup);
  const [panelName, setPanelName] = useState(defaultPanelName);
  const [panelDescription, setPanelDescription] = useState(defaultPanelDescription);
  const [kind, setKind] = useState(defaultKind);
  // Plugin options depends on the plugin kind ('LineChart', 'Markdown', et cetera).
  // As the user switches between kinds, we keep track of the options
  // so that we can go back to wherever they left off.
  const [kindToOptions, setKindToOptions] = useState<Record<string, unknown>>({ [defaultKind]: defaultOptions });
  const options = kindToOptions[kind];

  // TODO: What should we show if either of these error out?
  const { data: pluginMetadata } = useListPluginMetadata('Panel');
  const { data: plugin } = usePlugin('Panel', kind, {
    enabled: kind !== '',
    onSuccess: (plugin) => {
      // Set initial options whenever plugin kind changes and a plugin is loaded
      if (!kindToOptions[kind]) {
        setKindToOptions({ ...kindToOptions, [kind]: plugin.createInitialOptions() });
      }
    },
  });
  const OptionsEditorComponent = plugin?.OptionsEditorComponent;

  // TO DO: we might want to make the form a sub component we don't need this useEffect
  // currently, we need to reset the states whenever panelDrawer is reopened
  // since this component does not get remounted when it open/closes (otherwise we lose the animation of sliding in/out)
  useEffect(() => {
    setGroup(defaultGroup);
    setPanelName(defaultPanelName);
    setPanelDescription(defaultPanelDescription);
    setKind(defaultKind);
    setKindToOptions({ [defaultKind]: defaultOptions });
  }, [defaultGroup, defaultPanelName, defaultPanelDescription, defaultKind, defaultOptions]);

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

  const handleOptionsChange: OptionsEditorProps<unknown>['onChange'] = (next) => {
    setKindToOptions({ ...kindToOptions, [kind]: next });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (panelDrawer?.groupIndex !== undefined && !panelDrawer?.panelKey) {
      addNewPanel();
    } else if (panelDrawer?.panelKey) {
      editPanel();
    }
    closePanelDrawer();
  };

  const addNewPanel = (): void => {
    if (panelDrawer?.groupIndex === undefined) {
      return;
    }

    const panelKey = removeWhiteSpacesAndSpecialCharacters(panelName);
    updatePanel(
      panelKey,
      {
        kind: 'Panel',
        spec: {
          display: { name: panelName, description: panelDescription },
          plugin: {
            kind,
            spec: options,
          },
        },
      },
      panelDrawer.groupIndex
    );
  };

  const editPanel = (): void => {
    if (panelDrawer?.panelKey === undefined) {
      return;
    }
    updatePanel(panelDrawer.panelKey, {
      kind: 'Panel',
      spec: {
        ...panels[panelDrawer.panelKey]?.spec,
        display: { name: panelName ?? '', description: panelDescription },
        plugin: {
          kind,
          spec: options,
        },
      },
    });
    // TO DO: need to move panel if panel group changes
  };

  return (
    <Drawer isOpen={!!panelDrawer} onClose={() => closePanelDrawer()}>
      <form onSubmit={handleSubmit}>
        <PanelDrawerHeader panelKey={panelDrawer?.panelKey} onClose={() => closePanelDrawer()} />
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <TextField
              required
              label="Panel Name"
              value={panelName}
              variant="outlined"
              onChange={handlePanelNameChange}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl>
              <InputLabel id="select-group">Group</InputLabel>
              <Select required labelId="select-group" label="Group" value={group ?? 0} onChange={handleGroupChange}>
                {layouts.map((layout, index) => (
                  <MenuItem key={index} value={index}>
                    {layout.spec.display?.title || `Group ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={8}>
            <TextField
              label="Panel Description"
              value={panelDescription}
              variant="outlined"
              onChange={handlePanelDescriptionChange}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl>
              <InputLabel id="panel-type-label">Panel Type</InputLabel>
              <Select required labelId="panel-type-label" label="Panel Type" value={kind} onChange={handleKindChange}>
                {pluginMetadata?.map((metadata) => (
                  <MenuItem key={metadata.kind} value={metadata.kind}>
                    {metadata.display.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              {OptionsEditorComponent !== undefined && options !== undefined && (
                <OptionsEditorComponent value={options} onChange={handleOptionsChange} />
              )}
            </ErrorBoundary>
          </Grid>
        </Grid>
      </form>
    </Drawer>
  );
};

const PanelDrawerHeader = ({ panelKey, onClose }: PanelDrawerHeaderProps) => {
  const action = panelKey ? 'Edit' : 'Add';
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
          {panelKey ? 'Apply' : 'Add'}
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Box>
  );
};

export default PanelDrawer;
