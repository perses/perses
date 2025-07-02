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

import { Stack, Box, Popover, CircularProgress, styled, PopoverPosition } from '@mui/material';
import { isValidElement, PropsWithChildren, ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import { InfoTooltip } from '@perses-dev/components';
import { usePluginRegistry, useDataQueriesContext } from '@perses-dev/plugin-system';
import ArrowCollapseIcon from 'mdi-material-ui/ArrowCollapse';
import ArrowExpandIcon from 'mdi-material-ui/ArrowExpand';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DragIcon from 'mdi-material-ui/DragVertical';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import MenuIcon from 'mdi-material-ui/Menu';
import AlertIcon from 'mdi-material-ui/Alert';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import DownloadIcon from 'mdi-material-ui/Download';
import { Link, TimeSeriesData, ExportFormat, DataExportCapability } from '@perses-dev/core';
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
  panelPluginKind: string; // ADD THIS LINE
  editHandlers?: {
    onEditPanelClick: () => void;
    onDuplicatePanelClick: () => void;
    onDeletePanelClick: () => void;
  };
  readHandlers?: {
    isPanelViewed?: boolean;
    onViewPanelClick: () => void;
  };
  queryResults: TimeSeriesData | undefined; // Keep this for now
  projectName?: string;
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
  panelPluginKind,
  projectName,
}) => {
  // Check if current data is time series data
  const { isFetching, errors } = useDataQueriesContext();
  const { getPlugin } = usePluginRegistry();

  // Create export capability using plugin system
  const [exportCapability, setExportCapability] = useState<DataExportCapability | null>(null);

  useEffect(() => {
    const loadExportCapability = async (): Promise<void> => {
      if (!panelPluginKind) {
        setExportCapability(null);
        return;
      }

      try {
        const plugin = await getPlugin('Panel', panelPluginKind);
        if (!plugin?.createDataExporter) {
          setExportCapability(null);
          return;
        }

        const exporter = plugin.createDataExporter(queryResults, title, projectName);
        setExportCapability(exporter);
      } catch (error) {
        console.warn('Failed to get plugin export capability:', error);
        setExportCapability(null);
      }
    };

    loadExportCapability();
  }, [panelPluginKind, queryResults, title, projectName, getPlugin]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!exportCapability) return;

      try {
        const exportData = await exportCapability.exportData(format, {
          title,
          projectName,
        });

        // Trigger download using browser
        const link = document.createElement('a');
        link.href = URL.createObjectURL(exportData.data);
        link.download = exportData.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (error) {
        console.error('Export failed:', error);
      }
    },
    [exportCapability, title, projectName]
  );

  const exportButton = useMemo(() => {
    if (!exportCapability) return null;

    const formats = exportCapability.getSupportedFormats();
    const csvFormat = formats.find((f) => f.name === 'CSV');

    if (!csvFormat) return null;

    return (
      <InfoTooltip description="Export as CSV">
        <HeaderIconButton aria-label="CSV Export" size="small" onClick={() => handleExport(csvFormat)}>
          <DownloadIcon fontSize="inherit" />
        </HeaderIconButton>
      </InfoTooltip>
    );
  }, [exportCapability, handleExport]);

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
    const hasData = queryResults && queryResults.series && queryResults.series.length > 0;
    if (isFetching && hasData) {
      return <CircularProgress aria-label="loading" size="1.125rem" />;
    }
    const validErrors = (errors || []).filter((error) => error !== null);
    if (validErrors.length > 0) {
      const errorTexts = validErrors
        .map((e: unknown) => {
          if (typeof e === 'string') return e;
          if (e && typeof e === 'object') {
            const errorObj = e as { message?: string; toString?: () => string };
            return errorObj.message ?? errorObj.toString?.() ?? 'Unknown error';
          }
          return 'Unknown error';
        })
        .join('\n');

      return (
        <InfoTooltip description={errorTexts}>
          <HeaderIconButton aria-label="panel errors" size="small">
            <AlertIcon fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
  }, [queryResults, isFetching, errors]);

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

  // if the panel is in non-editing, non-fullscreen mode, show certain icons only on hover
  const OnHover = ({ children }: PropsWithChildren): ReactNode =>
    editHandlers === undefined && !readHandlers?.isPanelViewed ? (
      <Box sx={{ display: 'var(--panel-hover, none)' }}>{children}</Box>
    ) : (
      <>{children}</>
    );

  return (
    <>
      {/* small panel width: move all icons except move/grab to overflow menu */}
      <ConditionalBox
        sx={(theme) => ({
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).between(0, HEADER_SMALL_WIDTH)]: { display: 'flex' },
        })}
      >
        {divider}
        <OnHover>
          <OverflowMenu title={title}>
            {descriptionAction} {linksAction} {queryStateIndicator} {extraActions} {readActions} {editActions}
          </OverflowMenu>
          {exportButton}
          {moveAction}
        </OnHover>
      </ConditionalBox>

      {/* medium panel width: move edit icons to overflow menu */}
      <ConditionalBox
        sx={(theme) => ({
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).between(HEADER_SMALL_WIDTH, HEADER_MEDIUM_WIDTH)]: {
            display: 'flex',
          },
        })}
      >
        <OnHover>
          {descriptionAction} {linksAction}
        </OnHover>
        {divider} {queryStateIndicator}
        <OnHover>
          {extraActions} {readActions} {exportButton}
          <OverflowMenu title={title}>{editActions}</OverflowMenu>
          {moveAction}
        </OnHover>
      </ConditionalBox>

      {/* large panel width: show all icons in panel header */}
      <ConditionalBox
        sx={(theme) => ({
          display: 'flex',
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).down(HEADER_MEDIUM_WIDTH)]: { display: 'none' },
        })}
      >
        <OnHover>
          {descriptionAction} {linksAction}
        </OnHover>
        {divider} {queryStateIndicator}
        <OnHover>
          {extraActions} {readActions} {exportButton} {editActions} {moveAction}
        </OnHover>
      </ConditionalBox>
    </>
  );
};

const OverflowMenu: React.FC<PropsWithChildren<{ title: string }>> = ({ children, title }) => {
  const [anchorPosition, setAnchorPosition] = useState<PopoverPosition>();

  // do not show overflow menu if there is no content
  const hasContent = isValidElement(children) || (Array.isArray(children) && children.some(isValidElement));
  if (!hasContent) {
    return undefined;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorPosition(event.currentTarget.getBoundingClientRect());
  };

  const handleClose = (): undefined => {
    setAnchorPosition(undefined);
  };

  const open = Boolean(anchorPosition);
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
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
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
