## Required Technologies
1. [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) - run a kubernetes cluster locally
2. [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/#install-kubectl-on-linux) - CLI to connect to a kubernetes cluster
3. [Caddy](https://caddyserver.com/docs/install) - reverse proxy to inject kubernetes Authorization token header

## Running Locally
1. Run `./scripts/run-kubernetes.sh`, this will create and start a kind cluster adding adds all relevant k8s resources (CRD's, users, permissions)

2. Wait until the kind cluster has been started, then start the Perses backend using:

```
make build-api && ./bin/perses --config="./dev/config-kubernetes.yaml" --log.level="debug" --web.listen-address=":8081"
```

3. Start the reverse-proxy using the following commands. This will expose the Perses backend running on localhost:8080, logged in as "user".

```
export USER_TOKEN="$(kubectl --kubeconfig=./dev/kubernetes/local/kind-admin create token user --namespace perses --duration 8760h)"
caddy run --config ./dev/kubernetes/Caddyfile --adapter caddyfile
```

4. Start the frontend app development server running npm run start from ui/app. More details in the UI Readme. Then load http://localhost:3000 in your browser and use Perses using k8s authorization.

## Debugging

If your backend fails to start due to being unable to there being `no such file or directory` for your kubeconfig you may need to provide full file paths for all file locations in the `config-kubernetes.yaml` file.
