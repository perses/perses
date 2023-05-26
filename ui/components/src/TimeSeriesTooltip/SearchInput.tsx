import { TextField, InputAdornment, TextFieldProps } from '@mui/material';
import SearchIcon from 'mdi-material-ui/Magnify';

/**
 * A text field styled with search defaults.
 */
export function SearchInput(props: TextFieldProps) {
  return (
    <TextField
      variant="outlined"
      size="small"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <SearchIcon color="inherit" />
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
}
