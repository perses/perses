import { Checkbox, CheckboxProps, styled } from '@mui/material';

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  padding: theme.spacing(0.25),
  verticalAlign: 'bottom',
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

        // Centering.
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',

        '&.Mui-checked': {
          color: color,
        },
      }}
    />
  );
}
