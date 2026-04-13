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

import { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useActiveScopes,
  useHotkeys,
  useHotkeySequences,
  buildMeta,
  dispatchShortcutEvent,
  GO_HOME_SHORTCUT,
  GO_EXPLORE_SHORTCUT,
  GO_PROFILE_SHORTCUT,
  OPEN_SEARCH_SHORTCUT,
  SHOW_SHORTCUTS_SHORTCUT,
  TOGGLE_THEME_SHORTCUT,
} from '@perses-dev/dashboards';
import { ExploreRoute, ProfileRoute } from '../model/route';

/**
 * Non-visual component that registers all global keyboard shortcuts.
 * Must be rendered within HotkeysProvider and ScopeProvider.
 */
export function GlobalShortcuts(): ReactElement | null {
  const navigate = useNavigate();
  const activeScopes = useActiveScopes();
  const globalEnabled = activeScopes.has('global');

  // --- Sequence shortcuts (navigation + theme toggle) ---

  useHotkeySequences([
    {
      sequence: GO_HOME_SHORTCUT.sequence!,
      callback: (): void => navigate('/'),
      options: { enabled: globalEnabled, meta: buildMeta(GO_HOME_SHORTCUT) },
    },
    {
      sequence: GO_EXPLORE_SHORTCUT.sequence!,
      callback: (): void => navigate(ExploreRoute),
      options: { enabled: globalEnabled, meta: buildMeta(GO_EXPLORE_SHORTCUT) },
    },
    {
      sequence: GO_PROFILE_SHORTCUT.sequence!,
      callback: (): void => navigate(ProfileRoute),
      options: { enabled: globalEnabled, meta: buildMeta(GO_PROFILE_SHORTCUT) },
    },
    {
      sequence: TOGGLE_THEME_SHORTCUT.sequence!,
      callback: (): void => dispatchShortcutEvent(TOGGLE_THEME_SHORTCUT.event!),
      options: { enabled: globalEnabled, meta: buildMeta(TOGGLE_THEME_SHORTCUT) },
    },
  ]);

  // --- Single hotkey shortcuts (search + help modal) ---

  useHotkeys([
    {
      hotkey: OPEN_SEARCH_SHORTCUT.hotkey!,
      callback: (): void => dispatchShortcutEvent(OPEN_SEARCH_SHORTCUT.event!),
      options: { enabled: globalEnabled, meta: buildMeta(OPEN_SEARCH_SHORTCUT) },
    },
    {
      hotkey: SHOW_SHORTCUTS_SHORTCUT.hotkey!,
      callback: (): void => dispatchShortcutEvent(SHOW_SHORTCUTS_SHORTCUT.event!),
      options: { enabled: globalEnabled, meta: buildMeta(SHOW_SHORTCUTS_SHORTCUT) },
    },
  ]);

  return null;
}
