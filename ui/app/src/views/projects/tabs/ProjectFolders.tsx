import { IconButton, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardProps, Box, Accordion, AccordionSummary, Stack, AccordionDetails } from '@mui/material';
import { ReactElement, MouseEvent, useState } from 'react';
import {
  useFolderList,
  FolderWithDashboards,
  useDeleteFolderMutation,
  useUpdateFolderMutation,
} from '../../../model/folder-client';
import { useIsEphemeralDashboardEnabled, useIsReadonly } from '../../../context/Config';
import { ChevronDown, DeleteOutline, Pencil } from 'mdi-material-ui';
import FolderIcon from 'mdi-material-ui/Folder';

import { DashboardList } from '../../../components/DashboardList/DashboardList';
import { useHasPermission } from '../../../context/Authorization';
import { DeleteResourceDialog } from '../../../components/dialogs';
import { useSnackbar } from '@perses-dev/components';
import { UpdateFolderDialog } from '../../../components/dialogs/UpdateFolderDialog';
import { useFolderBasedDashboardList } from '../../../model/dashboard-client';
import { Typography } from '@mui/material';

interface FolderAccordionProps {
  folder: FolderWithDashboards;
  project?: string;
}

export function FolderAccordion({ folder, project }: FolderAccordionProps): ReactElement {
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();
  //const hasPermission = useHasPermission('delete', folder.metadata.name, 'Project');
  const hasPermission = true;
  const deleteFolderMutation = useDeleteFolderMutation();
  const updateFolderMutation = useUpdateFolderMutation();
  const { data: dashboards, isLoading } = useFolderBasedDashboardList(project, folder.metadata.name);
  const isReadonly = useIsReadonly();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState<boolean>(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);

  function openDeleteProjectConfirmDialog($event: MouseEvent): void {
    $event.stopPropagation(); // Preventing the accordion to toggle when we click on the button
    setIsDeleteFolderDialogOpen(true);
  }

  function openEditDialog($event: MouseEvent): void {
    $event.stopPropagation();
    setIsEditFolderDialogOpen(true);
  }

  function handleFolderDelete(folder: FolderWithDashboards): void {
    deleteFolderMutation.mutate(folder, {
      onSuccess: (deletedFolder: FolderWithDashboards): void => {
        successSnackbar(`Folder ${deletedFolder.metadata.name} has been successfully deleted`);
        setIsDeleteFolderDialogOpen(false);
      },
      onError: (err: any) => {
        exceptionSnackbar(err);
        throw err;
      },
    });
  }

  function handleFolderUpdate(newName: string): void {
    updateFolderMutation.mutate(
      { ...folder, metadata: { ...folder.metadata, name: newName } },
      {
        onSuccess: (updatedFolder) => {
          successSnackbar(`Folder ${updatedFolder.metadata.name} has been successfully updated`);
          setIsEditFolderDialogOpen(false);
        },
        onError: (err: any) => {
          exceptionSnackbar(err);
        },
      }
    );
  }

  return (
    <>
      <Accordion TransitionProps={{ unmountOnExit: true }}>
        <AccordionSummary expandIcon={<ChevronDown />}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
            <Stack direction="row" alignItems="center" gap={1}>
              <FolderIcon sx={{ margin: 1 }} />
              <Typography variant="h3" sx={{ fontWeight: 700 }} color="primary">
                {folder.metadata.name}
              </Typography>
            </Stack>
            {hasPermission && (
              <Stack direction="row" gap={1}>
                <IconButton
                  component="div"
                  onClick={(event: MouseEvent) => openDeleteProjectConfirmDialog(event)}
                  disabled={isReadonly}
                >
                  <DeleteOutline />
                </IconButton>
              </Stack>
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <DashboardList
            dashboardList={dashboards || []}
            hideToolbar={true}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
              columns: { columnVisibilityModel: { id: false, project: false, version: false } },
            }}
            isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
          />
        </AccordionDetails>
      </Accordion>
      <DeleteResourceDialog
        resource={folder}
        open={isDeleteFolderDialogOpen}
        onSubmit={() => handleFolderDelete(folder)}
        onClose={() => setIsDeleteFolderDialogOpen(false)}
      />
      <UpdateFolderDialog
        open={isEditFolderDialogOpen}
        folder={folder}
        onClose={() => setIsEditFolderDialogOpen(false)}
        onSubmit={handleFolderUpdate}
      />
    </>
  );
}

interface ProjectFoldersProps extends CardProps {
  projectName: string;
  hideToolbar?: boolean;
}

export function ProjectFolders({ projectName, hideToolbar, ...props }: ProjectFoldersProps): ReactElement {
  const { data: folders = [], isLoading } = useFolderList({ project: projectName });

  if (folders.length === 0) {
    return (
      <Typography sx={{ fontStyle: 'italic', color: 'warning.main' }}>No folders with dashboards found!</Typography>
    );
  }

  return (
    <Card {...props}>
      <Box>
        {!isLoading &&
          folders.map((folder) => <FolderAccordion key={folder.metadata.name} folder={folder} project={projectName} />)}
      </Box>
    </Card>
  );
}
