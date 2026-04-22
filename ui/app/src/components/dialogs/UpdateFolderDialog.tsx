import { ReactElement, useCallback } from 'react';
import { Button, Stack, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { FolderWithDashboards } from '../../model/folder-client';

interface UpdateFolderDialogProps {
  open: boolean;
  folder: FolderWithDashboards;
  onClose: () => void;
  onSubmit: (newName: string) => void;
}

interface UpdateFolderValidation {
  folderName: string;
}

export function UpdateFolderDialog({ open, folder, onClose, onSubmit }: UpdateFolderDialogProps): ReactElement {
  const folderForm = useForm<UpdateFolderValidation>({
    mode: 'onBlur',
    defaultValues: { folderName: folder.metadata.name },
  });

  const handleProcessForm = useCallback((): SubmitHandler<UpdateFolderValidation> => {
    return (data) => {
      onSubmit(data.folderName);
    };
  }, [onSubmit]);

  const handleClose = (): void => {
    onClose();
    folderForm.reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="update-folder-dialog" fullWidth>
      <Dialog.Header>Rename Folder: {folder.metadata.name}</Dialog.Header>
      <FormProvider {...folderForm}>
        <form onSubmit={folderForm.handleSubmit(handleProcessForm())}>
          <Dialog.Content>
            <Stack gap={1}>
              <Controller
                control={folderForm.control}
                name="folderName"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    required
                    margin="dense"
                    id="name"
                    label="Folder Name"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="contained" disabled={!folderForm.formState.isValid} type="submit">
              Save
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </Dialog.Actions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
