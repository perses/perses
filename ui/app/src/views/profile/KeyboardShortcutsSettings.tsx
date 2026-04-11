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

import { ReactElement, useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Pencil from 'mdi-material-ui/Pencil';
import Restore from 'mdi-material-ui/Restore';
import {
  useHotkeyRecorder,
  formatForDisplay,
  useShortcutPreferences,
  SHORTCUT_CATEGORY_LABELS,
  SHORTCUT_CATEGORY_ORDER,
  ShortcutCategory,
  GLOBAL_SHORTCUTS,
  DASHBOARD_SHORTCUTS,
  PANEL_SHORTCUTS,
  TIME_RANGE_SHORTCUTS,
  PersesShortcutDef,
} from '@perses-dev/dashboards';

const ALL_SHORTCUTS: PersesShortcutDef[] = [
  ...GLOBAL_SHORTCUTS,
  ...DASHBOARD_SHORTCUTS,
  ...TIME_RANGE_SHORTCUTS,
  ...PANEL_SHORTCUTS,
];

/**
 * Settings page for viewing and customizing keyboard shortcuts.
 * Uses useHotkeyRecorder() for key capture and useShortcutPreferences() for persistence.
 */
export function KeyboardShortcutsSettings(): ReactElement {
  const { overrides, setOverride, removeOverride, resetAll } = useShortcutPreferences();
  const [editingId, setEditingId] = useState<string | null>(null);

  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => {
      if (editingId) {
        setOverride(editingId, hotkey);
        setEditingId(null);
      }
    },
    onCancel: () => {
      setEditingId(null);
    },
  });

  const handleEdit = useCallback(
    (id: string) => {
      setEditingId(id);
      recorder.startRecording();
    },
    [recorder]
  );

  const handleToggle = useCallback(
    (id: string, currentlyEnabled: boolean) => {
      if (currentlyEnabled) {
        setOverride(id, null); // disable
      } else {
        removeOverride(id); // re-enable (remove the null override)
      }
    },
    [setOverride, removeOverride]
  );

  const handleReset = useCallback(
    (id: string) => {
      removeOverride(id);
    },
    [removeOverride]
  );

  const handleResetAll = useCallback(() => {
    resetAll();
  }, [resetAll]);

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<ShortcutCategory, PersesShortcutDef[]> = {
      global: [],
      'time-range': [],
      dashboard: [],
      'focused-panel': [],
    };
    for (const shortcut of ALL_SHORTCUTS) {
      if (groups[shortcut.category]) {
        groups[shortcut.category].push(shortcut);
      }
    }
    return groups;
  }, []);

  function getDisplayParts(def: PersesShortcutDef): string[] {
    const override = overrides.overrides[def.id];
    if (override === null) return ['(disabled)'];
    if (override !== undefined) return [formatForDisplay(override)];
    if (def.hotkey) {
      if (def.id === 'show-shortcuts') {
        return ['?'];
      }
      return [formatForDisplay(def.hotkey)];
    }
    if (def.sequence) {
      return def.sequence.map((step) => formatForDisplay(step));
    }
    return [];
  }

  function isEnabled(id: string): boolean {
    return overrides.overrides[id] !== null;
  }

  function hasOverride(id: string): boolean {
    return id in overrides.overrides;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Keyboard Shortcuts</Typography>
        <Button variant="outlined" size="small" onClick={handleResetAll} startIcon={<Restore />}>
          Reset All
        </Button>
      </Box>

      {SHORTCUT_CATEGORY_ORDER.map((category) => {
        const shortcuts = groupedShortcuts[category];
        if (!shortcuts || shortcuts.length === 0) return null;

        return (
          <Box key={category} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>
              {SHORTCUT_CATEGORY_LABELS[category]}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Shortcut</TableCell>
                    <TableCell align="center">Enabled</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shortcuts.map((shortcut) => (
                    <TableRow key={shortcut.id}>
                      <TableCell>
                        <Typography variant="body2">{shortcut.description}</Typography>
                      </TableCell>
                      <TableCell>
                        {editingId === shortcut.id && recorder.isRecording ? (
                          <Typography
                            variant="body2"
                            sx={{
                              px: 1,
                              py: 0.5,
                              border: 2,
                              borderColor: 'primary.main',
                              borderRadius: 1,
                              fontFamily: 'monospace',
                            }}
                          >
                            {recorder.recordedHotkey ? formatForDisplay(recorder.recordedHotkey) : 'Press keys...'}
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {getDisplayParts(shortcut).map((part, index) => (
                              <Typography
                                key={`${shortcut.id}-${index}`}
                                component="kbd"
                                variant="body2"
                                sx={{
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                  border: 1,
                                  borderColor: 'divider',
                                  backgroundColor: 'action.hover',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {part}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={isEnabled(shortcut.id)}
                          onChange={() => handleToggle(shortcut.id, isEnabled(shortcut.id))}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEdit(shortcut.id)} title="Edit shortcut">
                          <Pencil fontSize="small" />
                        </IconButton>
                        {hasOverride(shortcut.id) && (
                          <IconButton size="small" onClick={() => handleReset(shortcut.id)} title="Reset to default">
                            <Restore fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}
    </Box>
  );
}
