// Copyright The Perses Authors
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

package proxy

import "strings"

// transportKey builds the identity of a saved datasource, used as a key in the transport cache of the HTTP proxy
// (see http.TransportCache). An empty key means the datasource is not saved.
// Each part is joined with a separator that is not allowed in Perses resource names (nor in a path parameter).
// Note: even in case of a key collision, a transport is only reused if it has been built from the same settings,
// meaning both transports would be strictly equivalent.
func transportKey(parts ...string) string {
	return strings.Join(parts, "/")
}

// globalTransportKey returns the key identifying a global datasource in the transport cache.
func globalTransportKey(datasourceName string) string {
	return transportKey("global", datasourceName)
}

// projectTransportKey returns the key identifying a project datasource in the transport cache.
func projectTransportKey(projectName, datasourceName string) string {
	return transportKey("project", projectName, datasourceName)
}

// dashboardTransportKey returns the key identifying a datasource local to a dashboard in the transport cache.
func dashboardTransportKey(projectName, dashboardName, datasourceName string) string {
	return transportKey("dashboard", projectName, dashboardName, datasourceName)
}
