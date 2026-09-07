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

import { roleBindingsEditorSchema, rolesEditorSchema, userSchema } from '@perses-dev/client';

import { formSchema } from './formSchema';

it.each([
  {
    name: 'role permissions',
    schema: formSchema(rolesEditorSchema),
    value: {
      kind: 'Role',
      metadata: { name: 'reader', project: 'test' },
      spec: { permissions: [{ actions: [], scopes: ['Dashboard'] }] },
    },
    path: ['spec', 'permissions', 0, 'actions'],
  },
  {
    name: 'role binding subjects',
    schema: formSchema(roleBindingsEditorSchema),
    value: {
      kind: 'RoleBinding',
      metadata: { name: 'readers', project: 'test' },
      spec: { role: 'reader', subjects: [] },
    },
    path: ['spec', 'subjects'],
  },
  {
    name: 'user name',
    schema: formSchema(userSchema),
    value: { kind: 'User', metadata: { name: '' }, spec: {} },
    path: ['metadata', 'name'],
  },
])('preserves client validation for $name', ({ schema, value, path }) => {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path })]));
  }
});

it('returns the parsed resource without unknown fields', () => {
  const schema = formSchema(userSchema);
  const result = schema.parse({ kind: 'User', metadata: { name: 'alice' }, spec: {}, unexpected: 'discard' });
  expect(result).toEqual({ kind: 'User', metadata: { name: 'alice' }, spec: {} });
});
