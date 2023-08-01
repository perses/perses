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
import { useDatasourceList } from '../../../model/datasource-client';
import { DatasourceList } from '../../../components/DatasourceList/DatasourceList';

interface ProjectDatasourcesProps {
  projectName: string;
  hideToolbar?: boolean;
  id?: string;
}

export function ProjectDatasources(props: ProjectDatasourcesProps) {
  const { projectName, hideToolbar, id } = props;
  const { data, isLoading } = useDatasourceList(projectName);

  return (
    <Card id={id}>
      <DatasourceList
        projectName={projectName}
        datasourceList={data || []}
        hideToolbar={hideToolbar}
        isLoading={isLoading}
        initialState={{
          columns: {
            columnVisibilityModel: {
              project: false,
              version: false,
            },
          },
        }}
      />
    </Card>
  );
}
