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

import { Stack, TextField, FormControl, InputLabel, Grid } from '@mui/material';
import { DatasourceSelect, ProjectSelect, useProjectStore } from '@perses-dev/plugin-system';
import { DatasourceSelector, ProjectResource } from '@perses-dev/core/dist/model';
import { DEFAULT_PROM, DurationString, PROM_DATASOURCE_KIND, PrometheusDatasourceSelector } from '../../model';
import { PromQLEditor } from '../../components';

interface ExplorePrometheusTimeSeriesQueryEditorProps {
  selectedDatasource: PrometheusDatasourceSelector;
  handleDatasourceChange: (next: DatasourceSelector) => void;
  promURL: string | undefined;
  query: string;
  handleQueryChange: (e: string) => void;
  handleQueryBlur: () => void;
  format: string | undefined;
  handleFormatChange: (e: string) => void;
  handleFormatBlur: () => void;
  minStepPlaceholder: string;
  minStep: string | undefined;
  handleMinStepChange: (e: DurationString) => void;
  handleMinStepBlur: () => void;
}

export function ExplorePrometheusTimeSeriesQueryEditor(props: ExplorePrometheusTimeSeriesQueryEditorProps) {
  const {
    selectedDatasource,
    handleDatasourceChange,
    promURL,
    query,
    handleQueryChange,
    handleQueryBlur,
    format,
    handleFormatBlur,
    handleMinStepChange,
    handleFormatChange,
    handleMinStepBlur,
    minStepPlaceholder,
    minStep,
  } = props;

  const { project, setProject } = useProjectStore();

  const handleProjectChange = (next: ProjectResource) => {
    handleDatasourceChange(DEFAULT_PROM);
    return setProject(next);
  };

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <FormControl margin="dense" fullWidth={true}>
            {/* TODO: How do we ensure unique ID values if there are multiple of these? Can we use React 18 useId and
                maintain 17 compatibility somehow with a polyfill/shim? */}
            <InputLabel id="project-label">Projects</InputLabel>
            <ProjectSelect labelId="project-label" label="Projects" value={project} onChange={handleProjectChange} />
          </FormControl>
        </Grid>
        <Grid item>
          <FormControl margin="dense" fullWidth={true}>
            {/* TODO: How do we ensure unique ID values if there are multiple of these? Can we use React 18 useId and
                maintain 17 compatibility somehow with a polyfill/shim? */}
            <InputLabel id="prom-datasource-label">Prometheus Datasource</InputLabel>
            <DatasourceSelect
              datasourcePluginKind={PROM_DATASOURCE_KIND}
              value={selectedDatasource}
              project={project.metadata.name}
              onChange={handleDatasourceChange}
              labelId="prom-datasource-label"
              label="Prometheus Datasource"
            />
          </FormControl>
        </Grid>
      </Grid>
      <PromQLEditor
        completeConfig={{ remote: { url: promURL } }}
        value={query}
        onChange={handleQueryChange}
        onBlur={handleQueryBlur}
      />
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          label="Legend Name"
          placeholder="Tip: Use {{label_name}}. Example: {{instance}} will be replaced with values such as 'webserver-123' and 'webserver-456'."
          helperText="Name for each series in the legend and the tooltip."
          value={format ?? ''}
          onChange={(e) => handleFormatChange(e.target.value)}
          onBlur={handleFormatBlur}
        />
        <TextField
          label="Min Step"
          placeholder={minStepPlaceholder}
          helperText="Step parameter of the query. Used by $__interval and $__rate_interval too."
          value={minStep}
          onChange={(e) => handleMinStepChange(e.target.value as DurationString)}
          onBlur={handleMinStepBlur}
          sx={{ width: '250px' }}
        />
      </Stack>
    </Stack>
  );
}
