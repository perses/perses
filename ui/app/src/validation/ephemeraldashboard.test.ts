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

import { zodResolver } from '@hookform/resolvers/zod';

import {
  createEphemeralDashboardDialogValidationSchema,
  updateEphemeralDashboardDialogValidationSchema,
} from './ephemeraldashboard';

describe.each([
  ['create', createEphemeralDashboardDialogValidationSchema],
  ['update', updateEphemeralDashboardDialogValidationSchema],
] as const)('%s ephemeral dashboard duration validation', (_, schema) => {
  const resolver = zodResolver(schema);
  const options = { fields: {}, shouldUseNativeValidation: false };

  it('accepts a valid duration through the form resolver', async () => {
    const values = { projectName: 'my-project', dashboardName: 'My dashboard', ttl: '1h30m' };
    const result = await resolver(values, {}, options);

    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({ dashboardName: 'My dashboard', ttl: '1h30m' });
  });

  it.each([
    ['', 'Required'],
    ['invalid', 'Must be a valid duration string'],
  ])('returns a field error for duration %j', async (ttl, message) => {
    const values = { projectName: 'my-project', dashboardName: 'My dashboard', ttl };
    const result = await resolver(values, {}, options);

    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({ ttl: { message } });
  });
});
