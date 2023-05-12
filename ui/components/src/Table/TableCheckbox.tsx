import { Checkbox, CheckboxProps, styled } from '@mui/material';

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  padding: theme.spacing(0.5),
  '& .MuiSvgIcon-root': { fontSize: 14 },
}));

export interface TableCheckboxProps extends Pick<CheckboxProps, 'checked' | 'indeterminate' | 'onChange'> {
  color?: string;
}

export function TableCheckbox({ color, ...otherProps }: TableCheckboxProps) {
  return (
    <StyledCheckbox
      size="small"
      {...otherProps}
      sx={{
        color: color,
        '&.Mui-checked': {
          color: color,
        },
      }}
    />
  );
}
