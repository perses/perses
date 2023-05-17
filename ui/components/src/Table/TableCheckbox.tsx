import { Checkbox, CheckboxProps, styled } from '@mui/material';
import { TableDensity } from './table-model';

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  verticalAlign: 'bottom',
}));

export interface TableCheckboxProps extends Pick<CheckboxProps, 'checked' | 'indeterminate' | 'onChange'> {
  color?: string;
  density: TableDensity;
}

export function TableCheckbox({ color, density, ...otherProps }: TableCheckboxProps) {
  const isCompact = density === 'compact';

  return (
    <StyledCheckbox
      size={isCompact ? 'small' : 'medium'}
      tabIndex={-1}
      {...otherProps}
      sx={{
        color: color,

        padding: (theme) => theme.spacing(isCompact ? 0.25 : 0.5),

        // Centering.
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',

        '&.Mui-checked': {
          color: color,
        },

        '& .MuiSvgIcon-root': { fontSize: isCompact ? 14 : 16 },
      }}
    />
  );
}
