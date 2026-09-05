# Releases

This page describes the release processes. It's inspired from
the [Prometheus release process](https://github.com/prometheus/prometheus/blob/main/RELEASE.md)

## Release schedule

We are starting a new release cycle every 3 months.

| release series | date of first beta-release (year-month-day) | release shepherd                                  |
|----------------|---------------------------------------------|---------------------------------------------------|
| v0.55          | 2026-09-14                                  | Celian Garcia (GitHub: @celian-garcia)            |
| v0.56          | 2027-01-04                                  | Akshay Iyyadurai Balasundaram (GitHub: @ibakshay) |
| v0.57          | 2027-04-05                                  | **volunteer welcome**                             |

Note: Ideally you will finish the release cycle at most one month after the first `beta-release`.

## How to cut an individual release

### Branch management and versioning strategy

We use [Semantic Versioning](https://semver.org/).

The current flow is to merge new features and bugfixes into the main branch.

We don't intend to maintain previous version. Only the last version will be patched if we estimate it requires an urgent
patch that cannot wait for the next minor release.

### 0. Understand the dependency of Perses

Perses is depending on multiple dependencies but the one that you will need to manage are coming from the repository
`perses/spec` and `perses/shared`.

So before creating a new version of Perses, you may have to update first this internal dependency.

Also note that for each minor release we are updating the plugins. So you will probably have to upgrade the plugin as
well.

To be able to release the plugins, please read
the [documentation](https://github.com/perses/plugins/blob/main/RELEASE.md).

Note:

1. The specification is following its own versioning as it is unrelated from Perses. You can see Perses as an example of
   how the specification can be used.
2. The version of the shared packages is synchronized with Perses. This is done in order to tell with which version
   Perses is compatible without having to maintain a compatibility matrix.

### 1. Prepare your release

#### Create a release branch

For a new release cycle, you will need first to create a release branch based on the latest commit from the `main`
branch.

The branch created has to follow the naming pattern `release/v<X.Y>` (no patch version!) and includes the changes you
intend to release (usually the latest from `main`). Push it to GitHub. You will use this branch as the base in the next
step.

> ⚠️ Release candidates and patch releases for any given major or minor release happen in the same
> `release/v<major>.<minor>` branch. Do not create `release/<version>` for patch or release candidate releases.

For the version of a release cycle, start with the version `v0.X.Y-beta.0`.

Note for the release shepherd:

- To simplify the work and the coordination around the release, when you are still cutting beta release, you can simply
  merge the branch `main` into the release branch.
- When you will reach the release candidate release, you will have to stop to do that to avoid introducing new features
  or enhancements that might cause instability and delay the final release. Instead, you need to ask to contributors or
  maintainers to target the release branch when opening a PR that is fixing a bug.
- Only bugfixes can be accepted when you are cutting release candidate.

#### Create a PR with the changes

- Create a branch based on the release branch `release/v<X.Y>` you just created in the step above. This branch should
  use the naming pattern `<yourname>/release-v<major>.<minor>.<patch>`.
- Update the file `VERSION` with the new version to be created.
- Generate `CHANGELOG.md` updates based on git history:

  ```bash
  make generate-changelog
  ```
- Review the generated `CHANGELOG.md` for valid output. Things to check include:
  - Entries in the `CHANGELOG.md` are meant to be in this order:
    * `[SECURITY]`
    * `[FEATURE]`
    * `[ENHANCEMENT]`
    * `[BUGFIX]`
    * `[BREAKINGCHANGE]`
  - Entries that map to a pull request should include a pull request number.
  - As we have many libraries we publish, it's better if you also put a clear indication about what library is
    affected by these changes.
  - Consumers understand how to handle breaking changes either through the messaging in the changelog or through the
    linked pull requests.
- Add to the generated `CHANGELOG.md` the entries coming from the different plugins updated.
- Update the `package.json` files for all packages with the corresponding version:

  ```bash
  make bump-version
  ```
- Push the branch to GitHub and create a pull request with the release branch as the base. This gives others the
  opportunity to chime in on the release, in general, and on the addition to the changelog, in particular.
  - It's also helpful to drop a link to the release PR in #perses-dev on Matrix to get extra visibility.
- Address any necessary feedback.
- Once the pull request is approved, merge it into the release branch.

### 2. Create release tag and validate release

- Pull down the latest updates to the release branch on your local machine to ensure you have the updates from the
  previous step.
- Tag the new release via the following commands:

  ```bash
  git checkout release/v<version_to_be_replaced>
  make tag
  git push origin v<version_to_be_replaced>
  ```

Signing a tag with a GPG key is appreciated, but in case you can't add a GPG key to your Github account using the
following [procedure](https://docs.github.com/en/authentication/managing-commit-signature-verification), you can replace
the `-s` flag by `-a` flag of the git tag command to only annotate the tag without signing. If you are using a newer Mac
and hit an error like "gpg failed to sign the data fatal: failed to write commit object,"
see [this Stack Overflow question](https://stackoverflow.com/questions/39494631/gpg-failed-to-sign-the-data-fatal-failed-to-write-commit-object-git-2-10-0/40066889#40066889)
for assistance.

Once a tag is created, an automated release process for this tag is triggered via Github Actions. This automated process
includes:

- Publishing cuelang libs.
- Building new go binaries and docker images.
- Publishing the docker images to Docker Hub.
- Creating a new GitHub release that uses the changelog as the release notes and provides tarballs with the latest go
  binaries.
- Generating and attaching SBOM (Software Bill of Materials) artifacts to the Github release:
  - `perses_<version>_<os>_<arch>.tar.gz.sbom.spdx.json` — SPDX JSON SBOM for each Go release archive, generated
    by [syft](https://github.com/anchore/syft) via GoReleaser.
  - `perses_<version>_source.tar.gz.sbom.spdx.json` — SPDX JSON SBOM for the source tarball.
  - `ui-sbom.cdx.json` — CycloneDX JSON SBOM covering all JavaScript dependencies of the React frontend, generated
    by [`pnpm sbom`](https://pnpm.io/cli/sbom).

Please verify that the GitHub Actions complete successfully. Once they are completed, check that everything looks good
in the new GitHub Release. If you realize we need to adjust something in the release notes, you can edit it directly in
the GitHub UI.

### 3. Merge the release into `main`

The release branch cannot be deleted in order to be able to create a patch release. This is needed to address bugs or
minor issues with the release you just made.

During the release cycle, specially when cutting release candidate, you will have to merge the release branch into main
in order to have the bugfixes back to main.

1. You can simply open a pull request to merge the release branch into main. This is only acceptable if there is no
   conflict.
2. In case you have conflict, you will have to create another branch based on the release branch, released the conflict
   and then open a PR with your branch and target `main`.

When this PR is approved, merge it into `main` :warning: **using the "merge pull request" option, not "squash and
merge"**.

At anymoment, you **MUST NOT** squash the release branch into `main` because you will make the release commit disappear,
and trust me you want to be able to find back the commit that has been tagged in the GitHub history.

### 4. Find a new shepherd for the next release cycle

Once you have finally reached the final release (congratulation btw!), you will have to find someone to manage the next
release cycle and set the date of the next release.
