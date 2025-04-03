import { PluginModuleResource } from '@perses-dev/plugin-system';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
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
