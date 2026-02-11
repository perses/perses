// Copyright The Perses Authors
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
import { nameSchema } from '@perses-dev/core';
import { useDashboardList } from '../model/dashboard-client';
import { generateMetadataName } from '../utils/metadata';

export const dashboardDisplayNameValidationSchema = z
  .string()
  .min(1, 'Required')
  .max(75, 'Must be 75 or fewer characters long');

export const tagsValidationSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag must be 50 or fewer characters long')
      .regex(/^[a-z0-9 _-]+$/, 'Tag can only contain lowercase letters, numbers, spaces, hyphens, and underscores')
  )
  .max(20, 'Must be 20 or fewer tags')
  .optional()
  .default([])
  .transform((tags) => Array.from(new Set(tags.map((tag) => tag.toLowerCase()))));

export const createDashboardDialogValidationSchema = z.object({
  projectName: nameSchema,
  dashboardName: dashboardDisplayNameValidationSchema,
  tags: tagsValidationSchema,
});
export type CreateDashboardValidationType = z.infer<typeof createDashboardDialogValidationSchema>;

export const editDashboardDialogValidationSchema = z.object({
  dashboardName: dashboardDisplayNameValidationSchema,
  tags: tagsValidationSchema,
});
export type EditDashboardValidationType = z.infer<typeof editDashboardDialogValidationSchema>;

export interface DashboardValidationSchema {
  schema?: z.ZodSchema;
  isSchemaLoading: boolean;
  hasSchemaError: boolean; // TODO: Later use it with a goog error handling design
}

// Validate dashboard name and check if it doesn't already exist
export function useDashboardValidationSchema(projectName?: string): DashboardValidationSchema {
  const { data: dashboards, isLoading: isDashboardsLoading, isError } = useDashboardList({ project: projectName });
  return useMemo((): DashboardValidationSchema => {
    if (isDashboardsLoading)
      return {
        schema: undefined,
        isSchemaLoading: true,
        hasSchemaError: false,
      };

    if (isError) {
      return {
        hasSchemaError: true,
        isSchemaLoading: false,
        schema: undefined,
      };
    }

    if (!dashboards?.length)
      return { schema: createDashboardDialogValidationSchema, isSchemaLoading: true, hasSchemaError: false };

    const refinedSchema = createDashboardDialogValidationSchema.refine(
      (schema) => {
        return !(dashboards ?? []).some((dashboard) => {
          return (
            dashboard.metadata.project.toLowerCase() === schema.projectName.toLowerCase() &&
            dashboard.metadata.name.toLowerCase() === generateMetadataName(schema.dashboardName).toLowerCase()
          );
        });
      },
      (schema) => ({
        message: `Dashboard name '${schema.dashboardName}' already exists in '${schema.projectName}' project!`,
        path: ['dashboardName'],
      })
    );

    return { schema: refinedSchema, isSchemaLoading: true, hasSchemaError: false };
  }, [dashboards, isDashboardsLoading, isError]);
}
