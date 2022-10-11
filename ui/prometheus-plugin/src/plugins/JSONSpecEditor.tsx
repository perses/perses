import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';
import { OptionsEditorProps } from '@perses-dev/plugin-system';

export function JSONSpecEditor<T>(props: OptionsEditorProps<T>) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(JSON.stringify(props.value, null, 2));
  const [invalidJSON, setInvalidJSON] = useState(false);

  useEffect(() => {
    setValue(JSON.stringify(props.value, null, 2));
    setInvalidJSON(false);
  }, [props.value]);

  return (
    <TextField
      label="JSON"
      error={invalidJSON}
      helperText={invalidJSON ? 'Invalid JSON' : ''}
      multiline
      inputRef={ref}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
      }}
      onBlur={() => {
        try {
          const json = JSON.parse(value ?? '{}');
          setInvalidJSON(false);
          props.onChange(json);
        } catch (e) {
          setInvalidJSON(true);
        }
      }}
    />
  );
}
