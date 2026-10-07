# woia-organization-knowledge

Portable Agent Plugin for Versioned organization knowledge corpus with owner-approved publishing.

## Capability

~~~text
DISCOVER -> DECIDE -> IMPLEMENT -> VALIDATE -> REPORT
~~~

The plugin adapts to the repository it operates on without requiring the consumer to adopt WOIA's authoring toolchain.

## Portable package

~~~text
plugin.json
README.md
CHANGELOG.md
LICENSE
skills/**
# optional source diagnostic when retained by the repository
CHECKSUMS.sha256
~~~

`CHECKSUMS.sha256` is optional source evidence, not a required portable/release artifact.

Add `mcp.json` only if the capability genuinely requires MCP.

## Consumer requirements

Document only genuine capability/runtime requirements here. Do not list maintenance Node/pnpm/Mise/Docker unless the portable capability itself truly needs them.

## Development

~~~text
mise install
mise run bootstrap
mise run doctor
mise run ci:fast
mise run ci:extended
mise run release:check
~~~

## W1 provider implementation

Versioned SOP/FAQ/template/manual/criteria/policy corpus only; no business state. Proposals are never published facts. Owner-approved publication/archive preserves previous immutable versions. People resolves guidance by reference, not copying corpus.

[Portable operation contract](skills/woia-organization-knowledge/references/contract.md). Import execute/initial from skills/woia-organization-knowledge/scripts/provider.mjs. No backend or live adapter is qualified. Public fixtures are synthetic; authenticated host must resolve current policies and persist transitions atomically with revision fencing.
