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

import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type SingleParamOptions<T> = {
  paramName: string;
  fromParam: (paramValue: string | null) => T;
  toParam: (value: T) => string | null;
};

export type QueryStringSerializer<T> = {
  getValue: (urlParams: URLSearchParams) => T;
  setValue: (urlParams: URLSearchParams, value: T) => void;
};

/**
 * Create query string param getter/setter that can get/set a value from a
 * single param in the query string.
 */
export function singleParam<T>(opts: SingleParamOptions<T>): QueryStringSerializer<T> {
  const { paramName, fromParam, toParam } = opts;
  return {
    getValue: (urlParams) => {
      const paramValue = urlParams.get(paramName);
      return fromParam(paramValue);
    },
    setValue: (urlParams, value) => {
      const paramValue = toParam(value);
      if (paramValue === null) {
        urlParams.delete(paramName);
      } else {
        urlParams.set(paramName, paramValue);
      }
    },
  };
}

export type MultipleParamsOptions<T> = {
  [P in keyof T]: QueryStringSerializer<T[P]>;
};

/**
 * Creates a query string param getter/setter that can get/set a value from
 * multiple query string params. Useful for composing params.
 */
export function multipleParams<T>(opts: MultipleParamsOptions<T>): QueryStringSerializer<T> {
  return {
    getValue: (urlParams) => {
      const value = {} as T;
      for (const key in opts) {
        value[key] = opts[key].getValue(urlParams);
      }
      return value;
    },
    setValue: (urlParams, value) => {
      for (const key in opts) {
        opts[key].setValue(urlParams, value[key]);
      }
    },
  };
}

// Helper to create a string value parameter, assumes empty string is "no value"
export function stringParam(paramName: string, nullValue = '') {
  return singleParam<string>({
    paramName,
    toParam: (value: string) => {
      return value === nullValue ? null : value;
    },
    fromParam: (paramValue: string | null) => {
      return paramValue === null ? nullValue : paramValue;
    },
  });
}

/**
 * Returns a callback for setting a value in the query string
 * util adjust to work with React Router v6
 * https://reactrouter.com/en/v6.3.0/upgrading/v5#use-usenavigate-instead-of-usehistory
 */
export function useSetQueryStringValue<T>(serializer: QueryStringSerializer<T>, pushHistory: boolean) {
  const navigate = useNavigate();
  const location = useLocation();
  const setValue = useCallback(
    (next: T) => {
      const urlParams = new URLSearchParams(location.search);
      serializer.setValue(urlParams, next);
      if (pushHistory === true) {
        navigate(location);
      } else {
        navigate('?' + urlParams.toString());
      }
    },
    [location, pushHistory, serializer, navigate]
  );
  return setValue;
}

/**
 * Like React's useState, but stores the state in the query string.
 * You probably don't want to use this (you probably want something else to be the
 * This should only be used for values where the query string is the "source of truth" for a piece of state
 * and where you want changes to be reflected immediately, rather than debounced.
 */
export function useQueryStringState<T>(
  serializer: QueryStringSerializer<T>,
  pushHistory = false
): [value: T, setValue: (next: T) => void] {
  // Location is the source of truth for the state, so update param values whenever the location.search changes
  const location = useLocation();
  const value = useMemo(() => {
    const urlParams = new URLSearchParams(location.search);
    return serializer.getValue(urlParams);
  }, [location.search, serializer]);

  const setValue = useSetQueryStringValue(serializer, pushHistory);
  return [value, setValue];
}
