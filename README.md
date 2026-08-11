# @ankhorage/deploy

Declarative deployment engine for Expo apps across web, iOS, and Android — build, provision, publish, and manage releases from one configuration.

## Scope

`@ankhorage/deploy` is a standalone, headless package. It owns deployment-domain behavior and must not depend on `@ankhorage/studio` or any Studio UI.

The same engine is intended to support multiple consumers:

- programmatic use from compatible projects
- the `ankh deploy` command surface
- non-interactive CI execution
- the Ankhorage Studio deployment UI

Studio is therefore a consumer of the package, not part of the deployment engine.

## Status

The repository is bootstrapped as an Ankhorage public package. The deployment domain, target/provider boundaries, configuration contracts, provisioning flow, store synchronization, and Studio integration will be specified before implementation.

## Development

```bash
bun install
bun run build
bun run lint
bun run test
bun run knip
bun run typecheck
bun run format:check
bunx @ankhorage/ankh doctor validate .
```

Repository tooling is synchronized with:

```bash
ankh devtools sync
```

## License

MIT
