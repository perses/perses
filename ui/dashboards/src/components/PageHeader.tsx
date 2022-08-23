import { Box, BoxProps } from '@mui/material';
import { combineSx } from '@perses-dev/components';

export function PageHeader(props: BoxProps) {
  const { children, sx, ...others } = props;
  return (
    <Box
      sx={combineSx(
        (theme) => ({
          padding: theme.spacing(1, 2),
          display: 'flex',
          justifyContent: ' space-between',
          alignItems: 'center',
        }),
        sx
      )}
      {...others}
    >
      {children}
    </Box>
  );
}
