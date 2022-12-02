import { StateCreator } from 'zustand';
import { Middleware } from './common';

export interface DiscardChangesConfirmationDialogSlice {
  discardChangesConfirmationDialog?: DiscardChangesConfirmationDialogState;
  openDiscardChangesConfirmationDialog: (
    discardChangesConfirmationDialog: DiscardChangesConfirmationDialogState
  ) => void;
  closeDiscardChangesConfirmationDialog: () => void;
}

export interface DiscardChangesConfirmationDialogState {
  onDiscardChanges: () => void;
  onCancel: () => void;
  description?: string;
}

export const createDiscardChangesDialogSlice: StateCreator<
  DiscardChangesConfirmationDialogSlice,
  Middleware,
  [],
  DiscardChangesConfirmationDialogSlice
> = (set) => ({
  isOpen: false,

  openDiscardChangesConfirmationDialog(dialog) {
    set((state) => {
      state.discardChangesConfirmationDialog = dialog;
    });
  },

  closeDiscardChangesConfirmationDialog() {
    set((state) => {
      state.discardChangesConfirmationDialog = undefined;
    });
  },
});
