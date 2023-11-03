package authorization

import v1 "github.com/perses/perses/pkg/model/api/v1"

const (
	wildcard = "*"
)

func PermissionListHasPermission(permissions []*v1.Permission, reqAction v1.ActionKind, reqScope v1.Kind) bool {
	for _, permission := range permissions {
		for _, action := range permission.Actions {
			if action == reqAction || action == v1.WildcardAction {
				for _, scope := range permission.Scopes {
					if scope == reqScope || scope == wildcard { // TODO: wildcard var
						return true
					}
				}
			}
		}
	}
	return false
}

type Need struct {
	Action v1.ActionKind
	// If project is empty it's a global permission
	Project string
	Scope   v1.Kind
}
