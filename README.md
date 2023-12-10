![https://github.com/seita1996/homelens/blob/main/client/public/homelens-logo.png](https://github.com/seita1996/homelens/blob/main/client/public/homelens-logo.png)

[![Client test](https://github.com/seita1996/homelens/actions/workflows/client-ci.yml/badge.svg)](https://github.com/seita1996/homelens/actions/workflows/client-ci.yml)
[![Server test](https://github.com/seita1996/homelens/actions/workflows/server-ci.yml/badge.svg)](https://github.com/seita1996/homelens/actions/workflows/server-ci.yml)
[![E2E Test](https://github.com/seita1996/homelens/actions/workflows/e2e-test.yml/badge.svg)](https://seita1996.github.io/homelens/)
[![CodeQL](https://github.com/seita1996/homelens/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/seita1996/homelens/actions/workflows/codeql-analysis.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is homelens?

Video communication using WebRTC within the same LAN.

No account is required, No application installation is needed, and video communication is possible between devices accessing the page.

Communication with the WebSocket server occurs only for terminal detection, but all video streaming is secure and fast because it is closed within your LAN.

(NAT traversal video communication is not possible.)

## Development

docker-compose.yml is available.

The [Client](https://github.com/seita1996/homelens/tree/main/client) is written in [TypeScript](https://www.typescriptlang.org/).

The [Server](https://github.com/seita1996/homelens/tree/main/server) is written in [Go](https://go.dev/).
