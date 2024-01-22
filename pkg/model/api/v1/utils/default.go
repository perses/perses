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

package utils

import (
	"time"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
)

var (
	owner  = "owner"
	editor = "editor"
	viewer = "viewer"
)

func DefaultOwnerRole(projectName string) *v1.Role {
	now := time.Now().UTC()
	return &v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name:      owner,
				CreatedAt: now,
				UpdatedAt: now,
			},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
				Project: projectName,
			},
		},
		Spec: v1.RoleSpec{
			Permissions: []role.Permission{
				{
					Actions: []role.Action{role.WildcardAction},
					Scopes:  []role.Scope{role.WildcardScope},
				},
			},
		},
	}
}

func DefaultEditorRole(projectName string) *v1.Role {
	now := time.Now().UTC()
	return &v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name:      editor,
				CreatedAt: now,
				UpdatedAt: now,
			},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
				Project: projectName,
			},
		},
		Spec: v1.RoleSpec{
			Permissions: []role.Permission{
				{
					Actions: []role.Action{role.WildcardAction},
					Scopes:  []role.Scope{role.DashboardScope, role.DatasourceScope, role.FolderScope, role.SecretScope, role.VariableScope},
				},
				{
					Actions: []role.Action{role.ReadAction},
					Scopes:  []role.Scope{role.ProjectScope, role.RoleScope, role.RoleBindingScope},
				},
			},
		},
	}
}

func DefaultViewerRole(projectName string) *v1.Role {
	now := time.Now().UTC()
	return &v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name:      viewer,
				CreatedAt: now,
				UpdatedAt: now,
			},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
				Project: projectName,
			},
		},
		Spec: v1.RoleSpec{
			Permissions: []role.Permission{
				{
					Actions: []role.Action{role.ReadAction},
					Scopes:  []role.Scope{role.WildcardScope},
				},
			},
		},
	}
}

func DefaultOwnerRoleBinding(projectName string, username string) *v1.RoleBinding {
	return &v1.RoleBinding{
		Kind: v1.KindRoleBinding,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: owner,
			},
			ProjectMetadataWrapper: v1.ProjectMetadataWrapper{
				Project: projectName,
			},
		},
		Spec: v1.RoleBindingSpec{
			Role: owner,
			Subjects: []v1.Subject{
				{
					Kind: v1.KindUser,
					Name: username,
				},
			},
		},
	}
}
