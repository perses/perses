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

import (
	"time"
)

#MySQL: {
	// params Connection parameters
	params?: {[string]: string}
	// max_allowed_packet Max packet size allowed
	max_allowed_packet?: number
	// timeout Dial timeout
	timeout?: time.Duration
	// read_timeout I/O read timeout
	read_timeout?: time.Duration
	// write_timeout I/O read timeout
	write_timeout?: time.Duration
}

#Postgres: {
	// options specifies command-line options to send to the server at connection start
	options?: string
	// max_conns is the maximum size of the pool
	max_conns?: number
	// connect_timeout the timeout value used for socket connect operations.
	connect_timeout?: time.Duration
	// prepare_threshold specifies the number of PreparedStatement executions that must occur before the driver begins using server-side prepared statements.
	prepare_threshold?: number
	// ssl_mode to use when connecting to postgres
	ssl_mode?: "disable" | "allow" | "prefer" | "require" | "verify-ca" | "verify-full"
}

#SQLProxy: {
	kind: "SQLProxy"
	spec: {
		driver: "mysql" | "postgres"
		// host is the hostname and port of the datasource. It is not the hostname of the proxy.
		// The Perses server is the proxy, so it needs to know where to redirect the request.
		host: string
		// database is the name of the database to connect to
		database: string
		// secret is the name of the secret that should be used for the proxy or discovery configuration
		// It will contain any sensitive information such as username, password, token, certificate.
		secret?: string
		// mysql specific driver configurations
		mysql?: #MySQL
		// postgres specific driver configurations
		postgres?: #Postgres
	}
}
