#!/usr/bin/env bash
# Keep this clone in step with GitHub, the official version, and make the shared Claude skills point into it.
#   bash scripts/sync.sh            # fetch, fast-forward main if behind, report anything that differs, link the skills
#   bash scripts/sync.sh --check    # report only; change nothing (exit 1 if out of step)
# GitHub main (GovAlta-EMU/AIDE-AGENCY-2026-DESIGN) is authoritative. A local clone is a working copy: pull before you work, and change
# it only by commit and push. Nothing else on the machine is a copy of the repo: the shared skills are symbolic links into it.
set -uo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"; CHECK=0; [ "${1:-}" = "--check" ] && CHECK=1
SKILLS_DIR="${AGENCY_SKILLS_DIR:-/mnt/data/projects/.claude/skills}"; bad=0
cd "$REPO"
git fetch -q origin 2>/dev/null || { echo "could not reach GitHub (run gh-login, then retry)"; exit 1; }
BR=$(git rev-parse --abbrev-ref HEAD); L=$(git rev-parse HEAD); R=$(git rev-parse origin/main)
AHEAD=$(git rev-list --count origin/main..HEAD); BEHIND=$(git rev-list --count HEAD..origin/main); DIRTY=$(git status --porcelain | wc -l)
echo "branch $BR  local ${L:0:7}  github ${R:0:7}  ahead $AHEAD  behind $BEHIND  uncommitted $DIRTY"
[ "$BR" = "main" ] || { echo "  not on main: switch with git switch main"; bad=1; }
if [ "$BEHIND" -gt 0 ]; then
  if [ $CHECK = 0 ] && [ "$AHEAD" = 0 ] && [ "$DIRTY" = 0 ]; then git merge -q --ff-only origin/main && echo "  fast-forwarded to ${R:0:7}"
  else echo "  behind GitHub: pull before working (git pull --ff-only)"; bad=1; fi
fi
[ "$AHEAD" -gt 0 ] && { echo "  local commits not on GitHub: push them (git push)"; bad=1; }
[ "$DIRTY" -gt 0 ] && { echo "  uncommitted changes: commit and push, or discard"; bad=1; }
for s in "$REPO"/.claude/skills/*/; do
  n=$(basename "$s"); dst="$SKILLS_DIR/$n"
  if [ -L "$dst" ] && [ "$(readlink -f "$dst")" = "$(readlink -f "$s")" ]; then echo "  skill $n: linked to the repo"; continue; fi
  if [ $CHECK = 1 ]; then echo "  skill $n: NOT linked to the repo ($dst)"; bad=1; continue; fi
  mkdir -p "$SKILLS_DIR"; [ -e "$dst" ] && [ ! -L "$dst" ] && mv "$dst" "$dst.replaced-$(date +%Y%m%d%H%M%S)"
  ln -sfn "$(readlink -f "$s")" "$dst" && echo "  skill $n: linked $dst -> $s"
done
[ $bad = 0 ] && echo "in step with GitHub" || exit 1
