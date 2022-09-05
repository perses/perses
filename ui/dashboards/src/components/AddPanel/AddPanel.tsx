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
  TextField,
  InputLabel,
  FormControl,
  Grid,
  SelectChangeEvent,
  Box,
  Button,
  Typography,
} from '@mui/material';
import { Drawer } from '@perses-dev/components';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useLayouts, usePanels } from '../../context';
import { removeWhiteSpacesAndSpecialCharacters } from '../../utils/functions';

interface AddPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPanel = ({ isOpen, onClose }: AddPanelProps) => {
  const { layouts, addItemToLayout } = useLayouts();
  const { addPanel } = usePanels();

  const [group, setGroup] = useState(0);
  const [panelName, setPanelName] = useState('');
  const [panelDescription, setPanelDescription] = useState('');

  const onSelectGroupChange = (e: SelectChangeEvent<number>) => {
    setGroup(e.target.value as number);
  };

  const onPanelNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPanelName(e.target.value);
  };

  const onPanelDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPanelDescription(e.target.value);
  };

  const onAddPanelClick = () => {
    addPanel(removeWhiteSpacesAndSpecialCharacters(panelName), {
      kind: 'EmptyChart',
      display: { name: panelName, description: panelDescription },
      options: {},
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
      content: { $ref: `#/spec/panels/${panelName}` },
    });
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <form onSubmit={onAddPanelClick}>
        <AddPanelHeader onClose={onClose} />
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormControl>
              <InputLabel id="select-group">Group</InputLabel>
              <Select required labelId="select-group" label="Group" value={group} onChange={onSelectGroupChange}>
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
              <FormControl>
                <TextField required label="Panel Name" variant="outlined" onChange={onPanelNameChange} />
              </FormControl>
              <FormControl>
                <TextField label="Description" variant="outlined" onChange={onPanelDescriptionChange} />
              </FormControl>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Drawer>
  );
};

const AddPanelHeader = ({ onClose }: Pick<AddPanelProps, 'onClose'>) => {
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
      <Typography variant="h5">Add Panel</Typography>
      <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
        <Button type="submit" variant="contained">
          Add Panel
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Box>
  );
};

export default AddPanel;
