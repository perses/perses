// Copyright 2022 The Perses Authors
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
	"errors"
	"fmt"
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
func CheckProject(dao project.DAO) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// we don't need to verify if a project exists in case we are in a PUT / GET / DELETE request since if the project doesn't exist, then the dashboard won't exist either.
			// Also, we avoid an additional query to the DB like that.
			if c.Request().Method != http.MethodPost {
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
						o := &partialObject{}
						if err := c.Bind(o); err != nil {
							return err
						}
						if len(o.Metadata.Project) == 0 {
							return shared.HandleError(fmt.Errorf("%w: metadata.project cannot be empty", shared.BadRequestError))
						}
						projectName = o.Metadata.Project
						break
					}
				}
			}
			if len(projectName) > 0 {
				if _, err := dao.Get(projectName); err != nil {
					if errors.Is(err, shared.NotFoundError) {
						return shared.HandleError(fmt.Errorf("%w, metadata.project %q doesn't exist", shared.BadRequestError, projectName))
					}
					return shared.HandleError(err)
				}
			}
			return next(c)
		}
	}
}
