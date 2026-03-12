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

package common

import (
	"github.com/perses/spec/go/common"
)

// ValidateID checks for forbidden items in substring used inside id
// DEPRECATED: this is replaced by the struct github.com/perses/spec/go/common.ValidateID
func ValidateID(name string) error {
	return common.ValidateID(name)
}

// ValidateDescription checks for forbidden items in substring used inside description
// DEPRECATED: this is replaced by the struct github.com/perses/spec/go/common.ValidateDescription
func ValidateDescription(description string) error {
	return common.ValidateDescription(description)
}
