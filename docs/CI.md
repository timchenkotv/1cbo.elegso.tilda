# Continuous integration

The sanitized public repository is checked by a repository-scoped self-hosted
runner. The workflow runs only for pushes to `main` or trusted `codex/**`
branches and for an explicit manual dispatch; fork pull requests never receive
a self-hosted job.

CI runs `npm run check` against the public site projection. The runner has no
deployment credentials or access to private infrastructure. The internal
deployment history, operations files and internal documentation are not part
of this public repository or its CI checkout.
