// Copyright (c) 2023 The Jaeger Authors.
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

import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { History, Location } from 'history';
import { useHistory } from './useHistory';

/**
 * Interface representing route-related props passed to the enhanced component.
 * @interface
 * @property {Location} location - The current location object containing information about the URL.
 * @property {string} pathname - The current URL pathname.
 * @property {string} search - The current URL search string.
 * @property {object} params - The URL parameters.
 * @property {History} history - The history object for navigation.
 */
export type IWithRouteProps = {
  location: Location;
  pathname: string;
  search: string;
  params: object;
  history: History;
};

/**
 * Enhances a React component with route-related props. Works similar to withRouter export from react-router-dom v5 below.
 * @function
 * @param {React.ElementType} WrappedComponent - The component to be enhanced.
 * @returns {React.Component} A higher-order component with route-related props.
 */
export default function withRouteProps(WrappedComponent: React.ElementType) {
  /**
   * @function
   * @param {IWithRouteProps|object} props - The props passed to the enhanced component.
   * @returns {React.Component} The enhanced component with additional route-related props.
   */
  return function WithRouteProps(props: object) {
    /**
     * The current location object containing information about the URL.
     * @type {Location}
     */
    const location = useLocation();

    /**
     * The URL parameters extracted from the route.
     * @type {object}
     */
    const params = useParams();

    /**
     * The current URL pathname.
     * @type {string}
     */
    const { pathname } = location;

    /**
     * The current URL search string.
     * @type {string}
     */
    const { search } = location;

    /**
     * The history object for navigation.
     * @type {History}
     */
    const history = useHistory();

    /**
     * Renders the enhanced component with route-related props.
     * @returns {React.Component} The enhanced component with additional route-related props.
     */
    return (
      <WrappedComponent
        {...props}
        location={location}
        pathname={pathname}
        search={search}
        params={params}
        history={history}
      />
    );
  };
}
