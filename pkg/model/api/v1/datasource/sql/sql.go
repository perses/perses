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
	"fmt"
	"time"
)

// Driver the SQL driver to use
type Driver string

const (
	DriverMySQL      Driver = "mysql"
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

type MySQLConfig struct {
	Params           map[string]string `json:"params,omitempty" yaml:"params,omitempty"`
	MaxAllowedPacket int               `json:"maxAllowedPacket,omitempty" yaml:"maxAllowedPacket,omitempty"`
	Timeout          time.Duration     `json:"timeout,omitempty" yaml:"timeout,omitempty"`
	ReadTimeout      time.Duration     `json:"readTimeout,omitempty" yaml:"readTimeout,omitempty"`
	WriteTimeout     time.Duration     `json:"writeTimeout,omitempty" yaml:"writeTimeout,omitempty"`
}

type PostgresConfig struct {
	// MaxConns is the maximum size of the pool
	MaxConns int32 `json:"maxConns,omitempty" yaml:"maxConns,omitempty"`
	// ConnectTimeout the timeout value used for socket connect operations.
	ConnectTimeout time.Duration `json:"connectTimeout,omitempty" yaml:"connectTimeout,omitempty"`
	// PrepareThreshold specifies the number of PreparedStatement executions that must occur before the driver begins using server-side prepared statements.
	PrepareThreshold *int `json:"prepareThreshold,omitempty" yaml:"prepareThreshold,omitempty"`
	// SSLMode to use when connecting to postgres
	SSLMode SSLMode `json:"sslMode,omitempty" yaml:"sslMode,omitempty"`
	// Options specifies command-line options to send to the server at connection start
	Options string `json:"options,omitempty" yaml:"options,omitempty"`
}

func (p *PostgresConfig) UnmarshalJSON(data []byte) error {
	var tmp PostgresConfig
	type plain PostgresConfig
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PostgresConfig) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp PostgresConfig
	type plain PostgresConfig
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PostgresConfig) validate() error {
	if p.SSLMode != "" {
		switch p.SSLMode {
		case SSLModeDisable,
			SSLModeAllow,
			SSLModePreferable,
			SSLModeRequire,
			SSLModeVerifyFull,
			SSLModeVerifyCA:
		default:
			return fmt.Errorf("unknown ssl mode %s", p.SSLMode)
		}
	}
	return nil
}

type Config struct {
	Driver Driver `json:"driver" yaml:"driver"`
	// Host is the hostname required to contact the datasource
	Host string `json:"host" yaml:"host"`
	// Database is the database for the datasource
	Database string `json:"database" yaml:"database"`
	// Secret is the name of the secret that should be used for the proxy or discovery configuration
	// It will contain any sensitive information such as username, password, token, certificate.
	Secret string `json:"secret,omitempty" yaml:"secret,omitempty"`
	// MySQL specific driver config
	MySQL *MySQLConfig `json:"mysql,omitempty" yaml:"mysql,omitempty"`
	// Postgres specific driver config
	Postgres *PostgresConfig `json:"postgres,omitempty" yaml:"postgres,omitempty"`
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

	if s.Driver != DriverMySQL && s.Driver != DriverPostgreSQL {
		return fmt.Errorf("driver %s is not supported", s.Driver)
	}

	if s.Host == "" {
		return errors.New("host cannot be empty")
	}

	if s.Database == "" {
		return errors.New("database cannot be empty")
	}

	return nil
}

type Proxy struct {
	Kind string `json:"kind" yaml:"kind"`
	Spec Config `json:"spec" yaml:"spec"`
}

const (
	ProxyKindName = "sqlproxy"
)
