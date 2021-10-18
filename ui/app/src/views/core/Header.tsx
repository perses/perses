import { AppBar, Switch, Toolbar, Typography } from '@material-ui/core';

export function HeaderView(): JSX.Element {
  return (
    <AppBar position="relative">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Perses
        </Typography>
        <Switch />
      </Toolbar>
    </AppBar>
  );
}
