// Copyright 2023 The Perses Authors
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

import { BoxProps } from '@mui/material';
import { UnknownSpec, useEvent } from '@perses-dev/core';
import { useState, useRef, useEffect } from 'react';
import { produce } from 'immer';
import { PanelPlugin, PluginType } from '../../model';
import { PluginKindSelectProps } from '../PluginKindSelect/PluginKindSelect';
import { PluginSpecEditorProps } from '../PluginSpecEditor/PluginSpecEditor';
import { usePlugin, usePluginRegistry } from '../../runtime';

export interface PluginEditorSelection {
  type: PluginType;
  kind: string;
}

export interface PluginEditorValue {
  selection: PluginEditorSelection;
  spec: UnknownSpec;
}

// Props on MUI Box that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface PluginEditorProps extends Omit<BoxProps, OmittedMuiProps> {
  pluginTypes: PluginType[];
  pluginKindLabel: string;
  value: PluginEditorValue;
  isReadonly?: boolean;
  onChange: (next: PluginEditorValue) => void;
}

type PreviousSpecState = Record<string, Record<string, UnknownSpec>>;
type HideQueryEditorState = Record<string, boolean>;

/**
 * Props needed by the usePluginEditor hook.
 */
export type UsePluginEditorProps = Pick<PluginEditorProps, 'pluginTypes' | 'value' | 'onChange'> & {
  onHideQueryEditorChange?: (isHidden: boolean) => void;
};

/**
 * Returns the state/handlers that power the `PluginEditor` component. Useful for custom components that want to provide
 * a different UI, but want the same behavior of changing `kind` and `spec` together on plugin kind changes. Also
 * remembers previous `spec` values that it's seen, allowing and restores those values if a user switches the plugin
 * kind back.
 */
export function usePluginEditor(props: UsePluginEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const { pluginTypes, value, onHideQueryEditorChange = () => {} } = props; // setting onHideQueryEditorChange to empty function here because useEvent requires a function

  // Keep a stable reference, so we don't run the effect below when we don't need to
  const onChange = useEvent(props.onChange);
  const onHideQuery = useEvent(onHideQueryEditorChange);

  // The previous spec state for PluginType and kind and a helper function for remembering current values
  const prevSpecState = useRef<PreviousSpecState>({
    [value.selection.type]: { [value.selection.kind]: value.spec },
  });
  const rememberCurrentSpecState = useEvent(() => {
    let byPluginType = prevSpecState.current[value.selection.type];
    if (byPluginType === undefined) {
      byPluginType = {};
      prevSpecState.current[value.selection.type] = byPluginType;
    }
    byPluginType[value.selection.kind] = value.spec;
  });

  // The previous hide query state for each panel kind
  const hideQueryState = useRef<HideQueryEditorState>({
    [value.selection.kind]: false,
  });

  const { defaultPluginKinds } = usePluginRegistry();
  const defaultPluginType = pluginTypes[0];
  const defaultPluginKind = defaultPluginType ? defaultPluginKinds?.[defaultPluginType] : undefined;
  const defaultPluginSelection =
    defaultPluginType && defaultPluginKind
      ? {
          type: defaultPluginType,
          kind: defaultPluginKind,
        }
      : undefined;
  const initPendingSelection = !value.selection && defaultPluginSelection ? defaultPluginSelection : undefined;

  // When kind changes and we haven't loaded that plugin before, we will need to enter a "pending" state so that we
  // can generate proper initial spec values that match the new plugin kind
  const [pendingSelection, setPendingSelection] = useState<PluginEditorSelection | undefined>(initPendingSelection);

  // Take a default kind in case user write explicitly an empty kind in the initial value
  useEffect(() => {
    if (value.selection.kind === '') {
      value.selection.kind = defaultPluginKind || '';
    }
  }, [value.selection, defaultPluginKind]);

  const { data: plugin, isFetching, error } = usePlugin(pendingSelection?.type, pendingSelection?.kind || '');

  useEffect(() => {
    // Nothing to do if no new plugin kind is pending
    if (!pendingSelection) return;

    // Can't get spec value until we have a plugin
    if (plugin === undefined) return;

    // Fire an onChange to change to the pending kind with initial values from the plugin
    rememberCurrentSpecState();
    onChange({
      selection: pendingSelection,
      spec: plugin.createInitialOptions(),
    });

    if (pendingSelection.type === 'Panel') {
      const panelPlugin = plugin as PanelPlugin;
      hideQueryState.current[pendingSelection.kind] = !!panelPlugin.hideQueryEditor;
      if (!!panelPlugin.hideQueryEditor !== hideQueryState.current[value.selection.kind]) {
        onHideQuery(!!panelPlugin.hideQueryEditor);
      }
    }
    setPendingSelection(undefined);
  }, [pendingSelection, plugin, rememberCurrentSpecState, onChange, onHideQuery, hideQueryState, value.selection]);

  /**
   * When the user tries to change the plugin kind, make sure we have the correct spec for that plugin kind before we
   * make the switch.
   */
  const onSelectionChange: PluginKindSelectProps['onChange'] = (nextSelection) => {
    // If we already have state for this plugin type/kind from a previous selection, just use it
    const previousState = prevSpecState.current[nextSelection.type]?.[nextSelection.kind];
    if (previousState !== undefined) {
      rememberCurrentSpecState();
      onChange({
        selection: nextSelection,
        spec: previousState,
      });
    } else {
      // Otherwise, kick off the async loading process
      setPendingSelection(nextSelection);
    }

    if (
      nextSelection.type === 'Panel' &&
      hideQueryState.current[nextSelection.kind] !== undefined &&
      hideQueryState.current[value.selection.kind] !== hideQueryState.current[nextSelection.kind]
    ) {
      onHideQuery(!!hideQueryState.current[nextSelection.kind]);
    }
  };

  /**
   * Spec changes are independent and always just set the spec state.
   */
  const onSpecChange: PluginSpecEditorProps['onChange'] = (next) => {
    onChange(
      produce(value, (draft) => {
        draft.spec = next;
      })
    );
  };

  return {
    pendingSelection,
    isLoading: isFetching,
    error,
    onSelectionChange,
    onSpecChange,
    rememberCurrentSpecState,
  };
}
