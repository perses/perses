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
	"context"

	"github.com/perses/perses/internal/api/interface/v1/watch"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const eventQueueBufferSize = 256

type watcherImpl struct {
	events chan *v1.WatchEvent
}

func NewDAOWatcher() watch.DAOWatcher {
	return &watcherImpl{events: make(chan *v1.WatchEvent, eventQueueBufferSize)}
}

func (p *watcherImpl) Publish(event *v1.WatchEvent) {
	if event == nil {
		return
	}
	select {
	case p.events <- event:
	default:
		// Keep DB writes non-blocking when the watch queue is saturated.
	}
}

func (p *watcherImpl) Subscribe(_ context.Context) (<-chan *v1.WatchEvent, func()) {
	return p.events, func() {}
}
