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

import { usePanelPlugin } from '@perses-dev/plugin-system';
import { useEffect } from 'react';

export interface PanelOptionsEditorProps {
  kind: string;
  value: unknown;
  onChange: (next: unknown) => void;
}

export function PanelOptionsEditor(props: PanelOptionsEditorProps) {
  const { kind, value, onChange } = props;
  const { OptionsEditorComponent, createInitialOptions } = usePanelPlugin(kind);

  // When the kind changes, re-init options
  useEffect(() => {
    onChange(createInitialOptions());

    // TODO: See if we can switch up plugin loading so this happens as part of selecting the plugin kind so we don't
    // need this effect at all
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return <OptionsEditorComponent value={value} onChange={onChange} />;
}
