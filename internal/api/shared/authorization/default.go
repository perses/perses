package authorization

import v1 "github.com/perses/perses/pkg/model/api/v1"

var (
	owner  = "owner"
	editor = "editor"
	viewer = "viewer"
)

func DefaultOwnerRole(projectName string) v1.Role {
	return v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: owner,
			},
			Project: projectName,
		},
		Spec: v1.RoleSpec{
			Permissions: []v1.Permission{
				{
					Actions: []v1.ActionKind{v1.CreateAction, v1.ReadAction, v1.UpdateAction, v1.DeleteAction},
					Scopes:  []v1.Kind{v1.KindDashboard, v1.KindDatasource, v1.KindFolder, v1.KindRole, v1.KindRoleBinding, v1.KindSecret, v1.KindVariable},
				},
			},
		},
	}
}

func DefaultEditorRole(projectName string) v1.Role {
	return v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: editor,
			},
			Project: projectName,
		},
		Spec: v1.RoleSpec{
			Permissions: []v1.Permission{
				{
					Actions: []v1.ActionKind{v1.CreateAction, v1.ReadAction, v1.UpdateAction, v1.DeleteAction},
					Scopes:  []v1.Kind{v1.KindDashboard, v1.KindDatasource, v1.KindFolder, v1.KindSecret, v1.KindVariable},
				},
				{
					Actions: []v1.ActionKind{v1.ReadAction},
					Scopes:  []v1.Kind{v1.KindRole, v1.KindRoleBinding},
				},
			},
		},
	}
}

func DefaultViewerRole(projectName string) v1.Role {
	return v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: viewer,
			},
			Project: projectName,
		},
		Spec: v1.RoleSpec{
			Permissions: []v1.Permission{
				{
					Actions: []v1.ActionKind{v1.ReadAction},
					Scopes:  []v1.Kind{v1.KindDashboard, v1.KindDatasource, v1.KindFolder, v1.KindRole, v1.KindRoleBinding, v1.KindSecret, v1.KindVariable},
				},
			},
		},
	}
}

func DefaultOwnerRoleBinding(projectName string, username string) v1.RoleBinding {
	return v1.RoleBinding{
		Kind: v1.KindRoleBinding,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: owner,
			},
			Project: projectName,
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
