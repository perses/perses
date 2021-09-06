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

import { useState } from 'react';
import {
  Box,
  BoxProps,
  ButtonBase,
  Collapse,
  Typography,
} from '@material-ui/core';
import ExpandedIcon from 'mdi-material-ui/ChevronUp';
import CollapsedIcon from 'mdi-material-ui/ChevronDown';
import { ExpandLayoutDefinition } from '@perses-ui/core';
import ContentRefResolver from './ContentRefResolver';
import AlertErrorBoundary from './AlertErrorBoundary';

export interface ExpandLayoutProps extends Omit<BoxProps, 'children'> {
  definition: ExpandLayoutDefinition;
}

/**
 * Layout component that renders content inside a collapsible section.
 */
function ExpandLayout(props: ExpandLayoutProps) {
  const { definition, ...others } = props;
  const [isOpen, setIsOpen] = useState(definition.options.open);

  return (
    <Box component="section" {...others}>
      <ButtonBase
        component="header"
        sx={{
          display: 'flex',
          justifyContent: 'start',
          alignItems: 'center',
          padding: 0.5,
        }}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <ExpandedIcon /> : <CollapsedIcon />}
        <Typography variant="h5" sx={{ marginLeft: 1 }}>
          Can expand have a title?
        </Typography>
      </ButtonBase>
      <Collapse in={isOpen}>
        <Box>
          {definition.options.children.map((childRef, idx) => (
            <AlertErrorBoundary key={idx}>
              <ContentRefResolver contentRef={childRef} />
            </AlertErrorBoundary>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

export default ExpandLayout;
