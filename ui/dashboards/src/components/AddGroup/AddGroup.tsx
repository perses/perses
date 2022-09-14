import { FormEvent, useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Box,
  DialogActions,
  Button,
} from '@mui/material';
import { LayoutDefinition } from '@perses-dev/core';
import CloseIcon from 'mdi-material-ui/Close';
import { useDashboardApp, useLayouts } from '../../context';

interface AddGroupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddGroup = ({ isOpen, onClose }: AddGroupProps) => {
  const [isCollapse, setIsCollapse] = useState(false);
  const [name, setName] = useState('');

  const { layouts, updateLayout } = useLayouts();
  const {
    addGroupComponent: { isOpen: isAddGroupOpen, index },
  } = useDashboardApp();
  console.log('add group index', index);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newLayout: LayoutDefinition = {
      kind: 'Grid',
      spec: {
        display: {
          title: name,
          collapse: {
            open: !isCollapse,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        items: index === undefined ? [] : layouts[index]!.spec.items,
      },
    };
    updateLayout(newLayout, index);
    onClose();
  };

  return (
    <Dialog open={isOpen || isAddGroupOpen} onClose={onClose}>
      <DialogTitle>Panel Group</DialogTitle>
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={(theme) => ({
          position: 'absolute',
          top: theme.spacing(0.5),
          right: theme.spacing(0.5),
        })}
      >
        <CloseIcon />
      </IconButton>
      {/* </Box> */}
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ width: '500px' }}>
          <Stack spacing={2}>
            <FormControl>
              <TextField required label="Name" variant="outlined" onChange={(e) => setName(e.target.value)} />
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <InputLabel>Collapse State</InputLabel>
              <FormControlLabel
                control={<Switch defaultChecked onChange={() => setIsCollapse((isCollapse) => !isCollapse)} />}
                label={isCollapse ? 'Close' : 'Open'}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit">{index === undefined ? 'Add' : 'Edit'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddGroup;
