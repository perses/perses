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

import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Dialog, DialogContent, DialogTitle, Divider, IconButton, Typography } from '@mui/material';
import Close from 'mdi-material-ui/Close';
import {
  useHotkeyRegistrations,
  formatForDisplay,
  SHORTCUT_CATEGORY_LABELS,
  SHORTCUT_CATEGORY_ORDER,
  ShortcutCategory,
  SHOW_SHORTCUTS_EVENT,
} from '@perses-dev/dashboards';

/** Modal displaying all registered keyboard shortcuts, grouped by category. */
export function ShortcutHelpModal(): ReactElement {
  const [open, setOpen] = useState(false);

  const handleShowShortcuts = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener(SHOW_SHORTCUTS_EVENT, handleShowShortcuts);
    return (): void => {
      window.removeEventListener(SHOW_SHORTCUTS_EVENT, handleShowShortcuts);
    };
  }, [handleShowShortcuts]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle component="h3" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Keyboard Shortcuts
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      {open && <ShortcutHelpContent />}
    </Dialog>
  );
}
/** This wrapper component is required as a workaround till https://github.com/TanStack/hotkeys/issues/113 upstream issue is fixed */
function ShortcutHelpContent(): ReactElement {
  const { hotkeys, sequences } = useHotkeyRegistrations();

  const groupedShortcuts = useMemo(() => {
    const groups: Record<ShortcutCategory, Array<{ name: string; description: string; displayParts: string[] }>> = {
      global: [],
      'time-range': [],
      dashboard: [],
      'focused-panel': [],
    };

    // Process single hotkeys
    for (const reg of hotkeys) {
      const meta = reg.options.meta;
      if (meta?.category) {
        const category = meta.category as ShortcutCategory;
        if (groups[category]) {
          groups[category].push({
            name: meta.name ?? meta.id ?? reg.hotkey,
            description: meta.description ?? '',
            displayParts: [meta.displayOverride ?? formatForDisplay(reg.hotkey)],
          });
        }
      }
    }

    // Process sequences
    for (const reg of sequences) {
      const meta = reg.options.meta;
      if (meta?.category) {
        const category = meta.category as ShortcutCategory;
        if (groups[category]) {
          groups[category].push({
            name: meta.name ?? reg.sequence.join(' '),
            description: meta.description ?? '',
            displayParts: reg.sequence.map((step) => formatForDisplay(step)),
          });
        }
      }
    }

    return groups;
  }, [hotkeys, sequences]);

  return (
    <DialogContent>
      {SHORTCUT_CATEGORY_ORDER.map((category) => {
        const shortcuts = groupedShortcuts[category];
        if (!shortcuts?.length) return null;

        return (
          <Box key={category} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>
              {SHORTCUT_CATEGORY_LABELS[category]}
            </Typography>
            {shortcuts.map((shortcut) => (
              <Box
                key={shortcut.name}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                }}
              >
                <Typography variant="body2">{shortcut.description || shortcut.name}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {shortcut.displayParts.map((part, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 0.25 }}>
                      <Typography
                        component="kbd"
                        variant="caption"
                        sx={{
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          border: 1,
                          borderColor: 'divider',
                          backgroundColor: 'action.hover',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {part}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
            <Divider sx={{ mt: 1 }} />
          </Box>
        );
      })}
    </DialogContent>
  );
}
