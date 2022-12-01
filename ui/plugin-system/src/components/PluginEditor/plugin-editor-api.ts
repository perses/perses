// Copyright 2022 The Perses Authors
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
import { Definition, UnknownSpec, useEvent } from '@perses-dev/core';
import { useState, useRef, useEffect } from 'react';
import { produce } from 'immer';
import { PluginType } from '../../model';
import { PluginKindSelectProps } from '../PluginKindSelect';
import { PluginSpecEditorProps } from '../PluginSpecEditor';
import { usePlugin, usePluginRegistry } from '../../runtime';

// Props on MUI Box that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface PluginEditorProps extends Omit<BoxProps, OmittedMuiProps> {
  pluginType: PluginType;
  pluginKindLabel: string;
  value: Definition<UnknownSpec>;
  onChange: (next: Definition<UnknownSpec>) => void;
}

type PreviousSpecState = Record<string, Record<string, UnknownSpec>>;

/**
 * Props needed by the usePluginEditor hook.
 */
export type UsePluginEditorProps = Pick<PluginEditorProps, 'pluginType' | 'value' | 'onChange'>;

/**
 * Returns the state/handlers that power the `PluginEditor` component. Useful for custom components that want to provide
 * a different UI, but want the same behavior of changing `kind` and `spec` together on plugin kind changes. Also
 * remembers previous `spec` values that it's seen, allowing and restores those values if a user switches the plugin
 * kind back.
 */
export function usePluginEditor(props: UsePluginEditorProps) {
  const { pluginType, value } = props;

  // Keep a stable reference so we don't run the effect below when we don't need to
  const onChange = useEvent(props.onChange);

  // The previous spec state for PluginType and kind and a helper function for remembering current values
  const prevSpecState = useRef<PreviousSpecState>({
    [pluginType]: { [value.kind]: value.spec },
  });

  const rememberCurrentSpecState = useEvent(() => {
    let byPluginType = prevSpecState.current[pluginType];
    if (byPluginType === undefined) {
      byPluginType = {};
      prevSpecState.current[pluginType] = byPluginType;
    }
    byPluginType[value.kind] = value.spec;
  });

  const { defaultPluginKinds } = usePluginRegistry();
  const initPendingKind = value.kind || defaultPluginKinds?.[pluginType] || '';

  // When kind changes and we haven't loaded that plugin before, we will need to enter a "pending" state so that we
  // can generate proper initial spec values that match the new plugin kind
  const [pendingKind, setPendingKind] = useState(initPendingKind);
  const { data: plugin, isFetching, error } = usePlugin(pluginType, pendingKind);

  useEffect(() => {
    // Nothing to do if no new plugin kind is pending
    if (pendingKind === '') return;

    // Can't get spec value until we have a plugin
    if (plugin === undefined) return;

    // Fire an onChange to change to the pending kind with initial values from the plugin
    rememberCurrentSpecState();
    onChange({
      kind: pendingKind,
      spec: plugin.createInitialOptions(),
    });
    setPendingKind('');
  }, [pendingKind, plugin, rememberCurrentSpecState, onChange]);

  /**
   * When the user tries to change the plugin kind, make sure we have the correct spec for that plugin kind before we
   * make the switch.
   */
  const onKindChange: PluginKindSelectProps['onChange'] = (e) => {
    const nextKind = e.target.value;

    // If we already have state for this plugin type/kind from a previous selection, just use it
    const previousState = prevSpecState.current[pluginType]?.[nextKind];
    if (previousState !== undefined) {
      rememberCurrentSpecState();
      onChange({
        kind: nextKind,
        spec: previousState,
      });
      return;
    }

    // Otherwise, kick off the async loading process
    setPendingKind(nextKind);
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

  return { pendingKind, isLoading: isFetching, error, onKindChange, onSpecChange };
}
