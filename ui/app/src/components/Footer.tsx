import { Box, CircularProgress, Link, Theme } from '@mui/material';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import Github from 'mdi-material-ui/Github';
import { useSnackbar } from '../context/SnackbarProvider';
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

export default function Footer(): JSX.Element {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useHealth({ onError: exceptionSnackbar });
  return (
    <Box component="footer" sx={style}>
      <ul>
        <li>&copy; The Perses Authors {new Date().getFullYear()}</li>
        <li>
          <a href="https://github.com/perses/perses" target="_blank" rel="noreferrer">
            <Github sx={{ verticalAlign: 'bottom' }} />
          </a>
        </li>
        <li>
          {isLoading ? (
            <CircularProgress size="1rem" />
          ) : data !== undefined && data.version !== '' ? (
            <Link
              color={'inherit'}
              underline={'hover'}
              target="_blank"
              rel="noreferrer"
              href={`https://github.com/perses/perses/releases/tag/v${data.version}`}
            >
              {data.version}
            </Link>
          ) : (
            'development version'
          )}
        </li>
      </ul>
    </Box>
  );
}
