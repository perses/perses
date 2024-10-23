package common

import "github.com/perses/perses/pkg/model/api/v1/common"

type MergeIndexedColumnTransform struct {
	Column string `json:"column" yaml:"column"`
}

type JoinByColumnValueTransform struct {
	Column string `json:"column" yaml:"column"`
}

type TransformSpec struct {
	Plugin   common.Plugin `json:"plugin" yaml:"plugin"`
	Disabled bool          `json:"disabled" yaml:"disabled"`
}

type Transform struct {
	Kind string        `json:"kind" yaml:"kind"`
	Spec TransformSpec `json:"spec" yaml:"spec"`
}
