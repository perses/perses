// Copyright (c) 2017 Uber Technologies, Inc.
//
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

import * as React from 'react';
import { notification } from 'antd';
import { IoTimeOutline } from 'react-icons/io5';

import LoadingIndicator from '../../common/LoadingIndicator';
import { Details, Message } from '../../common/ErrorMessage';
import { TNil } from '../../../types';
import { TraceArchive } from '../../../types/archive';

import './index.css';

enum ENotifiedState {
  Progress = 'ENotifiedState.Progress',
  Outcome = 'ENotifiedState.Outcome',
}

type Props = {
  archivedState: TraceArchive | TNil;
  acknowledge: () => void;
};

type State = {
  notifiedState: ENotifiedState | null;
};

function getNextNotifiedState(props: Props) {
  const { archivedState } = props;
  if (!archivedState) {
    return null;
  }
  if (archivedState.isLoading) {
    return ENotifiedState.Progress;
  }
  return archivedState.isAcknowledged ? null : ENotifiedState.Outcome;
}

function updateNotification(oldState: ENotifiedState | null, nextState: ENotifiedState | null, props: Props) {
  if (oldState === nextState) {
    return;
  }
  if (oldState) {
    notification.destroy(oldState);
  }
  if (nextState === ENotifiedState.Progress) {
    notification.info({
      key: ENotifiedState.Progress,
      description: null,
      duration: 0,
      icon: <LoadingIndicator />,
      message: 'Archiving trace...',
    });
    return;
  }
  const { acknowledge, archivedState } = props;
  if (nextState === ENotifiedState.Outcome) {
    if (archivedState && archivedState.error) {
      const { error } = archivedState;
      notification.warning({
        key: ENotifiedState.Outcome,
        className: 'ArchiveNotifier--errorNotification',
        message: <Message error={error} wrap />,
        description: <Details error={error} wrap />,
        duration: null,
        icon: <IoTimeOutline className="ArchiveNotifier--errorIcon" />,
        onClose: acknowledge,
      });
    } else if (archivedState && archivedState.isArchived) {
      notification.success({
        key: ENotifiedState.Outcome,
        description: null,
        duration: null,
        icon: <IoTimeOutline className="ArchiveNotifier--doneIcon" />,
        message: 'This trace has been archived.',
        onClose: acknowledge,
      });
    } else {
      throw new Error('Unexpected condition');
    }
  }
}

function processProps(notifiedState: ENotifiedState | null, props: Props) {
  const nxNotifiedState = getNextNotifiedState(props);
  updateNotification(notifiedState, nxNotifiedState, props);
  return nxNotifiedState;
}

export default class ArchiveNotifier extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const notifiedState = processProps(null, props);
    this.state = { notifiedState };
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    const notifiedState = processProps(state.notifiedState, props);
    return { notifiedState };
  }

  componentWillUnmount() {
    const { notifiedState } = this.state;
    if (notifiedState) {
      notification.destroy(notifiedState);
    }
  }

  render() {
    return null;
  }
}
