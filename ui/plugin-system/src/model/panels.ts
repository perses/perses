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

import React from 'react';
import { UnknownSpec, PanelDefinition, QueryPluginType } from '@perses-dev/core';
import { OptionsEditorTab } from '../components';
import { QueryOptions } from '../runtime';
import { OptionsEditorProps, Plugin } from './plugin-base';

export type PanelOptionsEditorComponent<T> = Pick<OptionsEditorTab, 'label'> & {
  content: React.ComponentType<OptionsEditorProps<T>>;
};

/**
 * Plugin the provides custom visualizations inside a Panel.
 */
export interface PanelPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  PanelComponent: React.ComponentType<PanelProps<Spec>>;
  /**
   * React components for custom tabs
   */
  panelOptionsEditorComponents?: Array<PanelOptionsEditorComponent<Spec>>;
  /**
   * List of query types supported by this panel.
   * @default [] (no query types supported) only relevant if hideQueryEditor is true
   */
  supportedQueryTypes?: QueryPluginType[];
  /**
   * Static options for the queries that will be executed.
   * Each {@link QueryPluginType} implementation can have its own options.
   * For example see {@link UseTimeSeriesQueryOptions} for time series queries.
   */
  queryOptions?: QueryOptions;
  /**
   * If true, query editor will be hidden for panel plugin
   * @default false
   */
  hideQueryEditor?: boolean;
}

/**
 * The props provided by Perses to a panel plugin's PanelComponent.
 */
export interface PanelProps<Spec> {
  spec: Spec;
  contentDimensions?: {
    width: number;
    height: number;
  };
  definition?: PanelDefinition;
}
