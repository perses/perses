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

import { Select, SelectProps, MenuItem, Stack, ListItemText } from '@mui/material';
import { ProjectResource } from '@perses-dev/core';
import { useProjectList } from '../context';

// Props on MUI Select that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface ProjectSelectProps extends Omit<SelectProps<string>, OmittedMuiProps> {
  onChange: (next: ProjectResource) => void;
  value: ProjectResource;
}

/**
 * Displays a MUI input for selecting a Project of a particular kind. Note: The 'value' and `onChange` handler for
 * the input deal with a `ProjectSelector`.
 */
export function ProjectSelect(props: ProjectSelectProps) {
  const { onChange, value, ...others } = props;

  const { data, isLoading } = useProjectList();

  // While loading available values, just use an empty string so MUI select doesn't warn about values out of range
  const optionValue = isLoading ? '' : projectToOptionValue(value);

  // When the user makes a selection, convert the string option value back to a DatasourceSelector
  const handleChange: SelectProps<string>['onChange'] = (e) => {
    const next = optionValueToSelector(e.target.value);
    onChange(next);
  };

  // TODO:
  //  - Does this need a loading indicator of some kind?
  //  - The group's edit link is not clickable once selected.
  //  - The group's edit link is disabled if datasource is overridden.
  //    Ref: https://github.com/mui/material-ui/issues/36572
  return (
    <Select {...others} value={optionValue} onChange={handleChange}>
      <MenuItem value={'none'}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" height={32}>
          <ListItemText>None</ListItemText>
        </Stack>
      </MenuItem>
      {data?.map((project: ProjectResource) => [
        <MenuItem key={project.metadata.name} value={project.metadata.name}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" height={32}>
            <ListItemText>{project.metadata.name}</ListItemText>
          </Stack>
        </MenuItem>,
      ])}
    </Select>
  );
}

/**
 * Given a ProjectSelectItemSelector,
 * returns a string value that can be used as a Select input value.
 * @param selector
 */
function projectToOptionValue(project: ProjectResource): string {
  return project.metadata.name ?? 'none';
}

/**
 * Given an option value name,
 * returns a ProjectResource to be used by the query data model.
 * @param optionValue
 */
function optionValueToSelector(optionValue: string): ProjectResource {
  return {
    kind: 'Project',
    metadata: {
      name: optionValue,
    },
  };
}
