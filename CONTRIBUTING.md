# Contributing

As Perses is still a work in progress, the contribution process is still evolving.

We are using GitHub as our main development and discussion forum.

- All PRs should go there.
- We use pull requests and issues for tracking the development of features that are either uncontroversial and/or small
  and don't need much up-front discussion.
- If you are thinking about contributing something more involved, you can use
  the [GitHub discussions](https://github.com/perses/perses/discussions) feature for design discussions before sending a
  pull request or creating a feature request issue.
- Be sure to add [DCO signoffs](https://github.com/probot/dco#how-it-works) to all of your commits.

If you are unsure about what to do, and you are eager to contribute, you can reach us on the development
channel [#perses-dev](https://cloud-native.slack.com/messages/C07KQR95WBE) on [CNCF slack](https://slack.cncf.io/).

## Opening a PR

To help during the release process, we created a script that generates the changelog based on the git history.

To make it work correctly, commit or PR's title should follow the following naming convention:

`[<catalog_entry>] <commit message>`

where `catalog_entry` can be :

- `FEATURE`
- `ENHANCEMENT`
- `BUGFIX`
- `BREAKINGCHANGE`
- `DOC`
- `IGNORE` - Changes that should not generate entries in the changelog. Primarily used for internal tooling changes that
  do not impact consumers.

This catalog entry will indicate the purpose of your PR.

In the usual workflow, all PRs are squashed. There is two exceptions to this rule:

1. During the release process, the release branch is merge back in the `main` branch. To avoid to lose the commit
   message that holds the tag, this kind of PR **MUST** be merged and not squashed.

2. In case your PR contains multiple kind of changes (aka, feature, bugfix ..etc.) and you took care about having
   different commit following the convention described above, then the PR will be merged and not squashed. Like that we
   are preserving the works you did and the effort you made when creating meaningful commit.

## Documentation

Documentation is written in Markdown. To ensure some quality on our documentation, we are
running [mdox](https://github.com/bwplotka/mdox) that will ensure the doc is well formatted and all links are working.

To format the docs, you will have to install the tool mentioned above. An easy way is to run the following command:

```bash
go install github.com/bwplotka/mdox@latest
```

Then to format the doc, run:

```bash
make fmt-docs
```

## Development

This section explains how to build, launch, and start using Perses.

This repository contains two major components of Perses:

- The backend API server written in Go.
- The web application frontend written in TypeScript (using React).

Both components can be started and tested individually as described below.

### Backend API Server

Building and starting the backend API server requires the following tools:

- [Go](https://go.dev/doc/install) (usually the latest version as we are following upstream Go releases closely)
- Make
- [jq](https://stedolan.github.io/jq/download/) to run the populate.sh script below

#### Quick version

With the required dependencies installed, you can run `bash scripts/api_backend_dev.sh` to automatically set up the api
server for local development. The API backend will be available on port 8080.

See "detailed version" for a summary of the steps automated by this script. Follow those instructions if you want more
granular control over building and starting the API server.

#### Detailed version

With the required dependencies installed, you can proceed as follows:

- At the root of the project, build the API server:

```bash
cd ../
make build-api
```

- Finally, run the built binary, using the simple configuration file found in the `dev` folder:

```bash
./bin/perses -config ./dev/config.yaml
```

You should see something like this displayed in your terminal:

```log
$> ./bin/perses -config ./bin/config.yaml
______
| ___ \
| |_/ /__ _ __ ___  ___  ___
|  __/ _ \ '__/ __|/ _ \/ __|
| | |  __/ |  \__ \  __/\__ \
\_|  \___|_|  |___/\___||___/

The secure way to configure your monitoring.               <\
                                                            \\
--------------==========================================>|||<*>//////]
                                                            //
                                                           </

⇨ http server started on [::]:8080

```

The API backend is now available on port 8080 :). You can log in with user: `admin` and password: `password`.

### Web App

See the [ui/README.md](./ui/README.md) file for details around the build process and the structure of the web UI.

### Development Container Image

A Dockerfile can be found at the root of the repo which can build a container
for development purposes which includes both the API and UI.

```
make container-dev
```

The resulting image can be used as follows.

```
# the version here depends on your local git state
=> => naming to localhost:5000/persesdev:v0.51.0-rc.0-48-g18d1e15d

$ docker run -p 8080:8080 localhost:5000/persesdev:v0.51.0-rc.0-48-g18d1e15d
```

The image can be pushed to the registry with a make target.

```
make push-container-dev
```

If you would like to push this image to a remote container registry using the
tag `myregistry.io/myname/myrepo:v0.0.51` then you can use the make targets as
follows. Keep in mind that this is a development image which does not match the
one built by the `goreleaser` build process.

```
export IMAGE_REGISTRY_DEV=myregistry.io/myname
export IMAGE_REPO_DEV=myname
export IMAGE_VERSION_DEV=v0.0.51
make container-dev
make push-container-dev
```
