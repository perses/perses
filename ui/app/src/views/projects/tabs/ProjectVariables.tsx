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

import { Card } from '@mui/material';
import { useEffect, useState } from 'react';
import { ProjectVariableList } from '../../../components/VariableList/ProjectVariableList';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../../../model/datasource-api';
import { useVariableList } from '../../../model/project-client';

interface ProjectVariablesProps {
  projectName: string;
  id?: string;
}

export function ProjectVariables(props: ProjectVariablesProps) {
  const { projectName, id } = props;
  const [datasourceApi] = useState(() => new CachedDatasourceAPI(new HTTPDatasourceAPI()));
  useEffect(() => {
    // warm up the caching of the datasources
    datasourceApi.listDatasources(projectName);
    datasourceApi.listGlobalDatasources();
  }, [datasourceApi, projectName]);

  const { data, isLoading } = useVariableList(projectName);

  // TODO: datagrid utils? + UI tests + improve providers for preview + fix checkbox
  return (
    <Card id={id}>
      <ProjectVariableList
        projectName={projectName}
        variableList={data ?? []}
        isLoading={isLoading}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              project: false,
              name: false,
              version: false,
              createdAt: false,
              updatedAt: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'displayName', sort: 'asc' }],
          },
        }}
      />
    </Card>
  );
}
