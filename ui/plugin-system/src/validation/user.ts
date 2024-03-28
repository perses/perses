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
import { resourceIdValidationSchema } from './resource';

const nativeProviderSchema = z.object({
  password: z.string().optional(),
});

const oauthProvidersSchema = z.object({
  issuer: z.string().optional(),
  email: z.string().optional(),
  subject: z.string().optional(),
});

// TODO: handle exclusion native / oauth?
const userSpecSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nativeProvider: nativeProviderSchema.optional(),
  oauthProviders: z.array(oauthProvidersSchema).optional(),
});

export const userEditorValidationSchema = z.object({
  kind: z.literal('User'),
  metadata: z.object({
    name: resourceIdValidationSchema,
  }),
  spec: userSpecSchema,
});

export type UserEditorValidationType = z.infer<typeof userEditorValidationSchema>;
