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

package model

import (
	"io"

	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type Query interface {
}

type DAO interface {
	io.Closer
	Init() error
	Create(entity modelAPI.Entity) error
	Upsert(entity modelAPI.Entity) error
	// Get will find a unique object. It will depend on the implementation to generate the key based on the kind and the metadata.
	// entity is the object that will be used by the method to set the value returned by the database.
	Get(kind modelV1.Kind, metadata modelAPI.Metadata, entity modelAPI.Entity) error
	// Query will find a list of resource that is matching the query passed in parameter. The list found will be set in slice.
	// slice is an interface for casting simplification. But slice must be a pointer to a slice of modelAPI.Metadata
	Query(query Query, slice interface{}) error
	Delete(kind modelV1.Kind, metadata modelAPI.Metadata) error
	HealthCheck() bool
}
