import { PluginModuleResource } from '@perses-dev/plugin-system';
import { Box, Dialog, DialogTitle, Typography } from '@mui/material';
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
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {selectedPluginModule.spec.plugins.map((pluginItem, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <Typography variant="h3">{pluginItem.spec.name}</Typography>
            <Typography variant="body1" color="text.secondary">
              Kind: {pluginItem.kind}
            </Typography>
          </Box>
        ))}
      </Box>
    </Dialog>
  );
}
