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

package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"github.com/labstack/echo/v4"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/spec/go/common"
)

// usernameRegexp is common.ValidateID's ID regexp plus ':' and '@', for delegated auth usernames
// (e.g. k8s "kube:admin", OIDC "alice@corp.com"). It still rejects path separators and '%'.
var usernameRegexp = regexp.MustCompile("^[a-zA-Z0-9_.:@-]+$")

// usernameMaxLength is larger than common.ValidateID's 75-char DB-key limit: this name is only compared
// to the authenticated user (never used as a storage key) and delegated identities can be long.
const usernameMaxLength = 253

// validateUsername validates a URL-decoded username from the HTTP path. It keeps common.ValidateID's
// path-traversal protections (no '..', no leading/trailing '.', strict allow-list) while allowing ':' and '@'.
func validateUsername(name string) error {
	if len(name) == 0 {
		return fmt.Errorf("name cannot be empty")
	}
	if len(name) > usernameMaxLength {
		return fmt.Errorf("cannot contain more than %d characters", usernameMaxLength)
	}
	if !usernameRegexp.MatchString(name) {
		return fmt.Errorf("%q is not a correct name. It should match the regexp: %s", name, usernameRegexp.String())
	}
	if strings.Contains(name, "..") {
		return fmt.Errorf("%q is not a correct name. It should not contain '..'", name)
	}
	if strings.HasPrefix(name, ".") || strings.HasSuffix(name, ".") {
		return fmt.Errorf("%q is not a correct name. It should not start or end with '.'", name)
	}
	return nil
}

type partialMetadata struct {
	Project string `json:"project"`
}

type partialObject struct {
	Metadata partialMetadata `json:"metadata"`
}

// CheckParameter is a middleware that will verify if the project used for the request exists.
// It will also check if the project name and the resource name are valid. This is required to prevent any path traversal attack.
// apiPrefix is the optional prefix configured by the user (config `api_prefix`) under which every route is registered.
func CheckParameter(svc project.Service, apiPrefix string) echo.MiddlewareFunc {
	apiV1Prefix := apiPrefix + utils.APIV1Prefix
	// The only route whose name is a delegated auth username (decoded by its handler), so the only one
	// that accepts percent-encoded names. Built once to avoid formatting it on every request.
	userPermissionsRoute := fmt.Sprintf("%s/%s/:%s/%s", apiV1Prefix, utils.PathUser, utils.ParamName, utils.PathPermissions)
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// This middleware is only used for the REST API (/api/v1). So we will skip any other route that doesn't start with the API prefix.
			// This is required because other routes such as the proxy are using the same `name` path parameter, but for the dashboard-local datasources
			// the name is a free-form key of `dashboard.spec.datasources` (it can contain spaces for example) and must not be rejected.
			if !strings.HasPrefix(c.Path(), apiV1Prefix) {
				return next(c)
			}
			method := c.Request().Method
			projectName := utils.GetProjectParameter(c)
			name := utils.GetNameParameter(c)
			// The name needs to be verified because it is used as a key in the database and this can be used to perform a path traversal attack.
			// (e.g. DELETE /api/v1/projects/.. was deleting the entire database).

			if len(name) > 0 {
				if c.Path() == userPermissionsRoute {
					// Delegated usernames (e.g. /api/v1/users/kube%3Aadmin/permissions) are percent-encoded,
					// so decode before validating. The raw param is left untouched; the handler decodes it itself.
					decodedName, unescapeErr := url.PathUnescape(name)
					if unescapeErr != nil {
						return apiInterface.HandleBadRequestError(fmt.Sprintf("the name is invalid: %s", unescapeErr.Error()))
					}
					if err := validateUsername(decodedName); err != nil {
						return apiInterface.HandleBadRequestError(fmt.Sprintf("the name is invalid: %s", err.Error()))
					}
				} else if err := common.ValidateID(name); err != nil {
					return apiInterface.HandleBadRequestError(fmt.Sprintf("the name is invalid: %s", err.Error()))
				}
			}
			if len(projectName) == 0 && method == http.MethodPost && c.Request().Body != nil {
				// It's possible the HTTP Path doesn't contain the project because the user is calling the root endpoint to create a new resource.
				// So we need to ensure the project name exists in the resource, which is why we will partially decode the body to get the project name.
				// And just to avoid a non-necessary deserialization, we will ensure we are managing a resource that is part of a project by checking the HTTP Path.
				for _, path := range utils.ProjectResourcePathList {
					if strings.HasPrefix(c.Path(), fmt.Sprintf("%s/%s", apiV1Prefix, path)) {
						// Parsing the body in Echo middleware may cause the error code=400, message=EOF.
						//
						// Context.Bind only can be called only once in the life of the request as it read the body which can only be read once.
						// The request data reader is running out, Context.Bind() function read request body data from the socket buffer, once you took it out, it is just gone
						// That’s why it returns EOF error.
						//
						// In this middleware we need to partially decode the body to see if the project is set.
						// So we read the body, and then we re-inject it in the request.
						bodyBytes, err := io.ReadAll(c.Request().Body)
						if err != nil {
							return apiInterface.HandleBadRequestError(err.Error())
						}
						// write back to request body
						c.Request().Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
						// now we can safely partially decode the body
						o := &partialObject{}
						if unmarshalErr := json.Unmarshal(bodyBytes, o); unmarshalErr != nil {
							return apiInterface.HandleBadRequestError(unmarshalErr.Error())
						}
						if len(o.Metadata.Project) == 0 {
							return apiInterface.HandleBadRequestError("metadata.project cannot be empty")
						}
						projectName = o.Metadata.Project
						break
					}
				}
			}
			if len(projectName) > 0 {
				// In any case, we need to validate the project name. That will prevent any usage of the project name for a path traversal attack.
				// This is required specially for method PUT and DELETE since we don't check if the project exists in those cases, so we need to ensure the project name is valid.
				// Without this check, a user could delete a resource that belongs to a project that doesn't exist by using a path traversal attack like: /api/v1/dashboards/../variables/anyVariableName
				if err := common.ValidateID(projectName); err != nil {
					return apiInterface.HandleBadRequestError(fmt.Sprintf("the project name is invalid: %s", err.Error()))
				}
				// We don't need to verify if a project exists in case we are in a PUT / DELETE request since if the project doesn't exist, then the resource that belongs to a project won't exist either.
				// Also, we avoid an additional query to the DB like that.
				if method == http.MethodPost || method == http.MethodGet {
					if _, err := svc.Get(apiInterface.Parameters{Name: projectName}); err != nil {
						if databaseModel.IsKeyNotFound(err) {
							return apiInterface.HandleBadRequestError(apiInterface.ProjectDoesNotExistErrorMessage(projectName))
						}
						return err
					}
				}
			}
			return next(c)
		}
	}
}
