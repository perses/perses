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

package middleware

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/shared"
)

type partialMetadata struct {
	Project string `json:"project"`
}

type partialObject struct {
	Metadata partialMetadata `json:"metadata"`
}

// CheckProject is a middleware that will verify if the project used for the request exists.
func CheckProject(svc project.Service) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// we don't need to verify if a project exists in case we are in a PUT / GET / DELETE request since if the project doesn't exist, then the dashboard won't exist either.
			// Also, we avoid an additional query to the DB like that.
			// In case the body is nil, then there is nothing to do about it as well
			if c.Request().Method != http.MethodPost || c.Request().Body == nil {
				return next(c)
			}
			projectName := shared.GetProjectParameter(c)
			if len(projectName) == 0 {
				// It's possible the HTTP Path doesn't contain the project because the user is calling the root endpoint
				// to create a new dashboard for example.
				// So we need to ensure the project name exists in the resource, which is why we will partially decode the body to get the project name.
				// And just to avoid a non-necessary deserialization, we will ensure we are managing a resource that is part of a project by checking the HTTP Path.
				for _, path := range shared.ProjectResourcePathList {
					if strings.HasPrefix(c.Path(), fmt.Sprintf("%s/%s", shared.APIV1Prefix, path)) {
						// Parsing the body in an Echo middleware may cause the error code=400, message=EOF.
						//
						// Context.Bind only can be called only once in the life of the request as it read the body which can only be read once.
						// The request data reader is running out, Context.Bind() function read request body data from the socket buffer, once you took it out, it is just gone
						// That’s why it returns EOF error.
						//
						// In this middleware we need to partially decode the body to see if the project is set.
						// So we read the body, and then we re-inject it in the request.
						bodyBytes, err := io.ReadAll(c.Request().Body)
						if err != nil {
							return fmt.Errorf("%w: %s", shared.BadRequestError, err)
						}
						// write back to request body
						c.Request().Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
						// now we can safely partially decode the body
						o := &partialObject{}
						if unmarshalErr := json.Unmarshal(bodyBytes, o); unmarshalErr != nil {
							return fmt.Errorf("%w: %s", shared.BadRequestError, unmarshalErr)
						}
						if len(o.Metadata.Project) == 0 {
							return fmt.Errorf("%w: metadata.project cannot be empty", shared.BadRequestError)
						}
						projectName = o.Metadata.Project
						break
					}
				}
			}
			if len(projectName) > 0 {
				if _, err := svc.Get(shared.Parameters{Name: projectName}); err != nil {
					if errors.Is(err, shared.NotFoundError) {
						return fmt.Errorf("%w, metadata.project %q doesn't exist", shared.BadRequestError, projectName)
					}
					return err
				}
			}
			return next(c)
		}
	}
}
