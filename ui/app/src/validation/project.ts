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

import { z } from 'zod';
import { useMemo } from 'react';
import { useProjectList } from '../model/project-client';
import { resourceIdValidationSchema } from './resource';

export const projectNameValidationSchema = z.object({
  name: resourceIdValidationSchema,
});
export type ProjectNameValidationType = z.infer<typeof projectNameValidationSchema>;

export function useProjectValidationSchema() {
  const projects = useProjectList();

  return useMemo(() => {
    return projectNameValidationSchema.refine(
      (schema) => {
        return (projects.data ?? []).filter((project) => project.metadata.name === schema.name).length === 0;
      },
      (schema) => ({ message: `Project name '${schema.name}' already exists!`, path: ['name'] })
    );
  }, [projects.data]);
}
