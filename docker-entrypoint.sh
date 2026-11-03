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
    }) +
    ";\n"
);
'

exec npm run start
