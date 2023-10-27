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

import { produce } from 'immer';
import { DatasourceSelectProps, useDatasource, useDatasourceClient } from '@perses-dev/plugin-system';
import { DEFAULT_PROM, isDefaultPromSelector, isPrometheusDatasourceSelector, PrometheusClient } from '../../model';
import { DEFAULT_SCRAPE_INTERVAL, PrometheusDatasourceSpec } from '../types';
import {
  PrometheusTimeSeriesQueryEditorProps,
  useQueryState,
  useFormatState,
  useMinStepState,
} from './query-editor-model';
import { DashboardPrometheusTimeSeriesQueryEditor } from './DashboardPrometheusTimeSeriesQueryEditor';
import { ExplorePrometheusTimeSeriesQueryEditor } from './ExplorePrometheusTimeSeriesQueryEditor';

/**
 * The options editor component for editing a PrometheusTimeSeriesQuery's spec.
 */
export function PrometheusTimeSeriesQueryEditor(props: PrometheusTimeSeriesQueryEditorProps) {
  const { onChange, value, isExplore } = props;
  const { datasource } = value;
  const selectedDatasource = datasource ?? DEFAULT_PROM;

  const { data: client } = useDatasourceClient<PrometheusClient>(selectedDatasource);
  const promURL = client?.options.datasourceUrl;
  const { data: datasourceResource } = useDatasource(selectedDatasource);

  const { query, handleQueryChange, handleQueryBlur } = useQueryState(props);
  const { format, handleFormatChange, handleFormatBlur } = useFormatState(props);
  const { minStep, handleMinStepChange, handleMinStepBlur } = useMinStepState(props);
  const minStepPlaceholder =
    minStep ??
    (datasourceResource && (datasourceResource?.plugin.spec as PrometheusDatasourceSpec).scrapeInterval) ??
    DEFAULT_SCRAPE_INTERVAL;

  const handleDatasourceChange: DatasourceSelectProps['onChange'] = (next) => {
    if (isPrometheusDatasourceSelector(next)) {
      onChange(
        produce(value, (draft) => {
          // If they're using the default, just omit the datasource prop (i.e. set to undefined)
          const nextDatasource = isDefaultPromSelector(next) ? undefined : next;
          draft.datasource = nextDatasource;
        })
      );
      return;
    }

    throw new Error('Got unexpected non-Prometheus datasource selector');
  };

  if (isExplore) {
    return (
      <ExplorePrometheusTimeSeriesQueryEditor
        selectedDatasource={selectedDatasource}
        handleDatasourceChange={handleDatasourceChange}
        promURL={promURL}
        query={query}
        handleQueryChange={handleQueryChange}
        handleQueryBlur={handleQueryBlur}
        format={format}
        handleFormatChange={handleFormatChange}
        handleFormatBlur={handleFormatBlur}
        minStepPlaceholder={minStepPlaceholder}
        minStep={minStep}
        handleMinStepChange={handleMinStepChange}
        handleMinStepBlur={handleMinStepBlur}
      />
    );
  }

  return (
    <DashboardPrometheusTimeSeriesQueryEditor
      selectedDatasource={selectedDatasource}
      handleDatasourceChange={handleDatasourceChange}
      promURL={promURL}
      query={query}
      handleQueryChange={handleQueryChange}
      handleQueryBlur={handleQueryBlur}
      format={format}
      handleFormatChange={handleFormatChange}
      handleFormatBlur={handleFormatBlur}
      minStepPlaceholder={minStepPlaceholder}
      minStep={minStep}
      handleMinStepChange={handleMinStepChange}
      handleMinStepBlur={handleMinStepBlur}
    />
  );
}
