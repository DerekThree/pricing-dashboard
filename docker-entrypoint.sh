#!/bin/sh
set -eu

: "${API_URL:?API_URL must be set}"

node -e '
const fs = require("fs");
fs.writeFileSync(
  "build/client/config.js",
  "window.__APP_CONFIG__ = " +
    JSON.stringify({ API_URL: process.env.API_URL }) +
    ";\n"
);
'

exec npm run start
