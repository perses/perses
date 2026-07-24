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
	"testing"
	"time"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/stretchr/testify/require"
)

func TestServicePublishToSubscriber(t *testing.T) {
	watcher := NewDAOWatcher()
	svc := NewService(watcher)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ch, unsubscribe := svc.Subscribe(ctx)
	defer unsubscribe()

	expected := &v1.WatchEvent{
		Kind:    v1.KindDashboard,
		Project: "project-a",
		Name:    "dashboard-a",
		Action:  role.UpdateAction,
	}
	watcher.Publish(expected)

	select {
	case got := <-ch:
		require.Equal(t, expected, got)
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for watch event")
	}
}

func TestServicePublishBroadcastsToAllSubscribers(t *testing.T) {
	watcher := NewDAOWatcher()
	svc := NewService(watcher)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ch1, unsubscribe1 := svc.Subscribe(ctx)
	defer unsubscribe1()
	ch2, unsubscribe2 := svc.Subscribe(ctx)
	defer unsubscribe2()

	expected := &v1.WatchEvent{
		Kind:    v1.KindDashboard,
		Project: "project-a",
		Name:    "dashboard-a",
		Action:  role.UpdateAction,
	}
	watcher.Publish(expected)

	select {
	case got := <-ch1:
		require.Equal(t, expected, got)
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for watch event on subscriber 1")
	}

	select {
	case got := <-ch2:
		require.Equal(t, expected, got)
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for watch event on subscriber 2")
	}
}

func TestServiceUnsubscribeClosesChannel(t *testing.T) {
	watcher := NewDAOWatcher()
	svc := NewService(watcher)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ch, unsubscribe := svc.Subscribe(ctx)
	unsubscribe()

	_, ok := <-ch
	require.False(t, ok)

	// Must remain non-blocking for publishers after a client unsubscribes.
	watcher.Publish(&v1.WatchEvent{Kind: v1.KindDashboard, Action: role.DeleteAction})
}
