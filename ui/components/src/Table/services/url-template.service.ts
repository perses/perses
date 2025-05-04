// Copyright 2025 The Perses Authors
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

import { isNil } from 'lodash';

/* eslint-disable */
export const replaceCellVariables = (
  urlTemplate: string | undefined,
  columnName: string,
  cellValue: any,
  rowData: any
): string | undefined => {
  if (!urlTemplate) return undefined;

  let result = urlTemplate;

  result = result.replace(/\${__field\.name}/g, columnName || '');

  result = result.replace(/\${__value\.text}/g, cellValue !== null && cellValue !== undefined ? String(cellValue) : '');

  result = result.replace(/\${__data\.fields\.([^}]+)}/g, (match, fieldName) => {
    let value;
    try {
      const parts = fieldName.split('.');
      let current = rowData;

      for (const part of parts) {
        if (isNil(current)) {
          return '';
        }
        current = current[part];
      }

      value = current;
    } catch (e) {
      value = undefined;
    }

    return value !== null && value !== undefined ? String(value) : '';
  });

  return result;
};
