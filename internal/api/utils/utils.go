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
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const (
	ParamDashboard         = "dashboard"
	ParamName              = "name"
	ParamProject           = "project"
	APIPrefix              = "/api"
	PathAuth               = "auth"
	PathAuthProviders      = "auth/providers"
	PathLogin              = "login"
	PathCallback           = "callback"
	PathLogout             = "logout"
	PathRefresh            = "refresh"
	PathDeviceCode         = "device/code"
	PathToken              = "token"
	AuthKindNative         = "native"
	AuthKindOIDC           = "oidc"
	AuthKindOAuth          = "oauth"
	APIV1Prefix            = "/api/v1"
	PathDashboard          = "dashboards"
	PathDatasource         = "datasources"
	PathEphemeralDashboard = "ephemeraldashboards"
	PathFolder             = "folders"
	PathGlobalDatasource   = "globaldatasources"
	PathGlobalRole         = "globalroles"
	PathGlobalRoleBinding  = "globalrolebindings"
	PathGlobalSecret       = "globalsecrets"
	PathGlobalVariable     = "globalvariables"
	PathProject            = "projects"
	PathRole               = "roles"
	PathRoleBinding        = "rolebindings"
	PathSecret             = "secrets"
	PathUnsaved            = "unsaved"
	PathUser               = "users"
	PathVariable           = "variables"
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

// GetMetadataProject Retrieve project from entity metadata
func GetMetadataProject(metadata api.Metadata) string {
	if projectMetadata, ok := metadata.(*v1.ProjectMetadata); ok {
		return projectMetadata.Project
	}
	return ""
}
