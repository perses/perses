import { Box, Divider, Typography } from '@mui/material';
import { ReactElement, ReactNode } from 'react';

export interface IProps {
  title: string;
  icon: ReactElement;
  children: ReactNode;
  testId: string;
}

export const ProfileContainer = ({ icon, title, children, testId }: IProps): ReactElement => {
  return (
    <Box data-testid={testId} sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: (theme) => theme.spacing(2, 2),
          gap: 0.5,
        }}
      >
        {icon}
        <Typography variant="h1" sx={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {title}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ padding: (theme) => theme.spacing(2, 2) }}>{children}</Box>
    </Box>
  );
};
