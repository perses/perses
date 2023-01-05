// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Box } from '@mui/material';

import Header from './components/Header';
import Footer from './components/Footer';
import Router from './Router';

function App() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: ({ palette }) =>
          palette.mode === 'dark' ? palette.background.default : palette.background.paper,
      }}
    >
      <Header />
      <Box
        sx={{
          paddingBottom: (theme) => theme.spacing(1),
          flex: 1,
        }}
      >
        <Router />
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
