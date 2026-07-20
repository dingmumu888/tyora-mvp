import { parseSelectedCertificateAuthorities } from "./lib/preview-credential-readonly-check.mjs";

const maximumInputLength = Math.ceil(262_144 / 3) * 4;
let input = "";
let certificateAuthorities;
let status = "certificate_invalid";

try {
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > maximumInputLength) throw new Error("input_limit");
  }
  certificateAuthorities = parseSelectedCertificateAuthorities(input);
  if (certificateAuthorities.length === 0) throw new Error("certificate_invalid");
  status = "certificate_valid";
} catch {
  process.exitCode = 1;
} finally {
  input = "";
  certificateAuthorities = null;
}

process.stdout.write(status);
