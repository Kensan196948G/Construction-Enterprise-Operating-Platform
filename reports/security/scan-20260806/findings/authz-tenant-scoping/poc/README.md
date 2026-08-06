# PoC

`poc.ts` boots the real application (`createApp()` + `createServer()`) on
`127.0.0.1:4871` with in-memory repositories, performs the HTTP requests, and
prints a JSON result. It requires Node.js >= 22.6 (native TypeScript support).

Run (the script imports the application source by absolute path, so run it
from the checked-out repository workspace):

```sh
node --experimental-strip-types artifacts/05_findings/authz-tenant-scoping/poc/poc.ts
```

or copy `poc.ts` to the repository root and run:

```sh
node --experimental-strip-types poc.ts
```

`poc_output.txt` contains representative output from the validated run.
