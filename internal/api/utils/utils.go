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

package utils

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/jmespath/go-jmespath"
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
	PathView               = "view"
	ContextKeyAnonymous    = "anonymous"
	PersistedClaims        = "persisted_claims"
)

const MetricNamespace = "perses"

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

func IsAnonymous(ctx echo.Context) bool {
	// When there is an anonymous endpoint, the user is not set in the context.
	// During the authorization process, this is something that must be considered.
	value := ctx.Get(ContextKeyAnonymous)
	if value == nil {
		return false
	}
	return value.(bool)
}

// GetMetadataProject Retrieve project from entity metadata
func GetMetadataProject(metadata api.Metadata) string {
	if projectMetadata, ok := metadata.(*v1.ProjectMetadata); ok {
		return projectMetadata.Project
	}
	return ""
}

// GetClaimsFromAccessToken retrieves claims from access token according to the given JMESpath
func GetClaimsFromAccessToken(ctx echo.Context, jmesPath string) []string {
	data := getPersistedClaimsToken(ctx)

	claims, ok := data[jmesPath]
	if !ok {
		return nil
	}

	return claims.([]string)
}

func CreateCookie(name string, payload any) (http.Cookie, error) {
	// marshal payload into json
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return http.Cookie{}, err
	}
	// b64 encode marshaled payload
	encodedPayload := base64.StdEncoding.EncodeToString([]byte(jsonPayload))
	return http.Cookie{
		Name:  name,
		Value: encodedPayload,
	}, nil
}

func CopyClaims(token string, keys []string) map[string]interface{} {
	data := decodeTokenPayload(token)
	if data == nil {
		return nil
	}

	copiedClaims := make(map[string]any)
	for _, key := range keys {
		c := lookupClaim(data, key)
		if c != nil {
			copiedClaims[key] = c
		}
	}

	return copiedClaims
}

func decodeTokenPayload(token string) []byte {
	tokenContents := strings.Split(token, ".")
	if len(tokenContents) != 3 {
		return nil
	}

	// decoding the payload section of the token
	decodedToken, err := base64.StdEncoding.DecodeString(tokenContents[1])
	if err != nil {
		return nil
	}

	var data interface{}
	err = json.Unmarshal(decodedToken, data)
	if err != nil {
		return nil
	}
	return decodedToken
}

func getPersistedClaimsToken(ctx echo.Context) map[string]any {
	// get `persisted_claims` cookie
	cookie, err := ctx.Cookie(PersistedClaims)
	if err != nil {
		return nil
	}

	// decode cookie value
	decodedCookie, err := base64.StdEncoding.DecodeString(cookie.Value)
	if err != nil {
		return nil
	}

	// unmarshal value
	var data map[string]any
	json.Unmarshal(decodedCookie, &data)

	return data
}

func lookupClaim(data any, key string) any {
	extractedData, err := jmespath.Search(key, data)
	if err != nil {
		return nil
	}
	return extractedData
}
