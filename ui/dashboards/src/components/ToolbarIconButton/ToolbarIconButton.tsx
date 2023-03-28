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

import { ForwardedRef, forwardRef } from 'react';
import { Button, styled, ButtonProps } from '@mui/material';

type ToolbarIconButtonProps = ButtonProps;

function IconButton(props: ToolbarIconButtonProps, ref: ForwardedRef<HTMLButtonElement>) {
  return <StyledIconButton ref={ref} variant="outlined" color="secondary" {...props} />;
}

const StyledIconButton = styled(Button)(({ theme }) => ({
  // Using a button with some adjusted styles because it is easier to inherit
  // styling and variants from themes than with an IconButton.
  padding: theme.spacing(0.5),
  minWidth: 'auto',
}));

export const ToolbarIconButton = forwardRef(IconButton);
