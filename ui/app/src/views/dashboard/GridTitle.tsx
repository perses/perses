// Copyright 2021 The Perses Authors
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

import { ButtonBase, Typography } from '@mui/material';
import ExpandedIcon from 'mdi-material-ui/ChevronUp';
import CollapsedIcon from 'mdi-material-ui/ChevronDown';

export interface GridTitleProps {
  title: string;
  collapse?: {
    isOpen: boolean;
    onToggleOpen: () => void;
  };
}

/**
 * Renders the title for a Grid section, optionally also supporting expanding
 * and collapsing
 */
function GridTitle(props: GridTitleProps) {
  const { title, collapse } = props;

  const text = (
    <Typography variant="h5" sx={{ marginLeft: collapse !== undefined ? 1 : undefined }}>
      {title}
    </Typography>
  );

  // If we don't need expand/collapse, just render the title text
  if (collapse === undefined) {
    return text;
  }

  // Otherwise render something clickable
  return (
    <ButtonBase
      component="header"
      sx={{
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
      }}
      onClick={collapse.onToggleOpen}
    >
      {collapse.isOpen ? <ExpandedIcon /> : <CollapsedIcon />}
      {text}
    </ButtonBase>
  );
}

export default GridTitle;
