#!/bin/sh
set -eu

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
