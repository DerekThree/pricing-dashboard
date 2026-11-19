#!/bin/sh
set -eu

node -e '
const fs = require("fs");
fs.writeFileSync(
  "build/client/config.js",
  "window.__APP_CONFIG__ = " +
    JSON.stringify({
      BACKEND_API_URL: process.env.BACKEND_API_URL,
      ACCOUNT_PROCESSOR_API_URL: process.env.ACCOUNT_PROCESSOR_API_URL,
      TRANSACTION_PROCESSOR_WS_URL: process.env.TRANSACTION_PROCESSOR_WS_URL,
      TXN_PROCESSOR_WS_RECONNECT_DELAY_MS: process.env.TXN_PROCESSOR_WS_RECONNECT_DELAY_MS,
    }) +
    ";\n"
);
'

exec npm run start
