// Copyright 2025 The Perses Authors
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

#SQLProxy: {
	kind: "SQLProxy"
	spec: {
		driver: "mysql" | "mariadb" | "postgres"
		// host is the hostname and port of the datasource. It is not the hostname of the proxy.
		// The Perses server is the proxy, so it needs to know where to redirect the request.
		host: string
		// database is the name of the database to connect to
		database: string
		// username is the name of the username to connect as
		username: string
		// secret is the name of the secret that should be used for the proxy or discovery configuration
		// It will contain any sensitive information such as password, token, certificate.
		secret?: string
		// max_conns is the number of max connections for the datasource
		max_conns?: number
		// ssl_mode the ssl configuration when connection to the datasource (used for postgres)
		ssl_mode?: "disable" | "allow" | "prefer" | "require" | "verify-ca" | "verify-full"
	}
}
