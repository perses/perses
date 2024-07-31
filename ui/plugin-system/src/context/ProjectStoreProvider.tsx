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

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ReactNode, createContext, useContext, useMemo } from 'react';
import { fetchJson, ProjectResource } from '@perses-dev/core';
import { useSetProjectParams } from './query-params';

export interface ProjectStore {
  setProject: (project: ProjectResource) => void;
  project: ProjectResource;
}

export interface ProjectStoreProviderProps {
  children?: ReactNode;
  enabledURLParams?: boolean;
}

export const ProjectStoreContext = createContext<ProjectStore | undefined>(undefined);

export function useProjectList(): UseQueryResult<ProjectResource[], Error> {
  return useQuery<ProjectResource[], Error>({
    queryKey: ['projects'],
    queryFn: () => {
      return fetchJson<ProjectResource[]>('/api/v1/projects');
    },
  });
}

export function useProjectStore() {
  const ctx = useContext(ProjectStoreContext);
  if (ctx === undefined) {
    throw new Error('No ProjectStoreContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function ProjectStoreProvider(props: ProjectStoreProviderProps) {
  const { children, enabledURLParams } = props;
  const { project, setProject } = useSetProjectParams(enabledURLParams);

  const contextValue = useMemo(
    () => ({
      project: {
        kind: 'Project',
        metadata: {
          name: project,
        },
      } as ProjectResource,
      setProject: (project: ProjectResource) => {
        setProject(project.metadata.name);
      },
    }),
    [project, setProject]
  );

  return <ProjectStoreContext.Provider value={contextValue}>{children}</ProjectStoreContext.Provider>;
}
