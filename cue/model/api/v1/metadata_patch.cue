// Copyright 2023 The Perses Authors
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

package v1

import (
	"strings"
	"time"
)

#Metadata: {
	name: string @go(Name)
	// extra constraints for the name attribute, that reproduces some validation we have on
	// the Golang side placeholder values for the dashboard metadata,
	name: strings.MinRunes(1) & strings.MaxRunes(75)
	name: =~"^[a-zA-Z0-9_.-]+$"

	createdAt: time.Time @go(CreatedAt)
	updatedAt: time.Time @go(UpdatedAt)
	version:   uint64    @go(Version)
	// placeholder values required to pass the CUE evaluation, as those attributes are flagged
	// as mandatory in the (Go) datamodel but populated by the server in the end.
	createdAt: "1970-01-01T00:00:00.000000000Z"
	updatedAt: "1970-01-01T00:00:00.000000000Z"
	version:   1
}

// ProjectMetadata is the metadata struct for resources that belongs to a project.
#ProjectMetadata: {
	#Metadata
	project: string @go(Project)
}
