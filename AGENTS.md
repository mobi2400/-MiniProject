# MiniProject instructions

Follow these instructions in every implementation session for this project.

## Before implementing

1. Confirm the current working directory.
2. Read the project instructions, `progress.txt`, and `features.json`.
3. Review recent Git commits and inspect the working tree.
4. Start the application using the documented initialization script.
5. Verify basic existing functionality. If the initialization script or runnable baseline is missing, record that limitation.

Select one high-priority unfinished feature whose dependencies are ready. Review every acceptance criterion and the expected user behavior. Implement that feature within its agreed scope and follow the existing architecture and conventions.

## Coding and production readiness

- Make the smallest complete change that satisfies the feature. Reuse existing components and utilities. Leave unrelated refactors and new dependencies out of scope unless the feature requires them.
- Follow the project's naming, typing, formatting, and linting conventions. Keep code readable and preserve behavior that existing callers rely on.
- Validate inputs on the server and enforce authorization before accessing user data. Keep secrets server-side and exclude CV contents and credentials from logs.
- Handle loading, empty results, invalid input, and relevant service failures. Keep saved state consistent if a request fails, is retried, or is submitted twice.
- Run the applicable lint, type, and production build checks. Exercise relevant failure paths and regressions before calling the change production-ready.

## Verify the feature

1. Review its acceptance criteria and expected user behavior.
2. Run the relevant unit tests.
3. Run integration tests for connected components.
4. Start the application and use browser automation to complete the user journey where applicable.
5. Check visible results, loading behavior, errors, and relevant state changes.
6. Compare observed behavior against every acceptance criterion.
7. Fix failures and repeat the necessary tests.
8. Set `passes` to `true` in `features.json` only after all required checks succeed.

Implementation and passing unit tests alone are insufficient. Preserve the acceptance criteria and report any unverified behavior or testing limitations. Leave the feature unfinished if a required check remains unverified.

## End the session

- Keep `features.json` current as requirements are agreed and features are verified. Use stable IDs and concrete acceptance steps that specify the starting state, user action, and observable result.
- Update `progress.txt` with completed work, files changed, test results, known issues, and the next recommended task.
- Clearly identify unfinished work. Claim completion only when supported by verification.
- Create a descriptive Git commit where appropriate and leave the working tree in a clean, recoverable state. Preserve existing user changes.

<!-- codebase-memory-mcp:start -->
## Codebase Knowledge Graph

Always prefer MCP graph tools over grep, glob, or file search for code discovery. If the repository is not indexed, run `index_repository` first.

1. `search_graph` finds functions, classes, routes, and variables by pattern.
2. `trace_path` follows callers and callees.
3. `get_code_snippet` reads a specific function or class.
4. `query_graph` runs Cypher queries for complex patterns.
5. `get_architecture` gives a high-level project summary.

Fall back to text or file search for string literals, error messages, configuration values, non-code files, or when the graph results are insufficient.
<!-- codebase-memory-mcp:end -->
