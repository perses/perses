// Copyright 2023 The Perses Authors
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

import { StateCreator } from 'zustand';
import { Middleware } from './common';

export interface SaveChangesConfirmationDialogSlice {
  saveChangesConfirmationDialog?: SaveChangesConfirmationDialogState;
  openSaveChangesConfirmationDialog: (saveChangesConfirmationDialog: SaveChangesConfirmationDialogState) => void;
  closeSaveChangesConfirmationDialog: () => void;
}

export interface SaveChangesConfirmationDialogState {
  onSaveChanges: (saveDefaultTimeRange: boolean, saveDefaultVariables: boolean) => void;
  onCancel: () => void;
  description?: string;
}

export const createSaveChangesDialogSlice: StateCreator<
  SaveChangesConfirmationDialogSlice,
  Middleware,
  [],
  SaveChangesConfirmationDialogSlice
> = (set) => ({
  isOpen: false,

  openSaveChangesConfirmationDialog(dialog) {
    set(
      (state) => {
        state.saveChangesConfirmationDialog = dialog;
      },
      false,
      'openSaveChangesConfirmationDialog'
    );
  },

  closeSaveChangesConfirmationDialog() {
    set(
      (state) => {
        state.saveChangesConfirmationDialog = undefined;
      },
      false,
      'closeSaveChangesConfirmationDialog'
    );
  },
});
