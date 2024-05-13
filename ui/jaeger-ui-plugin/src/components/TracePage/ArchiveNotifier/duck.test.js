// Copyright (c) 2020 The Jaeger Authors.
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

import { createMemoryHistory } from 'history';
import configureStore from '../../../utils/configure-store';
import JaegerAPI from '../../../api/jaeger';
import reducer, { actions } from './duck';

jest.mock('../../../api/jaeger', () => {
  return {
    __esModule: true,
    default: {
      archiveTrace: jest.fn(),
    },
  };
});

describe('ArchiveNotifier/duck', () => {
  describe('action factories', () => {
    it('archiveTrace builds action', () => {
      JaegerAPI.archiveTrace.mockReturnValue(Promise.resolve({ id: 'TEST-TRACE-ID' }));
      const action = actions.archiveTrace('TEST-TRACE-ID');
      expect(action).toEqual({
        type: '@JAEGER_API/ARCHIVE_TRACE',
        payload: expect.any(Promise),
        meta: { id: 'TEST-TRACE-ID' },
      });
    });

    it('acknowledge builds action', () => {
      const action = actions.acknowledge('TEST-TRACE-ID');
      expect(action).toEqual({
        type: '@jaeger-ui/archive-trace/ACKNOWLEDGE',
        payload: 'TEST-TRACE-ID',
      });
    });
  });

  describe('action reducers', () => {
    let initialState;

    beforeEach(() => {
      initialState = {
        'TEST-TRACE-ID-1': { isAcknowledged: true, isArchived: true },
      };
    });

    it('acknowledge reducer returns updated state', () => {
      const action = {
        type: '@jaeger-ui/archive-trace/ACKNOWLEDGE',
        payload: 'TEST-TRACE-ID',
      };
      const state = reducer({ 'TEST-TRACE-ID': { isAcknowledged: false, isArchived: true } }, action);
      expect(state).toEqual({ 'TEST-TRACE-ID': { isAcknowledged: true, isArchived: true } });
    });

    it('acknowledge reducer throws on invalid payload', () => {
      const action = {
        type: '@jaeger-ui/archive-trace/ACKNOWLEDGE',
        payload: null,
      };
      expect(() => reducer(undefined, action)).toThrow(
        'Invalid state, missing traceID for archive acknowledge'
      );
    });

    it('acknowledge reducer does not update on acknowledging a loading trace', () => {
      initialState = {
        'TEST-TRACE-ID': { isLoading: true },
      };
      const action = {
        type: '@jaeger-ui/archive-trace/ACKNOWLEDGE',
        payload: 'TEST-TRACE-ID',
      };
      const state = reducer(initialState, action);
      expect(state).toEqual(initialState);
    });

    it('archive_pending reducer returns new state', () => {
      const action = {
        type: '@JAEGER_API/ARCHIVE_TRACE_PENDING',
        meta: { id: 'TEST-TRACE-ID-2' },
      };
      const state = reducer(initialState, action);
      expect(state).toEqual({
        'TEST-TRACE-ID-1': { isAcknowledged: true, isArchived: true },
        'TEST-TRACE-ID-2': { isLoading: true },
      });
    });

    it('archive_fulfilled reducer returns new state', () => {
      const action = {
        type: '@JAEGER_API/ARCHIVE_TRACE_FULFILLED',
        meta: { id: 'TEST-TRACE-ID-2' },
      };
      const state = reducer(initialState, action);
      expect(state).toEqual({
        'TEST-TRACE-ID-1': { isAcknowledged: true, isArchived: true },
        'TEST-TRACE-ID-2': { isAcknowledged: false, isArchived: true },
      });
    });

    it('archive_rejected reducer returns new state', () => {
      const error = new Error('FAILURE');
      const action = {
        type: '@JAEGER_API/ARCHIVE_TRACE_REJECTED',
        payload: error,
        meta: { id: 'TEST-TRACE-ID-2' },
      };
      const state = reducer(initialState, action);
      expect(state).toEqual({
        'TEST-TRACE-ID-1': { isAcknowledged: true, isArchived: true },
        'TEST-TRACE-ID-2': { error, isAcknowledged: false, isArchived: false, isError: true },
      });
    });

    it('archive_rejected reducer throw on missing error', () => {
      const action = {
        type: '@JAEGER_API/ARCHIVE_TRACE_REJECTED',
        meta: { id: 'TEST-TRACE-ID-2' },
      };
      expect(() => reducer(initialState, action)).toThrow('Invalid state, missing API error details');
    });
  });

  describe('store integration', () => {
    let store;

    beforeEach(() => {
      store = configureStore(createMemoryHistory());
      JaegerAPI.archiveTrace.mockReturnValue(Promise.resolve({ id: 'TEST-TRACE-ID' }));
    });

    it('has initial state of empty object', () => {
      const { archive } = store.getState();
      expect(archive).toEqual({});
    });

    it('archives trace', async () => {
      const action = actions.archiveTrace('TEST-TRACE-ID');
      const states = [];

      const unsubscribe = store.subscribe(() => {
        const { archive } = store.getState();
        states.push(archive);
      });

      await store.dispatch(action);

      expect(states).toEqual([
        { 'TEST-TRACE-ID': { isLoading: true } },
        { 'TEST-TRACE-ID': { isAcknowledged: false, isArchived: true } },
      ]);

      unsubscribe();
    });

    it('errors on trace archive', async () => {
      const rejectedPromise = Promise.reject(new Error('API NOT FOUND'));
      JaegerAPI.archiveTrace.mockReturnValue(rejectedPromise);
      const action = actions.archiveTrace('TEST-TRACE-ID');

      const states = [];

      const unsubscribe = store.subscribe(() => {
        const { archive } = store.getState();
        states.push(archive);
      });

      let caughtError;
      try {
        await store.dispatch(action);
      } catch (e) {
        caughtError = e;
      }

      expect(states).toEqual([
        { 'TEST-TRACE-ID': { isLoading: true } },
        {
          'TEST-TRACE-ID': {
            error: caughtError,
            isAcknowledged: false,
            isArchived: false,
            isError: true,
          },
        },
      ]);

      unsubscribe();
    });

    it('acknowledges archived trace', async () => {
      const archiveAction = actions.archiveTrace('TEST-TRACE-ID');
      await store.dispatch(archiveAction);

      const acknowledgeAction = actions.acknowledge('TEST-TRACE-ID');
      store.dispatch(acknowledgeAction);

      const { archive: acknowledgedState } = store.getState();
      expect(acknowledgedState).toEqual({ 'TEST-TRACE-ID': { isAcknowledged: true, isArchived: true } });
    });
  });
});
