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

package v1

import (
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/role"
)

// WatchEvent is emitted by the watch SSE endpoint to notify backend resource changes.
type WatchEvent struct {
	Kind    Kind        `json:"kind" yaml:"kind"`
	Project string      `json:"project" yaml:"project"`
	Name    string      `json:"name" yaml:"name"`
	Action  role.Action `json:"action" yaml:"action"`
}

func NewWatchEventFromEntity(entity modelAPI.Entity, action role.Action) *WatchEvent {
	if entity == nil || entity.GetMetadata() == nil {
		return nil
	}
	kind, err := GetKind(entity.GetKind())
	if err != nil {
		return nil
	}
	metadata := entity.GetMetadata()
	return &WatchEvent{
		Kind:    *kind,
		Project: getProjectFromMetadata(metadata),
		Name:    metadata.GetName(),
		Action:  action,
	}
}

func NewDeleteWatchEvent(kind Kind, metadata modelAPI.Metadata) *WatchEvent {
	if metadata == nil {
		return nil
	}
	return &WatchEvent{
		Kind:    kind,
		Project: getProjectFromMetadata(metadata),
		Name:    metadata.GetName(),
		Action:  role.DeleteAction,
	}
}

func getProjectFromMetadata(metadata modelAPI.Metadata) string {
	switch met := metadata.(type) {
	case *ProjectMetadata:
		return met.Project
	case *PublicProjectMetadata:
		return met.Project
	default:
		return ""
	}
}
