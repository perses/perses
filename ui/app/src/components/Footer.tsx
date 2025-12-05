import { Box, CircularProgress, Link, Theme } from '@mui/material';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import Github from 'mdi-material-ui/Github';
import { useSnackbar } from '@perses-dev/components';
import { ReactElement, ReactNode } from 'react';
import { useHealth } from '../model/health-client';

const style: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  '& li': {
    listStyle: 'none',
    display: 'inline',
    fontSize: '0.8rem',
  },
  '& li + li:before': {
    content: '"|"',
    padding: '3px',
  },
  '& a:visited': {
    color: 'inherit',
  },
};

export default function Footer(): ReactElement {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading, error } = useHealth();

  if (error) {
    exceptionSnackbar(error);
  }

  let versionContent: ReactNode;

  if (isLoading) {
    versionContent = <CircularProgress size="1rem" />;
  } else if (data !== undefined && data.version !== '') {
    const releaseHref = data.version.startsWith('main')
      ? `https://github.com/perses/perses/tree/${data.commit}`
      : `https://github.com/perses/perses/releases/tag/v${data.version}`;
    versionContent = (
      <Link color="inherit" underline="hover" target="_blank" rel="noreferrer" href={releaseHref}>
        {data.version}
      </Link>
    );
  } else {
    versionContent = 'development version';
  }

  return (
    <Box component="footer" sx={style}>
      <ul
        style={{
          paddingLeft: 0,
        }}
      >
        <li>&copy; The Perses Authors {new Date().getFullYear()}</li>
        <li>
          <a href="https://github.com/perses/perses" target="_blank" rel="noreferrer">
            <Github sx={{ verticalAlign: 'bottom' }} />
          </a>
        </li>
        <li>{versionContent}</li>
      </ul>
    </Box>
  );
}
