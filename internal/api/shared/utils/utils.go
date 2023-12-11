// Copyright 2021 The Perses Authors
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
	"fmt"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/sirupsen/logrus"
)

const (
	ParamDashboard        = "dashboard"
	ParamName             = "name"
	ParamProject          = "project"
	APIPrefix             = "/api"
	PathAuth              = "auth"
	PathAuthProviders     = "auth/providers"
	PathLogin             = "login"
	PathCallback          = "callback"
	PathLogout            = "logout"
	PathRefresh           = "refresh"
	AuthKindNative        = "native"
	AuthKindOIDC          = "oidc"
	AuthKindOAuth         = "oauth"
	APIV1Prefix           = "/api/v1"
	PathDashboard         = "dashboards"
	PathDatasource        = "datasources"
	PathFolder            = "folders"
	PathGlobalDatasource  = "globaldatasources"
	PathGlobalRole        = "globalroles"
	PathGlobalRoleBinding = "globalrolebindings"
	PathGlobalSecret      = "globalsecrets"
	PathGlobalVariable    = "globalvariables"
	PathProject           = "projects"
	PathRole              = "roles"
	PathRoleBinding       = "rolebindings"
	PathSecret            = "secrets"
	PathUser              = "users"
	PathVariable          = "variables"
)

// ProjectResourcePathList is containing the list of the resource path that is part of a project.
var ProjectResourcePathList = []string{
	PathDashboard, PathDatasource, PathFolder, PathRole, PathRoleBinding, PathSecret, PathVariable,
}

func GetNameParameter(ctx echo.Context) string {
	return ctx.Param(ParamName)
}

func GetProjectParameter(ctx echo.Context) string {
	return ctx.Param(ParamProject)
}

// validateMetadataVersusParameter is the generic method used to validate provided metadata against the parameters in the context
//   - If the parameter in the context is empty, no checks are performed => OK
//   - Else
//   - If metadata value is empty, it is overridden with the context value => OK
//   - Else
//   - If the values are not matching return an error => KO
//   - Else => OK
func validateMetadataVersusParameter(ctx echo.Context, paramName string, metadataValue *string) error {
	paramValue := ctx.Param(paramName)
	if len(paramValue) > 0 {
		if len(*metadataValue) <= 0 {
			logrus.Debugf("overridden empty metadata value with %s parameter value '%s'", paramName, paramValue)
			*metadataValue = paramValue
		} else if *metadataValue != paramValue {
			return fmt.Errorf("%s parameter value '%s' does not match provided metadata value '%s'", paramName, paramValue, *metadataValue)
		}
	}
	return nil
}

func ValidateMetadata(ctx echo.Context, metadata api.Metadata) error {
	if err := common.ValidateID(metadata.GetName()); err != nil {
		return err
	}
	switch met := metadata.(type) {
	case *v1.ProjectMetadata:
		if err := validateMetadataVersusParameter(ctx, ParamProject, &met.Project); err != nil {
			return err
		}
	}
	return nil
}

// GetMetadataProject Retrieve project from entity metadata
func GetMetadataProject(metadata api.Metadata) string {
	if projectMetadata, ok := metadata.(*v1.ProjectMetadata); ok {
		return projectMetadata.Project
	}
	return ""
}

// AppendIfMissing will append the value in the slice, only if not already present.
// Will return a boolean saying if the value has been appended or not.
func AppendIfMissing[T comparable](slice []T, value T) ([]T, bool) {
	for _, e := range slice {
		if e == value {
			return slice, false
		}
	}
	return append(slice, value), true
}
