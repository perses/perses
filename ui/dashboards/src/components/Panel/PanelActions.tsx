// Copyright 2025 The Perses Authors
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

import { Stack, styled, Box, Popover, CircularProgress } from '@mui/material';
import { PropsWithChildren, useMemo, useState } from 'react';
import { InfoTooltip, combineSx } from '@perses-dev/components';
import ArrowCollapseIcon from 'mdi-material-ui/ArrowCollapse';
import ArrowExpandIcon from 'mdi-material-ui/ArrowExpand';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DragIcon from 'mdi-material-ui/DragVertical';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import MenuIcon from 'mdi-material-ui/Menu';
import AlertIcon from 'mdi-material-ui/Alert';
import { QueryData } from '@perses-dev/plugin-system';
import {
  ARIA_LABEL_TEXT,
  HEADER_ACTIONS_MIN_WIDTH,
  HEADER_ACTIONS_CONTAINER_NAME,
  TOOLTIP_TEXT,
} from '../../constants';
import { HeaderIconButton } from './HeaderIconButton';

export interface PanelActionsProps {
  editHandlers?: {
    onEditPanelClick: () => void;
    onDuplicatePanelClick: () => void;
    onDeletePanelClick: () => void;
  };
  readHandlers?: {
    isPanelViewed?: boolean;
    onViewPanelClick: () => void;
  };
  extra?: React.ReactNode;
  title: string;
  queryResults: QueryData[];
}

export const PanelActions: React.FC<PanelActionsProps> = ({
  editHandlers,
  readHandlers,
  extra,
  title,
  queryResults,
}) => {
  const queryStateIndicator = useMemo(() => {
    const hasData = queryResults.some((q) => q.data);
    const isFetching = queryResults.some((q) => q.isFetching);
    const queryErrors = queryResults.filter((q) => q.error);
    if (isFetching && hasData) {
      // If the panel has no data, the panel content will show the loading overlay (or an error).
      // Therefore, show the circular loading indicator only in case the panel doesn't display the loading overlay already.
      return <CircularProgress aria-label="loading" size="1.125rem" />;
    } else if (queryErrors.length > 0) {
      const errorTexts = queryErrors
        .map((q) => q.error)
        .map((e: any) => e?.message ?? e?.toString() ?? 'Unknown error') // eslint-disable-line @typescript-eslint/no-explicit-any
        .join('\n');

      return (
        <InfoTooltip description={errorTexts}>
          <HeaderIconButton aria-label="panel errors" size="small">
            <AlertIcon fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
  }, [queryResults]);

  const readActions = useMemo(() => {
    if (readHandlers !== undefined) {
      return (
        <InfoTooltip description={TOOLTIP_TEXT.viewPanel}>
          <HeaderIconButton
            aria-label={ARIA_LABEL_TEXT.viewPanel(title)}
            size="small"
            onClick={readHandlers.onViewPanelClick}
          >
            {readHandlers.isPanelViewed ? (
              <ArrowCollapseIcon fontSize="inherit" />
            ) : (
              <ArrowExpandIcon fontSize="inherit" />
            )}
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
    return undefined;
  }, [readHandlers, title]);

  const editActions = useMemo(() => {
    if (editHandlers !== undefined) {
      // If there are edit handlers, always just show the edit buttons
      return (
        <>
          <InfoTooltip description={TOOLTIP_TEXT.editPanel}>
            <HeaderIconButton
              aria-label={ARIA_LABEL_TEXT.editPanel(title)}
              size="small"
              onClick={editHandlers.onEditPanelClick}
            >
              <PencilIcon fontSize="inherit" />
            </HeaderIconButton>
          </InfoTooltip>
          <InfoTooltip description={TOOLTIP_TEXT.duplicatePanel}>
            <HeaderIconButton
              aria-label={ARIA_LABEL_TEXT.duplicatePanel(title)}
              size="small"
              onClick={editHandlers.onDuplicatePanelClick}
            >
              <ContentCopyIcon
                fontSize="inherit"
                sx={{
                  // Shrink this icon a little bit to look more consistent
                  // with the other icons in the header.
                  transform: 'scale(0.925)',
                }}
              />
            </HeaderIconButton>
          </InfoTooltip>
          <InfoTooltip description={TOOLTIP_TEXT.deletePanel}>
            <HeaderIconButton
              aria-label={ARIA_LABEL_TEXT.deletePanel(title)}
              size="small"
              onClick={editHandlers.onDeletePanelClick}
            >
              <DeleteIcon fontSize="inherit" />
            </HeaderIconButton>
          </InfoTooltip>
        </>
      );
    }
    return undefined;
  }, [editHandlers, title]);

  return (
    <HeaderActionWrapper
      direction="row"
      spacing={0.25}
      alignItems="center"
      sx={{ display: editHandlers !== undefined || readHandlers?.isPanelViewed ? 'flex' : 'var(--panel-hover, none)' }}
    >
      {queryStateIndicator} {editHandlers === undefined && extra} {readActions}
      {editActions && (
        <>
          <Box
            sx={combineSx((theme) => ({
              display: 'block',
              [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).down(HEADER_ACTIONS_MIN_WIDTH)]: {
                display: 'none',
              },
            }))}
          >
            {editActions}
          </Box>
          <Box
            sx={combineSx((theme) => ({
              display: 'block',
              [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).up(HEADER_ACTIONS_MIN_WIDTH)]: { display: 'none' },
            }))}
          >
            <ShowAction title={title}>{editActions}</ShowAction>
          </Box>
        </>
      )}
      {editActions && (
        <InfoTooltip description={TOOLTIP_TEXT.movePanel}>
          <HeaderIconButton aria-label={ARIA_LABEL_TEXT.movePanel(title)} size="small">
            <DragIcon className="drag-handle" sx={{ cursor: 'grab' }} fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
      )}
    </HeaderActionWrapper>
  );
};

const HeaderActionWrapper = styled(Stack)(() => ({
  // Adding back the negative margins from MUI's defaults for actions, so we
  // avoid increasing the header size when actions are present while also being
  // able to vertically center the actions.
  // https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CardHeader/CardHeader.js#L56-L58
  marginTop: -4,
  marginBottom: -4,
}));

const ShowAction: React.FC<PropsWithChildren<{ title: string }>> = ({ children, title }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>): undefined => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): undefined => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'actions-popover' : undefined;

  return (
    <>
      <HeaderIconButton
        className="show-actions"
        aria-describedby={id}
        onClick={handleClick}
        aria-label={ARIA_LABEL_TEXT.showPanelActions(title)}
        size="small"
      >
        <MenuIcon fontSize="inherit" />
      </HeaderIconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ padding: '8px' }} onClick={handleClose}>
          {children}
        </Box>
      </Popover>
    </>
  );
};
