import { Box, Theme } from '@mui/material';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { Github } from 'mdi-material-ui';

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

export function FooterView(): JSX.Element {
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
        <li>v0.1.0</li>
      </ul>
    </Box>
  );
}
