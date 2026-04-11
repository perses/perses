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
  useShortcutPreferences,
  useHotkey,
  useHotkeySequence,
  HotkeyMeta,
  HotkeySequence,
  GO_HOME_SHORTCUT,
  GO_EXPLORE_SHORTCUT,
  GO_PROFILE_SHORTCUT,
  OPEN_SEARCH_SHORTCUT,
  SHOW_SHORTCUTS_SHORTCUT,
  TOGGLE_THEME_SHORTCUT,
  OPEN_SEARCH_EVENT,
  SHOW_SHORTCUTS_EVENT,
  TOGGLE_THEME_EVENT,
  PersesShortcutDef,
} from '@perses-dev/dashboards';
import { ExploreRoute, ProfileRoute } from '../model/route';

function buildMeta(def: PersesShortcutDef): HotkeyMeta {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    scope: def.scope,
  };
}

function dispatchShortcutEvent(eventName: string): void {
  window.dispatchEvent(new CustomEvent(eventName));
}

/**
 * Non-visual component that registers all global keyboard shortcuts.
 * Must be rendered within HotkeysProvider and ScopeProvider.
 */
export function GlobalShortcuts(): ReactElement | null {
  const navigate = useNavigate();
  const activeScopes = useActiveScopes();
  const { overrides } = useShortcutPreferences();
  const globalEnabled = activeScopes.has('global');

  // Helper: resolve override for a shortcut, returns null if disabled
  function isDisabled(id: string): boolean {
    return overrides.overrides[id] === null;
  }

  // --- Sequence shortcuts ---

  useHotkeySequence((GO_HOME_SHORTCUT.sequence ?? []) as HotkeySequence, () => navigate('/'), {
    enabled: globalEnabled && !isDisabled(GO_HOME_SHORTCUT.id),
    meta: buildMeta(GO_HOME_SHORTCUT),
  });

  useHotkeySequence((GO_EXPLORE_SHORTCUT.sequence ?? []) as HotkeySequence, () => navigate(ExploreRoute), {
    enabled: globalEnabled && !isDisabled(GO_EXPLORE_SHORTCUT.id),
    meta: buildMeta(GO_EXPLORE_SHORTCUT),
  });

  useHotkeySequence((GO_PROFILE_SHORTCUT.sequence ?? []) as HotkeySequence, () => navigate(ProfileRoute), {
    enabled: globalEnabled && !isDisabled(GO_PROFILE_SHORTCUT.id),
    meta: buildMeta(GO_PROFILE_SHORTCUT),
  });

  useHotkeySequence(
    (TOGGLE_THEME_SHORTCUT.sequence ?? []) as HotkeySequence,
    () => dispatchShortcutEvent(TOGGLE_THEME_EVENT),
    { enabled: globalEnabled && !isDisabled(TOGGLE_THEME_SHORTCUT.id), meta: buildMeta(TOGGLE_THEME_SHORTCUT) }
  );

  // --- Single hotkey shortcuts ---

  useHotkey(OPEN_SEARCH_SHORTCUT.hotkey!, () => dispatchShortcutEvent(OPEN_SEARCH_EVENT), {
    enabled: globalEnabled && !isDisabled(OPEN_SEARCH_SHORTCUT.id),
    meta: buildMeta(OPEN_SEARCH_SHORTCUT),
  });

  useHotkey(SHOW_SHORTCUTS_SHORTCUT.hotkey!, () => dispatchShortcutEvent(SHOW_SHORTCUTS_EVENT), {
    enabled: globalEnabled && !isDisabled(SHOW_SHORTCUTS_SHORTCUT.id),
    meta: buildMeta(SHOW_SHORTCUTS_SHORTCUT),
  });

  return null;
}
