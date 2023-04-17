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

import { ErrorAlert, JSONEditor } from '@perses-dev/components';
import { PanelDefinition, QueryDefinition, UnknownSpec } from '@perses-dev/core';
import { usePlugin } from '../../runtime';
import { PanelPlugin } from '../../model';
import { OptionsEditorTabsProps, OptionsEditorTabs } from '../OptionsEditorTabs';
import { TimeSeriesQueryEditor } from '../TimeSeriesQueryEditor';

export interface PanelSpecEditorProps {
  panelDefinition: PanelDefinition;
  onQueriesChange: (queries: QueryDefinition[]) => void;
  onPluginSpecChange: (spec: UnknownSpec) => void;
  onJSONChange: (panelDefinition: PanelDefinition) => void;
}

export function PanelSpecEditor(props: PanelSpecEditorProps) {
  const { panelDefinition, onJSONChange, onQueriesChange, onPluginSpecChange } = props;
  const { kind } = panelDefinition.spec.plugin;
  const { data: plugin, isLoading, error } = usePlugin('Panel', kind);

  if (error) {
    return <ErrorAlert error={error} />;
  }

  // TODO: Proper loading indicator
  if (isLoading) {
    return null;
  }

  if (plugin === undefined) {
    throw new Error(`Missing implementation for panel plugin with kind '${kind}'`);
  }

  const { panelOptionsEditorComponents, hideQueryEditor } = plugin as PanelPlugin;
  let tabs: OptionsEditorTabsProps['tabs'] = [];

  if (!hideQueryEditor) {
    // Since we only support TimeSeriesQuery for now, we will always show a TimeSeriesQueryEditor
    tabs.push({
      label: 'Query',
      content: <TimeSeriesQueryEditor queries={panelDefinition.spec.queries ?? []} onChange={onQueriesChange} />,
    });
  }

  if (panelOptionsEditorComponents !== undefined) {
    tabs = tabs.concat(
      panelOptionsEditorComponents.map(({ label, content: OptionsEditorComponent }) => ({
        label,
        content: <OptionsEditorComponent value={panelDefinition.spec.plugin.spec} onChange={onPluginSpecChange} />,
      }))
    );
  }

  // always show json editor by default
  tabs.push({ label: 'JSON', content: <JSONEditor value={panelDefinition} onChange={onJSONChange} /> });

  return <OptionsEditorTabs key={tabs.length} tabs={tabs} />;
}
