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

package sql

import (
	"encoding/json"
	"errors"
)

// Driver the SQL driver to use
type Driver string

const (
	DriverMySQL      Driver = "mysql"
	DriverMariaDB    Driver = "mariadb"
	DriverPostgreSQL Driver = "postgres"
)

// SSLMode postgres ssl modes
type SSLMode string

const (
	SSLModeDisable    SSLMode = "disable"
	SSLModeAllow      SSLMode = "allow"
	SSLModePreferable SSLMode = "prefer"
	SSLModeRequire    SSLMode = "require"
	SSLModeVerifyFull SSLMode = "verify-full"
	SSLModeVerifyCA   SSLMode = "verify-ca"
)

type Config struct {
	Driver Driver `json:"driver" yaml:"driver"`
	// Host is the hostname required to contact the datasource
	Host string `json:"host" yaml:"host"`
	// Database is the database for the datasource
	Database string `json:"database" yaml:"database"`
	// Username is the username for the datasource
	Username string `json:"username" yaml:"username"`
	// Secret is the name of the secret that should be used for the proxy or discovery configuration
	// It will contain any sensitive information such as password, token, certificate.
	Secret string `json:"secret,omitempty" yaml:"secret,omitempty"`
	// MaxConns is the maximum number of open connections to the database.
	MaxConns int32 `json:"max_conns,omitempty" yaml:"max_conns,omitempty"`
	// SSLMode the ssl configuration when connection to the datasource
	SSLMode SSLMode `json:"ssl_mode,omitempty" yaml:"ssl_mode,omitempty"`
}

func (s *Config) UnmarshalJSON(data []byte) error {
	var tmp Config
	type plain Config
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *Config) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Config
	type plain Config
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*s = tmp
	return nil
}

func (s *Config) validate() error {
	if s.Driver == "" {
		return errors.New("driver is required")
	}

	if s.Host == "" {
		return errors.New("host cannot be empty")
	}

	if s.Database == "" {
		return errors.New("database cannot be empty")
	}

	if s.Username == "" {
		return errors.New("username cannot be empty")
	}

	return nil
}

type Proxy struct {
	Kind string `json:"kind" yaml:"kind"`
	Spec Config `json:"spec" yaml:"spec"`
}

const (
	SQLProxyKindName = "sqlproxy"
)
