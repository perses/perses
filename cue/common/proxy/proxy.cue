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

// DEPRECATED
// Import statements like:
// `import "github.com/perses/perses/cue/common/proxy"`
// should be replaced by:
// `import "github.com/perses/spec/cue/datasource/proxy/http"`
// or
// // `import "github.com/perses/spec/cue/datasource/proxy/sql"`

package proxy

import (
	"github.com/perses/spec/cue/datasource"
	httpProxy "github.com/perses/spec/cue/datasource/proxy/http"
	sqlProxy "github.com/perses/spec/cue/datasource/proxy/sql"
)

#HTTPAllowedEndpoint: httpProxy.#AllowedEndpoint

#HTTPProxy: httpProxy.#Proxy

#baseHTTPDatasourceSpec: datasource.#HTTPDatasourceSpec

#MySQL: sqlProxy.#MySQLConfig

#Postgres: sqlProxy.#PostgresConfig

#SQLProxy: sqlProxy.#Proxy

#baseSQLDatasourceSpec: datasource.#SQLDatasourceSpec
