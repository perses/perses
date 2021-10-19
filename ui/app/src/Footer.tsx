import { Box, Theme } from '@mui/material';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { Github } from 'mdi-material-ui';
import useHealth from './health-client';

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
  const { response } = useHealth();
  return (
    <Box sx={style}>
      <ul>
        <li>&copy; The Perses Authors {new Date().getFullYear()}</li>
        <li>
          <a
            href="https://github.com/perses/perses"
            target="_blank"
            rel="noreferrer"
          >
            <Github sx={{ verticalAlign: 'bottom' }} />
          </a>
        </li>
        <li>
          {response && response.version.length > 0
            ? response.version
            : 'development version'}
        </li>
      </ul>
    </Box>
  );
}
