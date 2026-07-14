import pg from "pg";

import {
  buildPreviewConnectionConfig,
  classifyCredentialCheckError,
  isSafeCredentialStatus,
  performReadOnlyCredentialCheck
} from "./lib/preview-credential-readonly-check.mjs";

const { Client } = pg;
const maximumInputLength = 524_288;

async function readStandardInput() {
  process.stdin.setEncoding("utf8");
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > maximumInputLength) throw new Error("input_limit");
  }
  return input;
}

let inputText = "";
let payload;
let connectionConfig;
let status = "other_failure";

try {
  inputText = await readStandardInput();
  payload = JSON.parse(inputText);
  connectionConfig = buildPreviewConnectionConfig(payload);
  status = await performReadOnlyCredentialCheck({
    connectionConfig,
    clientFactory: (config) => new Client(config)
  });
} catch (error) {
  status = classifyCredentialCheckError(error);
} finally {
  inputText = "";
  if (payload && typeof payload === "object") {
    payload.password = "";
    payload.certificateBase64 = "";
  }
  if (connectionConfig) {
    connectionConfig.password = "";
    if (connectionConfig.ssl && typeof connectionConfig.ssl === "object") {
      connectionConfig.ssl.ca = [];
    }
  }
  payload = null;
  connectionConfig = null;
}

process.stdout.write(isSafeCredentialStatus(status) ? status : "other_failure");
