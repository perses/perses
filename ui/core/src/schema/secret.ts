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
import { metadataSchema, projectMetadataSchema } from './metadata';

export const secretSpecSchema = z
  .object({
    basicAuth: z
      .object({
        username: z.string().min(1),
        password: z.string().optional(),
        passwordFile: z.string().optional(),
      })
      .superRefine((val, ctx) => {
        if (val.password && val.password.length > 0 && val.passwordFile && val.passwordFile.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['password'],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['passwordFile'],
          });
        }
      })
      .optional(),
    authorization: z
      .object({
        type: z.string().optional(),
        credentials: z.string().optional(),
        credentialsFile: z.string().optional(),
      })
      .superRefine((val, ctx) => {
        if (val.credentials && val.credentials.length > 0 && val.credentialsFile && val.credentialsFile.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['credentials'],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['credentialsFile'],
          });
        }
      })
      .optional(),
    tlsConfig: z
      .object({
        ca: z.string().optional(),
        cert: z.string().optional(),
        key: z.string().optional(),
        caFile: z.string().optional(),
        certFile: z.string().optional(),
        keyFile: z.string().optional(),
        serverName: z.string().optional(),
        insecureSkipVerify: z.boolean(),
      })
      .superRefine((val, ctx) => {
        if (val.ca && val.ca.length > 0 && val.caFile && val.caFile.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['ca'],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['caFile'],
          });
        }

        if (val.cert && val.cert.length > 0 && val.certFile && val.certFile.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['cert'],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['certFile'],
          });
        }

        if (val.key && val.key.length > 0 && val.keyFile && val.keyFile.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['key'],
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Only one of the fields must be defined',
            path: ['keyFile'],
          });
        }
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.basicAuth && val.authorization) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one of the fields must be defined',
        path: ['basicAuth'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one of the fields must be defined',
        path: ['authorization'],
      });
    }
  });

export const secretSchema = z.object({
  kind: z.literal('Secret'),
  metadata: projectMetadataSchema,
  spec: secretSpecSchema,
});

export const globalSecretSchema = z.object({
  kind: z.literal('GlobalSecret'),
  metadata: metadataSchema,
  spec: secretSpecSchema,
});

export const secretsEditorSchema = z.discriminatedUnion('kind', [secretSchema, globalSecretSchema]);

export type SecretsEditorSchemaType = z.infer<typeof secretsEditorSchema>;
