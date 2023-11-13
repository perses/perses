package rbac

import v1 "github.com/perses/perses/pkg/model/api/v1"

type DisabledImpl struct{}

func (r DisabledImpl) IsEnabled() bool {
	return false
}

func (r DisabledImpl) HasPermission(_ string, _ v1.ActionKind, _ string, _ v1.Kind) bool {
	return true
}

func (r DisabledImpl) Refresh() error {
	return nil
}
