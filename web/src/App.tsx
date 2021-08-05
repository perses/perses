import React, { FC } from 'react';
import { AppBar, Toolbar, Typography } from '@material-ui/core';

const App: FC = () => {
  return (
    <AppBar>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Perses
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default App;
