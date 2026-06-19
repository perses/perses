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

// Package shared holds visual helpers and constants reused across panels.
// It is imported (transitively, through the panels package) by every dashboard.
package shared

const (
	// ColorGreen / ColorRed are reused to keep a consistent palette across panels.
	ColorGreen = "#0be300"
	ColorRed   = "#e3000b"

	// DefaultFilter is the common label filter applied to every query.
	DefaultFilter = `instance=~"$instance"`
)

