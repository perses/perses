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
import { generateMetadataName } from '../utils/metadata';

export const projectDisplayNameValidationSchema = z
  .string()
  .min(1, 'Required')
  .max(75, 'Must be 75 or fewer characters long');

export const createProjectDialogValidationSchema = z.object({
  projectName: projectDisplayNameValidationSchema,
});
export type CreateProjectValidationType = z.infer<typeof createProjectDialogValidationSchema>;

// Validate project name and check if it doesn't already exist
export function useProjectValidationSchema(): z.Schema {
  const projects = useProjectList();

  return useMemo(() => {
    return createProjectDialogValidationSchema.refine(
      (schema) => {
        return !(projects.data ?? []).some(
          (project) => project.metadata.name === generateMetadataName(schema.projectName)
        );
      },
      (schema) => ({ message: `Project name '${schema.projectName}' already exists!`, path: ['projectName'] })
    );
  }, [projects.data]);
}
