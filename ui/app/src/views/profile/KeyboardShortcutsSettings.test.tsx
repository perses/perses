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

import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const STORAGE_KEY = 'PERSES_KEYBOARD_SHORTCUTS';

// Module-level state for mock overrides (must be declared before jest.mock)
const _state = {
  overrides: { version: 1, overrides: {} } as { version: number; overrides: Record<string, string | null> },
};

const mockSetOverride = jest.fn((id: string, keys: string | null) => {
  _state.overrides = { ..._state.overrides, overrides: { ..._state.overrides.overrides, [id]: keys } };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_state.overrides));
});
const mockRemoveOverride = jest.fn((id: string) => {
  const { [id]: _, ...rest } = _state.overrides.overrides;
  _state.overrides = { ..._state.overrides, overrides: rest };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_state.overrides));
});
const mockResetAll = jest.fn(() => {
  _state.overrides = { version: 1, overrides: {} };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_state.overrides));
});

const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn();

jest.mock('@perses-dev/dashboards', () => ({
  useShortcutPreferences: (): {
    overrides: typeof _state.overrides;
    setOverride: typeof mockSetOverride;
    removeOverride: typeof mockRemoveOverride;
    resetAll: typeof mockResetAll;
  } => ({
    overrides: _state.overrides,
    setOverride: mockSetOverride,
    removeOverride: mockRemoveOverride,
    resetAll: mockResetAll,
  }),
  SHORTCUT_CATEGORY_LABELS: {
    global: 'Global',
    'time-range': 'Time Range',
    dashboard: 'Dashboard',
    'focused-panel': 'Focused Panel',
  },
  SHORTCUT_CATEGORY_ORDER: ['global', 'time-range', 'dashboard', 'focused-panel'],
  GLOBAL_SHORTCUTS: [
    {
      id: 'go-home',
      sequence: ['G', 'H'],
      name: 'Go to Home',
      description: 'Navigate to the Home page',
      category: 'global',
      scope: 'global',
    },
    {
      id: 'show-shortcuts',
      hotkey: { key: '?', shift: true },
      name: 'Show Keyboard Shortcuts',
      description: 'Show the keyboard shortcuts help modal',
      category: 'global',
      scope: 'global',
    },
    {
      id: 'open-search',
      hotkey: 'Mod+K',
      name: 'Open Search',
      description: 'Open the search dialog',
      category: 'global',
      scope: 'global',
    },
  ],
  DASHBOARD_SHORTCUTS: [
    {
      id: 'save-dashboard',
      hotkey: 'Mod+S',
      name: 'Save Dashboard',
      description: 'Save the current dashboard',
      category: 'dashboard',
      scope: 'dashboard',
    },
  ],
  TIME_RANGE_SHORTCUTS: [
    {
      id: 'time-zoom-out',
      sequence: ['T', 'Z'],
      name: 'Zoom Out',
      description: 'Zoom out time range (2x)',
      category: 'time-range',
      scope: 'dashboard',
    },
  ],
  PANEL_SHORTCUTS: [
    {
      id: 'panel-edit',
      hotkey: 'E',
      name: 'Edit Panel',
      description: 'Edit the focused panel when in edit mode',
      category: 'focused-panel',
      scope: 'panel',
    },
  ],
  useHotkeyRecorder: (): {
    startRecording: typeof mockStartRecording;
    stopRecording: typeof mockStopRecording;
    isRecording: boolean;
    recordedHotkey: null;
  } => ({
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    isRecording: false,
    recordedHotkey: null,
  }),
  formatForDisplay: (key: string | { key: string; shift?: boolean }): string => {
    if (typeof key === 'object') {
      return key.shift ? `Shift+${key.key}` : key.key;
    }
    return key;
  },
  PersesShortcutDef: {},
}));

// Import after mocks
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';

const theme = createTheme();

function renderSettings(): ReturnType<typeof render> {
  return render(
    <ThemeProvider theme={theme}>
      <KeyboardShortcutsSettings />
    </ThemeProvider>
  );
}

describe('KeyboardShortcutsSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    _state.overrides = { version: 1, overrides: {} };
    mockSetOverride.mockClear();
    mockRemoveOverride.mockClear();
    mockResetAll.mockClear();
    mockStartRecording.mockClear();
    mockStopRecording.mockClear();
  });

  it('should render the heading', () => {
    renderSettings();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should render Reset All button', () => {
    renderSettings();
    expect(screen.getByRole('button', { name: /reset all/i })).toBeInTheDocument();
  });

  it('should display shortcut descriptions', () => {
    renderSettings();
    expect(screen.getByText('Navigate to the Home page')).toBeInTheDocument();
    expect(screen.getByText('Save the current dashboard')).toBeInTheDocument();
    expect(screen.getByText('Edit the focused panel when in edit mode')).toBeInTheDocument();
    expect(screen.getByText('Zoom out time range (2x)')).toBeInTheDocument();
  });

  it('should render sequence shortcuts without "then" text', () => {
    renderSettings();
    expect(screen.queryByText('then')).not.toBeInTheDocument();
  });

  it('should display show-shortcuts as ? only', () => {
    renderSettings();
    const row = screen.getByText('Show the keyboard shortcuts help modal').closest('tr');
    expect(row).not.toBeNull();
    const rowQueries = within(row as HTMLElement);
    expect(rowQueries.getByText('?')).toBeInTheDocument();
    expect(rowQueries.queryByText('Shift+?')).not.toBeInTheDocument();
  });

  it('should display table headers', () => {
    renderSettings();
    const actionHeaders = screen.getAllByText('Action');
    const shortcutHeaders = screen.getAllByText('Shortcut');
    const enabledHeaders = screen.getAllByText('Enabled');
    expect(actionHeaders.length).toBeGreaterThan(0);
    expect(shortcutHeaders.length).toBeGreaterThan(0);
    expect(enabledHeaders.length).toBeGreaterThan(0);
  });

  it('should show all shortcuts as enabled by default', () => {
    renderSettings();
    const switches = screen.getAllByRole('checkbox');
    switches.forEach((switchEl) => {
      expect(switchEl).toBeChecked();
    });
  });

  it('should call setOverride with null when disabling a shortcut', () => {
    renderSettings();
    const switches = screen.getAllByRole('checkbox');
    fireEvent.click(switches[0]!);
    expect(mockSetOverride).toHaveBeenCalledWith(expect.any(String), null);
  });

  it('should call removeOverride when re-enabling a disabled shortcut', () => {
    _state.overrides = { version: 1, overrides: { 'go-home': null } };
    renderSettings();
    const switches = screen.getAllByRole('checkbox');
    const unchecked = switches.find((s) => !(s as HTMLInputElement).checked);
    if (unchecked) {
      fireEvent.click(unchecked);
      expect(mockRemoveOverride).toHaveBeenCalledWith('go-home');
    }
  });

  it('should show (disabled) text for disabled shortcuts', () => {
    _state.overrides = { version: 1, overrides: { 'go-home': null } };
    renderSettings();
    expect(screen.getByText('(disabled)')).toBeInTheDocument();
  });

  it('should show overridden key for overridden shortcuts', () => {
    _state.overrides = { version: 1, overrides: { 'open-search': 'Mod+Shift+K' } };
    renderSettings();
    expect(screen.getByText('Mod+Shift+K')).toBeInTheDocument();
  });

  it('should show reset button for overridden shortcuts', () => {
    _state.overrides = { version: 1, overrides: { 'open-search': 'Mod+Shift+K' } };
    renderSettings();
    const resetButtons = screen.getAllByTitle('Reset to default');
    expect(resetButtons.length).toBeGreaterThan(0);
  });

  it('should call resetAll when Reset All is clicked', () => {
    renderSettings();
    const resetAllButton = screen.getByRole('button', { name: /reset all/i });
    fireEvent.click(resetAllButton);
    expect(mockResetAll).toHaveBeenCalled();
  });

  it('should render edit buttons for each shortcut', () => {
    renderSettings();
    const editButtons = screen.getAllByTitle('Edit shortcut');
    expect(editButtons.length).toBeGreaterThan(0);
  });
});
