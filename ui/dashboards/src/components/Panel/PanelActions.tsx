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

import { Stack, Box, Popover, CircularProgress, styled } from '@mui/material';
import { isValidElement, PropsWithChildren, useMemo, useState } from 'react';
import { InfoTooltip } from '@perses-dev/components';
import ArrowCollapseIcon from 'mdi-material-ui/ArrowCollapse';
import ArrowExpandIcon from 'mdi-material-ui/ArrowExpand';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DragIcon from 'mdi-material-ui/DragVertical';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import MenuIcon from 'mdi-material-ui/Menu';
import { QueryData } from '@perses-dev/plugin-system';
import AlertIcon from 'mdi-material-ui/Alert';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import { Link } from '@perses-dev/core';
import {
  ARIA_LABEL_TEXT,
  HEADER_ACTIONS_CONTAINER_NAME,
  HEADER_MEDIUM_WIDTH,
  HEADER_SMALL_WIDTH,
  TOOLTIP_TEXT,
} from '../../constants';
import { HeaderIconButton } from './HeaderIconButton';
import { PanelLinks } from './PanelLinks';

export interface PanelActionsProps {
  title: string;
  description?: string;
  descriptionTooltipId: string;
  links?: Link[];
  extra?: React.ReactNode;
  editHandlers?: {
    onEditPanelClick: () => void;
    onDuplicatePanelClick: () => void;
    onDeletePanelClick: () => void;
  };
  readHandlers?: {
    isPanelViewed?: boolean;
    onViewPanelClick: () => void;
  };
  queryResults: QueryData[];
}

const ConditionalBox = styled(Box)({
  display: 'none',
  alignItems: 'center',
  flexGrow: 1,
  justifyContent: 'flex-end',
});

export const PanelActions: React.FC<PanelActionsProps> = ({
  editHandlers,
  readHandlers,
  extra,
  title,
  description,
  descriptionTooltipId,
  links,
  queryResults,
}) => {
  const descriptionAction = useMemo(() => {
    if (description && description.trim().length > 0) {
      return (
        <InfoTooltip id={descriptionTooltipId} description={description} enterDelay={100}>
          <HeaderIconButton aria-label="panel description" size="small">
            <InformationOutlineIcon
              aria-describedby="info-tooltip"
              aria-hidden={false}
              fontSize="inherit"
              sx={{ color: (theme) => theme.palette.text.secondary }}
            />
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
    return undefined;
  }, [descriptionTooltipId, description]);
  const linksAction = links && links.length > 0 && <PanelLinks links={links} />;
  const extraActions = editHandlers === undefined && extra;

  const queryStateIndicator = useMemo(() => {
    const hasData = queryResults.some((q) => q.data);
    const isFetching = queryResults.some((q) => q.isFetching);
    const queryErrors = queryResults.filter((q) => q.error);
    if (isFetching && hasData) {
      // If the panel has no data, the panel content will show the loading overlay.
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

  const moveAction = useMemo(() => {
    if (editActions && !readHandlers?.isPanelViewed) {
      return (
        <InfoTooltip description={TOOLTIP_TEXT.movePanel}>
          <HeaderIconButton aria-label={ARIA_LABEL_TEXT.movePanel(title)} size="small">
            <DragIcon className="drag-handle" sx={{ cursor: 'grab' }} fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
    return undefined;
  }, [editActions, readHandlers, title]);

  const divider = <Box sx={{ flexGrow: 1 }}></Box>;

  return (
    <>
      {/* small panel width: move all icons except move/grab to overflow menu */}
      <ConditionalBox
        sx={(theme) => ({
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).between(0, HEADER_SMALL_WIDTH)]: { display: 'flex' },
        })}
      >
        {divider}
        <OverflowMenu title={title}>
          {descriptionAction} {linksAction} {queryStateIndicator} {extraActions} {readActions} {editActions}
        </OverflowMenu>
        {moveAction}
      </ConditionalBox>

      {/* medium panel width: move edit icons to overflow menu */}
      <ConditionalBox
        sx={(theme) => ({
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).between(HEADER_SMALL_WIDTH, HEADER_MEDIUM_WIDTH)]: {
            display: 'flex',
          },
        })}
      >
        {descriptionAction} {linksAction} {divider} {queryStateIndicator} {extraActions} {readActions}
        <OverflowMenu title={title}>{editActions}</OverflowMenu>
        {moveAction}
      </ConditionalBox>

      {/* large panel width: show all icons in panel header */}
      <ConditionalBox
        sx={(theme) => ({
          // flip the logic here; if the browser (or jsdom) does not support container queries, always show all icons
          display: 'flex',
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).down(HEADER_MEDIUM_WIDTH)]: { display: 'none' },
        })}
      >
        {descriptionAction} {linksAction} {divider} {queryStateIndicator} {extraActions} {readActions} {editActions}
        {moveAction}
      </ConditionalBox>
    </>
  );
};

const OverflowMenu: React.FC<PropsWithChildren<{ title: string }>> = ({ children, title }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // do not show overflow menu if there is no content (for example, edit actions are hidden)
  const hasContent = isValidElement(children) || (Array.isArray(children) && children.some(isValidElement));
  if (!hasContent) {
    return undefined;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>): undefined => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): undefined => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'actions-menu' : undefined;

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
        <Stack direction="row" alignItems="center" sx={{ padding: 1 }} onClick={handleClose}>
          {children}
        </Stack>
      </Popover>
    </>
  );
};
