// Copyright 2021 The Perses Authors
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

package config

import (
	"fmt"
	"time"
)

type FileExtension string

const (
	YAMLExtension FileExtension = "yaml"
	JSONExtension FileExtension = "json"
)

type File struct {
	Folder    string        `json:"folder" yaml:"folder"`
	Extension FileExtension `json:"extension" yaml:"extension"`
}

func (f *File) Verify() error {
	if len(f.Extension) == 0 {
		f.Extension = YAMLExtension
	}
	if f.Extension != YAMLExtension && f.Extension != JSONExtension {
		return fmt.Errorf("wrong file extension defined when using the filesystem as a database. You can only define json or yaml")
	}
	return nil
}

type SQL struct {
	// Username
	User string `json:"user,omitempty" yaml:"user,omitempty"`
	// Password (requires User)
	Password string `json:"password,omitempty" yaml:"password,omitempty"`
	// Network type
	Net string `json:"net,omitempty" yaml:"net,omitempty"`
	// Network address (requires Net)
	Addr string `json:"addr,omitempty" yaml:"addr,omitempty"`
	// Database name
	DBName string `json:"db_name" yaml:"db_name"`
	// Connection collation
	Collation string `json:"collation,omitempty" yaml:"collation,omitempty"`
	// Location for time.Time values
	Loc *time.Location `json:"loc,omitempty" yaml:"loc,omitempty"`
	// Max packet size allowed
	MaxAllowedPacket int `json:"max_allowed_packet" yaml:"maxAllowedPacket"`
	// Server public key name
	ServerPubKey string `json:"server_pub_key" yaml:"server_pub_key"`
	// Dial timeout
	Timeout time.Duration `json:"timeout" yaml:"timeout"`
	// I/O read timeout
	ReadTimeout time.Duration `json:"read_timeout" yaml:"read_timeout"`
	// I/O write timeout
	WriteTimeout time.Duration `json:"write_timeout" yaml:"write_timeout"`
	// Allow all files to be used with LOAD DATA LOCAL INFILE
	AllowAllFiles bool `json:"allow_all_files" yaml:"allow_all_files"`
	// Allows the cleartext client side plugin
	AllowCleartextPasswords bool `json:"allow_cleartext_passwords" yaml:"allow_cleartext_passwords"`
	// Allows fallback to unencrypted connection if server does not support TLS
	AllowFallbackToPlaintext bool `json:"allow_fallback_to_plaintext" yaml:"allow_fallback_to_plaintext"`
	// Allows the native password authentication method
	AllowNativePasswords bool `json:"allow_native_passwords" yaml:"allow_native_passwords"`
	// Allows the old insecure password method
	AllowOldPasswords bool `json:"allow_old_passwords" yaml:"allow_old_passwords"`
	// Check connections for liveness before using them
	CheckConnLiveness bool `json:"check_conn_liveness" yaml:"check_conn_liveness"`
	// Return number of matching rows instead of rows changed
	ClientFoundRows bool `json:"client_found_rows" yaml:"client_found_rows"`
	// Prepend table alias to column names
	ColumnsWithAlias bool `json:"columns_with_alias" yaml:"columns_with_alias"`
	// Interpolate placeholders into query string
	InterpolateParams bool `json:"interpolate_params" yaml:"interpolate_params"`
	// Allow multiple statements in one query
	MultiStatements bool `json:"multi_statements" yaml:"multi_statements"`
	// Parse time values to time.Time
	ParseTime bool `json:"parse_time" yaml:"parse_time"`
	// Reject read-only connections
	RejectReadOnly bool `json:"reject_read_only" yaml:"reject_read_only"`
}

type Database struct {
	File *File `json:"file,omitempty" yaml:"file,omitempty"`
	SQL  *SQL  `json:"sql,omitempty" yaml:"sql,omitempty"`
}
