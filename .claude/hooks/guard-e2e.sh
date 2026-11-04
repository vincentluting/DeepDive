#!/bin/bash
# Guard E2E execution — defense-in-depth against accidental Claude misuse
# Exit code 2 = block with reason, 0 = allow
#
# ── Threat model ──
# Catches accidental Claude misuse:
#   - "I'll just `npm run test:e2e:full | tee /tmp/log` to capture output"
#     → silently false-positive PASS (2026-05-03 incident)
#   - "I'll re-run with --update-snapshots to fix that visual diff"
#     → silently overwrites a real UI regression's baseline
#   - "I'll background the wrapper so the next command runs sooner"
#     → wrapper exit code lost (round 8 finding)
# NOT a security boundary against adversarial input.
#
# ── Known limitations (acknowledged after 10 rounds of cross-review) ──
# Hook is string-level pattern matching, not a shell parser. The
# following bypass classes are accepted as out-of-scope (would require a
# real shell parser or syscall-level enforcement to fix):
#
#   1. Variable expansion / eval — `a=test; b=:e2e:full; npm run "${a}${b}"`
#      constructs danger tokens at runtime. Hook sees pre-expansion source.
#   2. Sub-process — `bash /tmp/evil.sh` runs arbitrary code in a child;
#      hook only sees the launcher, not the child's actions.
#   3. Shell containers — wrapper invocations hidden inside `bash -c '…'`,
#      `(…)`, `$(…)`, `<(…)`, `{ …; }` are not detected. Hook does not
#      parse quoted strings or sub-shell groupings.
#   4. heredoc content — `cat <<EOF` followed by wrapper-like text would
#      treat heredoc lines as separate command segments. False-positive
#      block possible; accept rather than parse heredoc syntax.
#   5. Quoted danger flags in text — `echo "--update-snapshots"`,
#      `rg "--update-snapshots" docs/` will match the danger flag because
#      hook can't tell quoted string from real flag. False-positive
#      block; user can override via `Bash` permission whitelist if needed.
#
# Defense-in-depth against accidental Claude misuse, not adversarial sandbox
# escape. For a fully sealed system, replace this hook with a wrapper-only
# enforcement model (delete `npm run test:e2e:*` aliases, force all E2E
# through controlled scripts).
#
# ── Design (round 8 redesign per cross-review feedback) ──
# 1. Danger tokens include BOTH the dangerous flag/pattern AND the wrapper
#    name itself. Wrapper invocations must be standalone (no `;` `&&` `||`
#    `&` `|` newline) so wrapper exit code is preserved.
# 2. Wrapper invocation may be prefixed by inline env var assignments
#    (e.g. `ALLOW_SNAPSHOT_UPDATE=1 bash scripts/snapshot-update.sh ...`)
#    — those are stripped before the leading-token literal match.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

[ -z "$COMMAND" ] && exit 0

# Collapse shell line continuations (`\<newline>`) into a single space.
# These are syntactic continuation, not command separators; without this,
# multi-line commands like `git add foo \<NL>  scripts/snapshot-update.sh`
# would split the wrapper path onto its own segment and trigger the
# wrapper-call detector. Bash parameter expansion: `\\` matches one `\`,
# `$'\n'` matches a real newline.
COMMAND="${COMMAND//\\$'\n'/ }"

# ── Danger token detectors ──
# Trigger on: dangerous flag/pattern OR command-leading WRAPPER INVOCATION.
# We use leading-token detection (not raw substring) so that benign commands
# that just *mention* the wrapper filename — `sed scripts/x.sh`, `git diff
# scripts/x.sh`, `cp scripts/x.sh /tmp/y`, `echo x.sh` — are not blocked.
# The detector returns YES when:
#   • Leading token is a path ending in /<wrapper>  (e.g. scripts/x.sh, ./scripts/x.sh, /abs/x.sh)
#   • Or leading token is bash|sh|/bin/bash|/bin/sh|/usr/bin/env, and the
#     SECOND token is a path ending in /<wrapper>
# After that YES, is_solely_wrapper_invocation enforces strict standalone form.

# Helper: does ANY segment of the command (split by `;`/`&&`/`||`/`&`/`\n`)
# look like a call to the named wrapper? We split first so that wrapper in
# segment 2+ (e.g. `echo done; bash scripts/x.sh`) is still detected.
# Then is_solely_wrapper_invocation enforces the strict standalone form.
looks_like_wrapper_call() {
  local cmd="$1"
  local w="$2"
  # Replace && || with ; then split on ; & or newline
  local segments
  segments=$(printf '%s' "$cmd" | sed -E 's/(&&|\|\|)/;/g' | tr ';&\n' '\n\n\n')
  while IFS= read -r seg; do
    [ -z "$seg" ] && continue
    # Strip leading whitespace
    seg="${seg#"${seg%%[![:space:]]*}"}"
    # Strip leading inline env-var assignments
    seg=$(printf '%s' "$seg" | sed -E 's/^([A-Z_][A-Z0-9_]*=[^[:space:]]+[[:space:]]+)+//')
    local ft st
    ft=$(printf '%s' "$seg" | awk '{print $1}')
    st=$(printf '%s' "$seg" | awk '{print $2}')
    # Direct invocation: path ending in /<wrapper>, or bare basename
    case "$ft" in
      *"/$w"|"$w") return 0 ;;
    esac
    # Indirect invocation through known launchers (bash, sh)
    case "$ft" in
      bash|sh|/bin/bash|/bin/sh)
        case "$st" in
          *"/$w"|"$w") return 0 ;;
        esac
        ;;
      /usr/bin/env|env)
        # `env [LAUNCHER] WRAPPER` or `env WRAPPER` (no env-var assignments
        # supported — see known limitation #5 in the header).
        case "$st" in
          bash|sh|/bin/bash|/bin/sh)
            local tt
            tt=$(printf '%s' "$seg" | awk '{print $3}')
            case "$tt" in
              *"/$w"|"$w") return 0 ;;
            esac
            ;;
          *"/$w"|"$w") return 0 ;;
        esac
        ;;
    esac
  done <<EOF
$segments
EOF
  return 1
}

has_snapshot_token() {
  local oneline
  oneline=$(printf '%s' "$1" | tr '\n\r' '  ')
  printf '%s' "$oneline" | grep -qE '(^|[^A-Za-z0-9_-])--update-snapshots($|[^A-Za-z0-9_-])' && return 0
  looks_like_wrapper_call "$1" "snapshot-update.sh" && return 0
  return 1
}

has_e2e_pipe_token() {
  local oneline
  oneline=$(printf '%s' "$1" | tr '\n\r' '  ')
  printf '%s' "$oneline" | grep -qE 'test:e2e[a-z:]*[^|]*\|' && return 0
  looks_like_wrapper_call "$1" "e2e-tee.sh" && return 0
  return 1
}

# ── Strict whitelist: command is solely a wrapper invocation ──
# Returns 0 only when:
#   • Contains NO control flow operators: \n \r ; && || | (pipe) &
#     (`&` detection masks redirect forms `&>` `>&` `<&` `>&-` etc first)
#   • After stripping leading env-var assignments, the leading token
#     matches one of 4 literal forms exactly.
is_solely_wrapper_invocation() {
  local cmd="$1"
  local w="$2"

  # Reject control flow operators
  case "$cmd" in
    *$'\n'*) return 1 ;;
    *$'\r'*) return 1 ;;
    *';'*)   return 1 ;;
    *'&&'*)  return 1 ;;
    *'||'*)  return 1 ;;
    *'|'*)   return 1 ;;
  esac

  # `&` (background) — mask known redirect forms first; any remaining `&`
  # is background separator. Mask: `&>` `&>>` `[N]>&[N-]` `[N]<&[N-]`.
  local masked
  masked=$(printf '%s' "$cmd" | sed -E '
    s/&>>?//g
    s/[0-9]*>&[0-9-]*//g
    s/[0-9]*<&[0-9-]*//g
  ')
  if printf '%s' "$masked" | grep -q '&'; then
    return 1
  fi

  # Strip leading whitespace
  cmd="${cmd#"${cmd%%[![:space:]]*}"}"

  # Strip leading inline env var assignments (e.g. `ALLOW_SNAPSHOT_UPDATE=1 `)
  # so `ALLOW_SNAPSHOT_UPDATE=1 bash scripts/x.sh` matches the wrapper case.
  cmd=$(printf '%s' "$cmd" | sed -E 's/^([A-Z_][A-Z0-9_]*=[^[:space:]]+[[:space:]]+)+//')

  case "$cmd" in
    "scripts/$w"|"scripts/$w "*) return 0 ;;
    "./scripts/$w"|"./scripts/$w "*) return 0 ;;
    "bash scripts/$w"|"bash scripts/$w "*) return 0 ;;
    "bash ./scripts/$w"|"bash ./scripts/$w "*) return 0 ;;
    "/usr/bin/env scripts/$w"|"/usr/bin/env scripts/$w "*) return 0 ;;
    "/usr/bin/env ./scripts/$w"|"/usr/bin/env ./scripts/$w "*) return 0 ;;
    "/usr/bin/env bash scripts/$w"|"/usr/bin/env bash scripts/$w "*) return 0 ;;
    "/usr/bin/env bash ./scripts/$w"|"/usr/bin/env bash ./scripts/$w "*) return 0 ;;
    "env scripts/$w"|"env scripts/$w "*) return 0 ;;
    "env ./scripts/$w"|"env ./scripts/$w "*) return 0 ;;
    "env bash scripts/$w"|"env bash scripts/$w "*) return 0 ;;
    "env bash ./scripts/$w"|"env bash ./scripts/$w "*) return 0 ;;
  esac
  return 1
}

# ── Rule 1: --update-snapshots flag OR snapshot-update.sh wrapper ──
if has_snapshot_token "$COMMAND"; then
  if ! is_solely_wrapper_invocation "$COMMAND" "snapshot-update.sh"; then
    cat >&2 <<'EOF'
BLOCKED: snapshot wrapper / `--update-snapshots` flag must be invoked as a
single, standalone command. No control flow operators (`;` `&&` `||` `&`
`|` newline) — those would lose the wrapper's real exit code.

Use exactly one of:
  ALLOW_SNAPSHOT_UPDATE=1 bash scripts/snapshot-update.sh [project]
  ALLOW_SNAPSHOT_UPDATE=1 scripts/snapshot-update.sh [project]
  ALLOW_SNAPSHOT_UPDATE=1 ./scripts/snapshot-update.sh [project]

Run other commands in a separate Bash invocation. The wrapper verifies
ALLOW_SNAPSHOT_UPDATE=1 inside its own scope (cannot be spoofed by
echo/quoting/sub-shells). Visual regression baselines encode design
intent — do not auto-update silently.

Before running:
  1. Look at test-results/*/*-diff.png
  2. Confirm each change is intentional (not a render bug)
EOF
    exit 2
  fi
fi

# ── Rule 2: test:e2e + pipe OR e2e-tee.sh wrapper ──
if has_e2e_pipe_token "$COMMAND"; then
  if ! is_solely_wrapper_invocation "$COMMAND" "e2e-tee.sh"; then
    cat >&2 <<'EOF'
BLOCKED: e2e-tee.sh wrapper / `test:e2e + pipe` must be invoked as a
single, standalone command. No control flow operators (`;` `&&` `||` `&`
`|` newline) — those would lose the wrapper's real exit code or re-introduce
the exit-code-masking bug the wrapper is designed to prevent.

Use exactly one of:
  bash scripts/e2e-tee.sh full              # default log path
  bash scripts/e2e-tee.sh full /tmp/x.log   # custom log path
  bash scripts/e2e-tee.sh core
  bash scripts/e2e-tee.sh llm:prod

Or skip the pipe entirely:
  - Bash tool's `run_in_background: true` (auto-captures stdout to file)
  - npm run test:e2e:full > /tmp/log 2>&1   # plain redirect, no pipe

Run other commands in a separate Bash invocation.
EOF
    exit 2
  fi
fi

exit 0
