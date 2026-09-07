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

import type { FieldValues } from 'react-hook-form';
import { z } from 'zod';

// Client resource schemas accept unknown input. Forms supply typed resources,
// but must still run the client's full validation and preserve its parsed output.
export function formSchema<T extends FieldValues>(schema: z.ZodType<T>): z.ZodType<T, T> {
  return z.custom<T>().transform((value, ctx) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue });
      }
      return z.NEVER;
    }
    return result.data;
  });
}
