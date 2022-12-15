// Copyright 2022 The Perses Authors
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

import { Button, styled, ButtonProps } from '@mui/material';

type ToolbarIconButtonProps = ButtonProps;

export function ToolbarIconButton(props: ToolbarIconButtonProps) {
  return <IconButton variant="outlined" color="secondary" {...props} />;
}

const IconButton = styled(Button)(({ theme }) => ({
  // Using a button with some adjusted styles because it is easier to inherit
  // styling and variants from themes than with an IconButton.
  padding: theme.spacing(0.5),
  minWidth: 'auto',
}));
