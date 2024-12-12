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

import { ErrorAlert, JSONEditor, LinksEditor } from '@perses-dev/components';
import { PanelDefinition, PanelEditorValues, QueryDefinition, UnknownSpec } from '@perses-dev/core';
import { Control, Controller } from 'react-hook-form';
import { QueryCountProvider, usePlugin } from '../../runtime';
import { PanelPlugin } from '../../model';
import { OptionsEditorTabsProps, OptionsEditorTabs } from '../OptionsEditorTabs';
import { MultiQueryEditor } from '../MultiQueryEditor';

export interface PanelSpecEditorProps {
  control: Control<PanelEditorValues>;
  panelDefinition: PanelDefinition;
  onQueriesChange: (queries: QueryDefinition[]) => void;
  onPluginSpecChange: (spec: UnknownSpec) => void;
  onJSONChange: (panelDefinitionStr: string) => void;
}

export function PanelSpecEditor(props: PanelSpecEditorProps) {
  const { control, panelDefinition, onJSONChange, onQueriesChange, onPluginSpecChange } = props;
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
    tabs.push({
      label: 'Query',
      content: (
        <Controller
          control={control}
          name="panelDefinition.spec.queries"
          render={({ field }) => (
            <MultiQueryEditor
              queryTypes={plugin.supportedQueryTypes ?? []}
              queries={panelDefinition.spec.queries ?? []}
              onChange={(queries) => {
                field.onChange(queries);
                onQueriesChange(queries);
              }}
            />
          )}
        />
      ),
    });
  }

  if (panelOptionsEditorComponents !== undefined) {
    tabs = tabs.concat(
      panelOptionsEditorComponents.map(({ label, content: OptionsEditorComponent }) => ({
        label,
        content: (
          <Controller
            control={control}
            name="panelDefinition.spec.plugin.spec"
            render={({ field }) => (
              <OptionsEditorComponent
                value={panelDefinition.spec.plugin.spec}
                onChange={(spec) => {
                  field.onChange(spec);
                  onPluginSpecChange(spec);
                }}
              />
            )}
          />
        ),
      }))
    );
  }

  // always show json editor and links editor by default
  tabs.push({
    label: 'Links',
    content: <LinksEditor control={control} />,
  });
  tabs.push({
    label: 'JSON',
    content: (
      <Controller
        control={control}
        name="panelDefinition"
        render={({ field }) => (
          <JSONEditor
            maxHeight="80vh"
            value={panelDefinition}
            onChange={(json) => {
              field.onChange(JSON.parse(json));
              onJSONChange(json);
            }}
          />
        )}
      />
    ),
  });

  return (
    <QueryCountProvider queryCount={(panelDefinition.spec.queries ?? []).length}>
      <OptionsEditorTabs key={tabs.length} tabs={tabs} />
    </QueryCountProvider>
  );
}
