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
  useHotkeys,
  useHotkeySequences,
  buildShortcutOptions,
  dispatchShortcutEvent,
  requireShortcutEvent,
  requireShortcutHotkey,
  requireShortcutSequence,
  GO_HOME_SHORTCUT,
  GO_EXPLORE_SHORTCUT,
  GO_PROFILE_SHORTCUT,
  OPEN_SEARCH_SHORTCUT,
  SHOW_SHORTCUTS_SHORTCUT,
  TOGGLE_THEME_SHORTCUT,
} from '@perses-dev/dashboards';
import { ExploreRoute, ProfileRoute } from '../model/route';

/** Registers all global keyboard shortcuts. Requires HotkeysProvider and ScopeProvider. */
export function GlobalShortcuts(): ReactElement | null {
  const navigate = useNavigate();

  useHotkeySequences(
    [
      {
        def: GO_HOME_SHORTCUT,
        callback: (): void => navigate('/'),
      },
      {
        def: GO_EXPLORE_SHORTCUT,
        callback: (): void => navigate(ExploreRoute),
      },
      {
        def: GO_PROFILE_SHORTCUT,
        callback: (): void => navigate(ProfileRoute),
      },
      {
        def: TOGGLE_THEME_SHORTCUT,
        callback: (): void => dispatchShortcutEvent(requireShortcutEvent(TOGGLE_THEME_SHORTCUT)),
      },
    ].map(({ def, callback }) => ({
      sequence: requireShortcutSequence(def),
      callback,
      options: buildShortcutOptions(def, true),
    }))
  );

  useHotkeys(
    [OPEN_SEARCH_SHORTCUT, SHOW_SHORTCUTS_SHORTCUT].map((shortcutDef) => ({
      hotkey: requireShortcutHotkey(shortcutDef),
      callback: (): void => dispatchShortcutEvent(requireShortcutEvent(shortcutDef)),
      options: buildShortcutOptions(shortcutDef, true),
    }))
  );

  return null;
}
