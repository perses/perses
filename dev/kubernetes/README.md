## Required Technologies
1. [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) - run a kubernetes cluster locally
2. [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/#install-kubectl-on-linux) - CLI to connect to a kubernetes cluster
3. [Caddy](https://caddyserver.com/docs/install) - reverse proxy between frontend and backend to inject kubernetes Authorization token header
4. [tmux](https://github.com/tmux/tmux/wiki/Installing) - terminal multiplexer for single script startup

## Starting kubernetes development
1. `./scripts/run-kubernetes.sh` - Starts a kind cluster and adds all relevant data (CRD's, users, permissions)
2. `./scripts/k8s-dev.sh` - Start a tmux session with the frontend, reverse-proxy for Autorization token, and

## Debugging
If your backend fails to start due to being unable to there being `no such file or directory` for your kubeconfig you may need to provide full file paths for all file locations in the `config-kubernetes.yaml` file.
