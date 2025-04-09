// Copyright 2025 The Perses Authors
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

import { PluginModuleResource } from '@perses-dev/plugin-system';
import { Dialog, DialogContent, DialogTitle, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import { ReactElement } from 'react';

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
      <DialogTitle>Plugins for {selectedPluginModule.metadata.name} Module</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: 400 }}>
        <List>
          {selectedPluginModule.spec.plugins.map((pluginItem, index) => (
            <div key={index}>
              <ListItem>
                <ListItemText
                  primary={
                    <Typography>
                      <strong>{pluginItem.spec.name}</strong>
                    </Typography>
                  }
                  secondary={<Typography color="text.secondary">Kind: {pluginItem.kind}</Typography>}
                />
              </ListItem>
              <Divider component="li" />
            </div>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
