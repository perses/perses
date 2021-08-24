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
