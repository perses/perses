// Copyright 2022 The Perses Authors
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

import { VariableValue, VariableDefinition } from '@perses-dev/core';
import { QueryParamConfig, useQueryParams } from 'use-query-params';

const variableQueryParameterPrefix = 'var-';

export function getURLQueryParamName(name: string) {
  return `${variableQueryParameterPrefix}${name}`;
}

export function encodeVariableValue(value: VariableValue) {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return value;
}

export function decodeVariableValue(value: string): VariableValue {
  if (!value) {
    return null;
  }
  const values = value.split(',');
  if (values.length === 1) {
    return values[0] as string;
  }
  return values;
}

const VariableValueParam: QueryParamConfig<VariableValue> = {
  encode: encodeVariableValue,
  decode: (v) => {
    if (typeof v === 'string') {
      return decodeVariableValue(v);
    }
    return '';
  },
};

export function useVariableQueryParams(defs: VariableDefinition[]) {
  const config: Record<string, typeof VariableValueParam> = {};
  defs.forEach((def) => {
    const name = getURLQueryParamName(def.spec.name);
    config[name] = VariableValueParam;
  });
  return useQueryParams(config, { updateType: 'replaceIn' });
}

export function getInitalValuesFromQueryParameters(
  queryParamValues: Record<string, VariableValue>
): Record<string, VariableValue> {
  const values: Record<string, VariableValue> = {};
  Object.keys(queryParamValues).forEach((key) => {
    const value = queryParamValues[key];
    if (!value) {
      return;
    }
    const name = key.replace(variableQueryParameterPrefix, '');
    values[name] = value;
  });
  return values;
}
