// Copyright 2024 The Perses Authors
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

import { Action, DispatchWithPromise } from '@perses-dev/core';
import { Dispatch, DispatchWithoutAction } from 'react';

export interface DrawerProps<T> {
  action: Action;
  isOpen: boolean;
  isReadonly?: boolean;
  onActionChange?: Dispatch<Action>;
  onSave: Dispatch<T>;
  onDelete?: DispatchWithPromise<T>;
  onClose: DispatchWithoutAction;
}

export interface FormEditorProps<T> {
  initialValue: T;
  action: Action;
  isDraft: boolean;
  isReadonly?: boolean;
  onActionChange?: Dispatch<Action>;
  onSave: Dispatch<T>;
  onDelete?: DispatchWithoutAction;
  onClose: DispatchWithoutAction;
}
