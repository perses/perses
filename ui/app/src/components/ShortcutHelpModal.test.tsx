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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock registrations used by the dashboard exports
const mockHotkeys: Array<{ hotkey: string; options: { meta: Record<string, string> } }> = [];
const mockSequences: Array<{ sequence: string[]; options: { meta: Record<string, string> } }> = [];

// Must mock @perses-dev/dashboards before importing the component under test,
// since it resolves outside the perses/ui workspace.
const SHOW_SHORTCUTS_EVENT = 'perses:show-shortcuts';

jest.mock('@perses-dev/dashboards', () => ({
  SHORTCUT_CATEGORY_LABELS: {
    global: 'Global',
    'time-range': 'Time Range',
    dashboard: 'Dashboard',
    'focused-panel': 'Focused Panel',
  },
  SHORTCUT_CATEGORY_ORDER: ['global', 'time-range', 'dashboard', 'focused-panel'],
  SHOW_SHORTCUTS_EVENT: 'perses:show-shortcuts',
  useHotkeyRegistrations: (): { hotkeys: typeof mockHotkeys; sequences: typeof mockSequences } => ({
    hotkeys: mockHotkeys,
    sequences: mockSequences,
  }),
  formatForDisplay: (key: string): string => key.toUpperCase(),
}));

// Import after mocks are set up
import { ShortcutHelpModal } from './ShortcutHelpModal';

const theme = createTheme();

function renderModal(): ReturnType<typeof render> {
  return render(
    <ThemeProvider theme={theme}>
      <ShortcutHelpModal />
    </ThemeProvider>
  );
}

describe('ShortcutHelpModal', () => {
  beforeEach(() => {
    mockHotkeys.length = 0;
    mockSequences.length = 0;
  });

  it('should not be visible initially', () => {
    renderModal();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should open when SHOW_SHORTCUTS_EVENT is dispatched', async () => {
    renderModal();

    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should close when close button is clicked', async () => {
    renderModal();

    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // The close button is an IconButton with no accessible name; find via testid
    const closeIcon = screen.getByTestId('CloseIcon');
    fireEvent.click(closeIcon);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should display hotkeys grouped by category', async () => {
    mockHotkeys.push(
      {
        hotkey: 'Mod+K',
        options: {
          meta: {
            id: 'open-search',
            name: 'Open Search',
            description: 'Open the search dialog',
            category: 'global',
            scope: 'global',
          },
        },
      },
      {
        hotkey: 'Mod+S',
        options: {
          meta: {
            id: 'save-dashboard',
            name: 'Save Dashboard',
            description: 'Save the current dashboard',
            category: 'dashboard',
            scope: 'dashboard',
          },
        },
      }
    );

    renderModal();
    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));

    await waitFor(() => {
      // CSS textTransform uppercase renders visually, but text content is the label value
      expect(screen.getByText('Global')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Open the search dialog')).toBeInTheDocument();
      expect(screen.getByText('Save the current dashboard')).toBeInTheDocument();
    });
  });

  it('should display sequences grouped by category', async () => {
    mockSequences.push({
      sequence: ['G', 'H'],
      options: {
        meta: {
          id: 'go-home',
          name: 'Go to Home',
          description: 'Navigate to the Home page',
          category: 'global',
          scope: 'global',
        },
      },
    });

    renderModal();
    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));

    await waitFor(() => {
      expect(screen.getByText('Navigate to the Home page')).toBeInTheDocument();
    });
  });

  it('should render sequence keys without "then" labels', async () => {
    mockSequences.push({
      sequence: ['G', 'H'],
      options: {
        meta: {
          id: 'go-home',
          name: 'Go to Home',
          description: 'Navigate to the Home page',
          category: 'global',
          scope: 'global',
        },
      },
    });

    renderModal();
    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));

    await waitFor(() => {
      expect(screen.getByText('Navigate to the Home page')).toBeInTheDocument();
      expect(screen.queryByText('then')).not.toBeInTheDocument();
    });
  });

  it('should display show-shortcuts hotkey as ? only', async () => {
    mockHotkeys.push({
      hotkey: 'Shift+?',
      options: {
        meta: {
          id: 'show-shortcuts',
          name: 'Show Keyboard Shortcuts',
          description: 'Show the keyboard shortcuts help modal',
          category: 'global',
          scope: 'global',
          displayOverride: '?',
        },
      },
    });

    renderModal();
    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));

    await waitFor(() => {
      expect(screen.getByText('Show the keyboard shortcuts help modal')).toBeInTheDocument();
      expect(screen.getByText('?', { selector: 'kbd' })).toBeInTheDocument();
      expect(screen.queryByText('SHIFT+?')).not.toBeInTheDocument();
    });
  });

  it('should show dashboard, time range, and focused panel sections when registrations exist', async () => {
    mockHotkeys.push(
      {
        hotkey: 'Mod+S',
        options: {
          meta: {
            id: 'save-dashboard',
            name: 'Save Dashboard',
            description: 'Save the current dashboard',
            category: 'dashboard',
            scope: 'dashboard',
          },
        },
      },
      {
        hotkey: 'E',
        options: {
          meta: {
            id: 'panel-edit',
            name: 'Edit Panel',
            description: 'Edit the focused panel when in edit mode',
            category: 'focused-panel',
            scope: 'panel',
          },
        },
      }
    );

    mockSequences.push({
      sequence: ['T', 'Z'],
      options: {
        meta: {
          id: 'time-zoom-out',
          name: 'Zoom Out',
          description: 'Zoom out time range (2x)',
          category: 'time-range',
          scope: 'dashboard',
        },
      },
    });

    renderModal();
    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Time Range')).toBeInTheDocument();
      expect(screen.getByText('Focused Panel')).toBeInTheDocument();
    });
  });

  it('should not render empty categories', async () => {
    mockHotkeys.push({
      hotkey: 'Mod+S',
      options: {
        meta: {
          id: 'save-dashboard',
          name: 'Save Dashboard',
          description: 'Save the current dashboard',
          category: 'dashboard',
          scope: 'dashboard',
        },
      },
    });

    renderModal();
    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      // Categories without shortcuts should not render
      expect(screen.queryByText('Focused Panel')).not.toBeInTheDocument();
    });
  });

  it('should display categories in the correct order', async () => {
    mockHotkeys.push(
      {
        hotkey: 'E',
        options: {
          meta: {
            id: 'panel-edit',
            name: 'Edit Panel',
            description: 'Edit the focused panel when in edit mode',
            category: 'focused-panel',
            scope: 'panel',
          },
        },
      },
      {
        hotkey: 'Mod+K',
        options: {
          meta: {
            id: 'open-search',
            name: 'Open Search',
            description: 'Open the search dialog',
            category: 'global',
            scope: 'global',
          },
        },
      }
    );

    mockSequences.push({
      sequence: ['T', 'Z'],
      options: {
        meta: {
          id: 'time-zoom-out',
          name: 'Zoom Out',
          description: 'Zoom out time range (2x)',
          category: 'time-range',
          scope: 'dashboard',
        },
      },
    });

    renderModal();
    fireEvent(window, new CustomEvent(SHOW_SHORTCUTS_EVENT));

    await waitFor(() => {
      const allText = document.body.textContent ?? '';
      const globalIdx = allText.indexOf('Global');
      const timeRangeIdx = allText.indexOf('Time Range');
      const focusedPanelIdx = allText.indexOf('Focused Panel');

      expect(globalIdx).toBeGreaterThan(-1);
      expect(timeRangeIdx).toBeGreaterThan(-1);
      expect(focusedPanelIdx).toBeGreaterThan(-1);
      expect(globalIdx).toBeLessThan(timeRangeIdx);
      expect(timeRangeIdx).toBeLessThan(focusedPanelIdx);
    });
  });
});
