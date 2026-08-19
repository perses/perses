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
	"sync"

	"github.com/perses/perses/internal/api/interface/v1/watch"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const subscriberBufferSize = 64

type service struct {
	mu          sync.RWMutex
	nextID      int
	daoWatcher  watch.EventSubscriber
	subscribers map[int]chan *v1.WatchEvent
}

func NewService(daoWatcher watch.EventSubscriber) watch.Service {
	svc := &service{
		daoWatcher:  daoWatcher,
		subscribers: map[int]chan *v1.WatchEvent{},
	}
	go svc.dispatch()
	return svc
}

func (s *service) Subscribe(ctx context.Context) (<-chan *v1.WatchEvent, func()) {
	ch := make(chan *v1.WatchEvent, subscriberBufferSize)

	s.mu.Lock()
	id := s.nextID
	s.nextID++
	s.subscribers[id] = ch
	s.mu.Unlock()

	unsubscribe := func() {
		s.mu.Lock()
		if existing, ok := s.subscribers[id]; ok {
			delete(s.subscribers, id)
			close(existing)
		}
		s.mu.Unlock()
	}

	go func() {
		<-ctx.Done()
		unsubscribe()
	}()

	return ch, unsubscribe
}

func (s *service) dispatch() {
	events, _ := s.daoWatcher.Subscribe(context.Background())
	for event := range events {
		s.mu.RLock()
		for _, subscriber := range s.subscribers {
			select {
			case subscriber <- event:
			default:
				// Slow subscribers are skipped to keep dispatch non-blocking.
			}
		}
		s.mu.RUnlock()
	}
}
