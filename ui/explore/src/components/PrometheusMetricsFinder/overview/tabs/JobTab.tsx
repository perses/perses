// Copyright 2024 The Perses Authors
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

import { DatasourceSelector } from '@perses-dev/core';
import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  StackProps,
  Typography,
} from '@mui/material';
import { ReactElement, useMemo, useState } from 'react';
import { MetricList } from '../../display/list/MetricList';
import { LabelFilter } from '../../types';
import { useLabelValues } from '../../utils';

export interface JobList extends StackProps {
  job: string;
  filters: LabelFilter[];
  datasource: DatasourceSelector;
  isMetadataEnabled?: boolean;
  onExplore: (metricName: string) => void;
}

export function JobList({ job, filters, datasource, isMetadataEnabled, onExplore, ...props }: JobList): ReactElement {
  const filtersWithJobWithoutName: LabelFilter[] = useMemo(() => {
    const result = filters.filter((filter) => filter.label !== '__name__' && filter.label !== 'job');
    result.push({ label: 'job', labelValues: [job], operator: '=' });
    return result;
  }, [filters, job]);

  const { data, isLoading } = useLabelValues('__name__', filtersWithJobWithoutName, datasource);

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <MetricList
      metricNames={data?.data ?? []}
      datasource={datasource}
      filters={filtersWithJobWithoutName}
      isMetadataEnabled={isMetadataEnabled}
      onExplore={onExplore}
      {...props}
    />
  );
}

export interface JobSection extends StackProps {
  jobs: string[];
  filters: LabelFilter[];
  datasource: DatasourceSelector;
  isMetadataEnabled?: boolean;
  onExplore: (metricName: string) => void;
}

export function JobSection({
  jobs,
  filters,
  datasource,
  isMetadataEnabled,
  onExplore,
  ...props
}: JobSection): ReactElement {
  const [currentJob, setCurrentJob] = useState<string>(jobs[0] ?? '');

  if (!currentJob) {
    return <Typography>Something went wrong...</Typography>;
  }

  return (
    <Stack gap={2} {...props}>
      {jobs.length > 2 && (
        <FormControl fullWidth>
          <InputLabel id="job-select-label">Job</InputLabel>
          <Select
            labelId="job-select-label"
            id="job-select"
            label="Job"
            variant="outlined"
            value={currentJob}
            onChange={(e) => setCurrentJob(e.target.value)}
          >
            {jobs.map((job) => (
              <MenuItem key={job} value={job}>
                {job}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {currentJob && (
        <JobList
          job={currentJob}
          filters={filters}
          datasource={datasource}
          isMetadataEnabled={isMetadataEnabled}
          onExplore={onExplore}
        />
      )}
    </Stack>
  );
}

export interface JobTabProps extends StackProps {
  filters: LabelFilter[];
  datasource: DatasourceSelector;
  isMetadataEnabled?: boolean;
  onExplore: (metricName: string) => void;
}

export function JobTab({ filters, datasource, isMetadataEnabled, onExplore, ...props }: JobTabProps): ReactElement {
  const { data: jobData, isLoading: isJobLoading } = useLabelValues('job', filters, datasource);

  if (isJobLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!jobData?.data || jobData.data.length === 0) {
    return (
      <Stack {...props}>
        <Typography>No jobs found</Typography>
      </Stack>
    );
  }

  return (
    <JobSection
      jobs={jobData.data}
      filters={filters}
      datasource={datasource}
      isMetadataEnabled={isMetadataEnabled}
      onExplore={onExplore}
      {...props}
    />
  );
}
