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

package shared

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Route struct {
	// Method is the HTTP method such as POST, PUT, DELETE, etc.
	Method  string
	Path    string
	Handler echo.HandlerFunc
	// IsAnonymous is telling if the given route should be accessible without a JWT token.
	IsAnonymous bool
}

func (r *Route) Register(g *echo.Group, middleware ...echo.MiddlewareFunc) {
	g.Add(r.Method, r.Path, r.Handler, middleware...)
}

type Group struct {
	Path   string
	Groups []*Group
	Routes []*Route
}

func (g *Group) Group(path string) *Group {
	newGroup := &Group{
		Path: path,
	}
	g.Groups = append(g.Groups, newGroup)
	return newGroup
}

func (g *Group) POST(path string, h echo.HandlerFunc, isAnonymous bool) {
	g.Routes = append(g.Routes, &Route{
		Method:      http.MethodPost,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
	})
}

func (g *Group) PUT(path string, h echo.HandlerFunc, isAnonymous bool) {
	g.Routes = append(g.Routes, &Route{
		Method:      http.MethodPut,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
	})
}

func (g *Group) GET(path string, h echo.HandlerFunc, isAnonymous bool) {
	g.Routes = append(g.Routes, &Route{
		Method:      http.MethodGet,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
	})
}

func (g *Group) DELETE(path string, h echo.HandlerFunc, isAnonymous bool) {
	g.Routes = append(g.Routes, &Route{
		Method:      http.MethodDelete,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
	})
}
