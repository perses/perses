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

import type { PluginModuleResource } from '@perses-dev/plugin-system';
import {
  Chip,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { Fragment } from 'react';
import type { ReactElement } from 'react';

interface PluginDetailsDialogProps {
  selectedPluginModule: PluginModuleResource | null;
  onClose: () => void;
}

export function PluginDetailsDialog({ selectedPluginModule, onClose }: PluginDetailsDialogProps): ReactElement | null {
  if (!selectedPluginModule) {
    return null;
  }

  return (
    <Dialog open={!!selectedPluginModule} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack spacing={1}>
          <Typography variant="h2">{selectedPluginModule.metadata.name}</Typography>
          <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: 'wrap' }}>
            <Chip label={`Version ${selectedPluginModule.metadata.version}`} size="small" variant="outlined" />
            <Typography variant="body2" color="text.secondary">
              {selectedPluginModule.spec.plugins.length} plugin
              {selectedPluginModule.spec.plugins.length !== 1 ? 's' : ''}
            </Typography>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: 400 }}>
        <List>
          <Stack divider={<Divider flexItem orientation="horizontal" />}>
            {selectedPluginModule.spec.plugins.map((pluginItem, index) => (
              <Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600 }}>{pluginItem.spec.name}</Typography>}
                    secondary={<Typography color="text.secondary">Kind: {pluginItem.kind}</Typography>}
                  />
                </ListItem>
              </Fragment>
            ))}
          </Stack>
        </List>
      </DialogContent>
    </Dialog>
  );
}
