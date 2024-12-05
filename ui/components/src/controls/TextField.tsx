import { TextFieldProps as MuiTextFieldProps, TextField as MuiTextField } from '@mui/material';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';

type TextFieldProps = Omit<MuiTextFieldProps, 'onChange'> & { debounceMs?: number; onChange?: (value: string) => void };

export function TextField({ debounceMs = 250, value, onChange, ...props }: TextFieldProps) {
  const [currentValue, setCurrentValue] = useState(value);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
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

  return <MuiTextField value={currentValue} onChange={handleChange} {...props} />;
}
