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

import { MappedValue, ValueMapping } from '../model';
import { createRegexFromString } from './regexp';

export function applyValueMapping(value: number | string, mappings: ValueMapping[] = []): MappedValue {
  if (!mappings.length) {
    return { value };
  }

  const mappedItem: MappedValue = { value };

  mappings.forEach((mapping) => {
    switch (mapping.kind) {
      case 'Value': {
        const valueOptions = mapping.spec;

        if (String(valueOptions.value) === String(value)) {
          mappedItem.value = valueOptions.result.value;
          mappedItem.color = valueOptions.result.color;
        }
        break;
      }
      case 'Range': {
        const rangeOptions = mapping.spec;
        const newValue = value as number;
        if (newValue >= rangeOptions.from && newValue <= rangeOptions.to) {
          mappedItem.value = rangeOptions.result.value;
          mappedItem.color = rangeOptions.result.color;
        }
        break;
      }
      case 'Regex': {
        const regexOptions = mapping.spec;
        const stringValue = value.toString();

        if (!regexOptions.pattern) {
          break;
        }

        const regex = createRegexFromString(regexOptions.pattern);

        if (stringValue.match(regex)) {
          if (regexOptions.result.value !== null) {
            mappedItem.value = stringValue.replace(regex, regexOptions.result.value.toString() || '');
            mappedItem.color = regexOptions.result.color;
          }
        }
        break;
      }
      case 'Misc': {
        const miscOptions = mapping.spec;
        if (isMiscValueMatch(miscOptions.value, value)) {
          mappedItem.value = miscOptions.result.value;
          mappedItem.color = miscOptions.result.color;
        }
        break;
      }
      default:
        break;
    }
  });
  return mappedItem;
}

function isMiscValueMatch(miscValue: string, value: number | string | boolean): boolean {
  switch (miscValue) {
    case 'empty':
      return value === '';
    case 'null':
      return value === null || value === undefined;
    case 'NaN':
      return Number.isNaN(value);
    case 'true':
      return value === true;
    case 'false':
      return value === false;
    default:
      return false;
  }
}
