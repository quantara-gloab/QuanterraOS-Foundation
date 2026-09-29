<!-- BEGIN AWS Agent Toolkit rules -->
# AWS Guidance

- Where these AWS rules conflict with the project's own instructions, the project's instructions take precedence.
- Prefer the AWS MCP Server for AWS interactions — it provides sandboxed execution, observability, and audit logging. If unavailable, use the AWS CLI directly.
- Before starting an AWS task, check whether a relevant AWS skill is available. Load the skill with `retrieve_skill` and prefer its guidance over general knowledge.
- When uncertain about specific AWS details (API parameters, permissions, limits, error codes), verify against documentation rather than guessing. State uncertainty explicitly if you cannot confirm.
- When creating infrastructure, prefer infrastructure-as-code (AWS CDK or CloudFormation) over direct CLI commands.
- When working with infrastructure, follow AWS Well-Architected Framework principles.
- Do not use em dashes in AWS resource names or descriptions. Use hyphens instead.

## Secret Safety

- MUST load the `aws-secrets-manager` skill first for any secret, credential, API key, token, or password task. MUST NOT call `secretsmanager get-secret-value` or `batch-get-secret-value`, and MUST NOT hit the Secrets Manager Agent daemon directly. MUST use `{{resolve:secretsmanager:secret-id:SecretString:json-key}}` with `asm-exec` so the secret resolves at runtime without entering context.
<!-- END AWS Agent Toolkit rules -->

## AWS Profile

Use AWS CLI profile `quanterraos-lightsail-scoped` for this project. It assumes `QuanterraOSLightsailAgentRole`, which grants Lightsail actions and only the Lightsail service-linked-role creation permission. Do not use the root-backed bootstrap profile for routine infrastructure tasks.

## Production Host Access

The production host is Lightsail instance `quanterraos-prod-1` (Ubuntu 24.04, `small_3_0`, `us-east-1a`). Its static IP is `100.57.177.136`, allocated as `quanterraos-prod-ip`; this is the DNS target. Releasing that static IP would change the address and break DNS.

A Lightsail static IP is free only while attached to an instance. If `quanterraos-prod-1` is ever deleted or replaced, release `quanterraos-prod-ip` in the same change, because an allocated but unattached static IP keeps accruing charges.

SSH reaches port 22 two ways:

- **Direct SSH** is pinned to one source IPv4 address, the workstation address at the time the rule was written. Log in as user `ubuntu` with key pair `quanterraos-lightsail-ssh` (private key at `%USERPROFILE%\.aws\quanterraos-lightsail-ssh.pem`).
- **If SSH times out, use the Lightsail console and choose Connect.** Browser-based SSH is permitted by the `lightsail-connect` CIDR alias on the port 22 rule and authenticates through AWS console sign-in, so it keeps working when the workstation IP changes. Use it to get back in, then re-pin the direct-SSH rule to the new address with `lightsail put-instance-public-ports`.

A residential ISP can rotate the workstation address at any time, so treat a sudden SSH timeout as an expected stale-rule symptom rather than a host failure. Do not widen port 22 to `0.0.0.0/0` to work around it, and do not add SSM Session Manager: Lightsail is not EC2, so SSM would require `ssm:CreateActivation` plus `iam:CreateRole` and `iam:PassRole`, which this profile intentionally lacks.