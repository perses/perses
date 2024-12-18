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

import { TextFieldProps as MuiTextFieldProps, TextField as MuiTextField } from '@mui/material';
import { ChangeEvent, ForwardedRef, forwardRef, useCallback, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';

type TextFieldProps = Omit<MuiTextFieldProps, 'onChange'> & { debounceMs?: number; onChange?: (value: string) => void };

export const TextField = forwardRef(function (
  { debounceMs = 250, value, onChange, ...props }: TextFieldProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const [currentValue, setCurrentValue] = useState(value);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setCurrentValue(event.target.value);
    debounceFn(event.target.value);
  }

  const handleDebounceFn = useCallback(
    (inputValue: string) => {
      onChange?.(inputValue);
    },
    [onChange]
  );

  const debounceFn = useMemo(() => debounce(handleDebounceFn, debounceMs), [debounceMs, handleDebounceFn]);

  return <MuiTextField ref={ref} value={currentValue} onChange={handleChange} {...props} />;
});
TextField.displayName = 'TextField';
