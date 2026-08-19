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

package watch

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	apiinterface "github.com/perses/perses/internal/api/interface"
	watchapi "github.com/perses/perses/internal/api/interface/v1/watch"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
)

const keepAlivePeriod = 30 * time.Second

type endpoint struct {
	service watchapi.Service
	authz   authorization.Authorization
}

func NewEndpoint(service watchapi.Service, authz authorization.Authorization) route.Endpoint {
	return &endpoint{service: service, authz: authz}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	g.GET(fmt.Sprintf("/%s", utils.PathWatch), e.watch, false)
}

func (e *endpoint) watch(ctx echo.Context) error {
	if e.authz.IsEnabled() {
		if ok := e.authz.HasPermission(ctx, role.WatchAction, v1.WildcardProject, role.WildcardScope); !ok {
			return apiinterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' scope", role.WatchAction, role.WildcardScope))
		}
	}

	flusher, ok := ctx.Response().Writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("%w: streaming is not supported", apiinterface.InternalError)
	}

	header := ctx.Response().Header()
	header.Set(echo.HeaderContentType, "text/event-stream")
	header.Set(echo.HeaderCacheControl, "no-cache")
	header.Set("Connection", "keep-alive")
	ctx.Response().WriteHeader(http.StatusOK)

	if err := writeSSE(ctx.Response().Writer, "connected", map[string]string{"status": "ok"}); err != nil {
		return err
	}
	flusher.Flush()

	events, unsubscribe := e.service.Subscribe(ctx.Request().Context())
	defer unsubscribe()

	ticker := time.NewTicker(keepAlivePeriod)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Request().Context().Done():
			return nil
		case event, ok := <-events:
			if !ok {
				return nil
			}
			if err := writeSSE(ctx.Response().Writer, "resource", event); err != nil {
				return err
			}
			flusher.Flush()
		case <-ticker.C:
			if _, err := io.WriteString(ctx.Response().Writer, ": keepalive\n\n"); err != nil {
				return err
			}
			flusher.Flush()
		}
	}
}

func writeSSE(writer io.Writer, eventType string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = io.WriteString(writer, fmt.Sprintf("event: %s\ndata: %s\n\n", eventType, data))
	return err
}
