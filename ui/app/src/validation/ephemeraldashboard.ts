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

import { z } from 'zod';
import { useMemo } from 'react';
import { durationValidationSchema, nameSchema } from '@perses-dev/core';
import { generateMetadataName } from '../utils/metadata';
import { useEphemeralDashboardList } from '../model/ephemeral-dashboard-client';
import { dashboardDisplayNameValidationSchema } from './dashboard';

export const createEphemeralDashboardDialogValidationSchema = z.object({
  projectName: nameSchema,
  dashboardName: dashboardDisplayNameValidationSchema,
  ttl: durationValidationSchema,
});
export type CreateEphemeralDashboardValidationType = z.infer<typeof createEphemeralDashboardDialogValidationSchema>;

export const updateEphemeralDashboardDialogValidationSchema = z.object({
  dashboardName: dashboardDisplayNameValidationSchema,
  ttl: durationValidationSchema,
});
export type UpdateEphemeralDashboardValidationType = z.infer<typeof updateEphemeralDashboardDialogValidationSchema>;

export function useEphemeralDashboardValidationSchema(projectName?: string) {
  const dashboards = useEphemeralDashboardList(projectName);

  return useMemo(() => {
    return createEphemeralDashboardDialogValidationSchema.refine(
      (schema) => {
        return (
          (dashboards.data ?? []).filter(
            (dashboard) =>
              dashboard.metadata.project === schema.projectName &&
              dashboard.metadata.name === generateMetadataName(schema.dashboardName) &&
              dashboard.spec.ttl === schema.ttl
          ).length === 0
        );
      },
      (schema) => ({
        message: `Ephemeral Dashboard name '${schema.dashboardName}' already exists in '${schema.projectName}' project!`,
        path: ['dashboardName'],
      })
    );
  }, [dashboards.data]);
}
