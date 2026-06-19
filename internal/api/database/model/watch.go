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

package model

import (
	"context"
	"sync"

	"github.com/google/uuid"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

const eventQueueBufferSize = 256
const subscriberBufferSize = 64
const maxSubscribers = 256

// EventPublisher is used by persistence/DAO code to emit low-level watch events.
type EventPublisher interface {
	Publish(event *v1.WatchEvent)
}

// EventSubscriber is used by watch service code to consume low-level events.
type EventSubscriber interface {
	Subscribe(ctx context.Context) (<-chan *v1.WatchEvent, error)
}

// EventWatcher is the low-level watch event bus used by persistence and service layers.
// It implements both interfaces
// - To be used as a publisher from the database.WatchableDAO decorator
// - To be used as a subscriber in the Watch method of each resource's service.
type EventWatcher interface {
	EventPublisher
	EventSubscriber
}
type eventWatcher struct {
	mu          sync.RWMutex
	events      chan *v1.WatchEvent
	subscribers map[string]chan *v1.WatchEvent
}

func NewEventWatcher() EventWatcher {
	w := &eventWatcher{
		events:      make(chan *v1.WatchEvent, eventQueueBufferSize),
		subscribers: map[string]chan *v1.WatchEvent{},
	}
	go w.dispatch()
	return w
}

func (p *eventWatcher) Publish(event *v1.WatchEvent) {
	if event == nil {
		return
	}
	select {
	case p.events <- event:
	default:
		// Queue is full: drop the oldest event to keep the latest one.
		select {
		case <-p.events:
		default:
		}
		select {
		case p.events <- event:
		default:
		}
	}
}

func (p *eventWatcher) Subscribe(ctx context.Context) (<-chan *v1.WatchEvent, error) {
	ch := make(chan *v1.WatchEvent, subscriberBufferSize)

	p.mu.Lock()
	if len(p.subscribers) >= maxSubscribers {
		p.mu.Unlock()
		return nil, ErrNoSubscriberAvailable
	}
	id := uuid.NewString()
	p.subscribers[id] = ch
	p.mu.Unlock()

	go func() {
		<-ctx.Done()
		p.mu.Lock()
		if existing, ok := p.subscribers[id]; ok {
			delete(p.subscribers, id)
			close(existing)
		}
		p.mu.Unlock()
	}()

	return ch, nil
}

func (p *eventWatcher) dispatch() {
	for event := range p.events {
		p.mu.RLock()
		for _, subscriber := range p.subscribers {
			select {
			case subscriber <- event:
			default:
				// Subscriber queue is full: drop the oldest event to keep the latest one.
				select {
				case <-subscriber:
				default:
				}
				select {
				case subscriber <- event:
				default:
				}
			}
		}
		p.mu.RUnlock()
	}
}
