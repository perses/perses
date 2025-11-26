#!/bin/bash

SESSION="perses-dev"
SESSION_EXISTS=$(tmux list-sessions | grep $SESSION)

if [ "$SESSION_EXISTS" != "" ]; then
    # Attach to existing session
    tmux attach -t $SESSION
    exit 0
fi

USER_TOKEN=$(kubectl --kubeconfig=./dev/kubernetes/local/kind-admin create token user --namespace perses --duration 8760h)

tmux new-session -d -s $SESSION

# |----------|------------|
# |          |   backend  |
# | frontend |------------|
# |          | auth-proxy |
# |----------|------------|

tmux send-keys -t $SESSION:0 'cd ui && npm run start' C-m

tmux split-window -h -t $SESSION:0
tmux send-keys -t $SESSION:0.1 'make build-api && ./bin/perses --config="./dev/config-kubernetes.yaml" --log.level="debug" --web.listen-address=":8081"' C-m

tmux split-window -v -t $SESSION:0.1
tmux send-keys -t $SESSION:0.2 "export USER_TOKEN='$USER_TOKEN'" C-m
tmux send-keys -t $SESSION:0.2 'caddy run --config ./dev/kubernetes/Caddyfile --adapter caddyfile' C-m

tmux attach -t $SESSION
