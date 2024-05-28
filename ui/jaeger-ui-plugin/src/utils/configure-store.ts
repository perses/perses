/* eslint-disable import/no-extraneous-dependencies */
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

import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { createReduxHistoryContext } from 'redux-first-history';
import { createBrowserHistory } from 'history';

import traceTimeline from '../components/TracePage/TraceTimelineViewer/duck';
import { getAppEnvironment } from './constants';

const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
  history: createBrowserHistory(),
});

export default function configureStore() {
  return createStore(
    combineReducers({
      traceTimeline,
      router: routerReducer,
    }),
    compose(
      applyMiddleware(
        routerMiddleware
      ),
      getAppEnvironment() !== 'production' && window && (window as any).__REDUX_DEVTOOLS_EXTENSION__
        ? (window as any).__REDUX_DEVTOOLS_EXTENSION__()
        : (noop: any) => noop
    )
  );
}

export const store = configureStore();
export const history = createReduxHistory(store);

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
