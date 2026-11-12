#!/usr/bin/env bash
# Cloud render farm for one film: a temporary Cloud Run JOB (not a service: services were capped at about 12 instances,
# jobs ran 100 tasks at once). Each task renders a contiguous share of the frames and PUTs JPEGs to a receiver on this VM.
# The VM only receives files; never render a full film on the shared VM.
#
#   cloud/farm.sh deploy  <film dir>                     build + push the image, create or update the job
#   cloud/farm.sh render  <film dir> [ranges|missing|all] [--tasks N]   start the receiver and one execution (default: missing)
#   cloud/farm.sh status  <film dir>                     execution counts, frames on disk
#   cloud/farm.sh wait    <film dir>                     block until the execution finishes, then report missing frames
#   cloud/farm.sh missing <film dir>                     print missing frame ranges
#   cloud/farm.sh cleanup <film dir>                     delete the job, stop this film's receiver
#
# ranges: "0-599,2364-2466". Re-render only what changed: frames are pure functions of their number, so any range is safe.
set -euo pipefail
CMD="${1:?command}"; P="$(cd "${2:?film dir}" && pwd)"; shift 2 || true
KIT="$(cd "$(dirname "$0")/.." && pwd)"
[ -f ~/.sandbox-env ] && source ~/.sandbox-env
DEV="${DEV_NAME:?DEV_NAME not set in ~/.sandbox-env}"
PROJECT_ID="${FARM_PROJECT:-abde-goa-aimgemgcp-dev}"; REGION="${FARM_REGION:-northamerica-northeast1}"   # org policy allows this region only
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/sandbox-apps"
# per-film names and ports come from film.config.json (tools/new-film.mjs namespaces them by slot), so films never collide
cfg() { node -e "const c=require('$P/film.config.json');const v=($1);console.log(v===undefined||v===null?'':v)"; }
SLUG=$(cfg "(c.slot?'':'')+(c.slug||'film').toLowerCase().replace(/[^a-z0-9-]+/g,'-').slice(0,30)")
JOB=$(cfg "c.cloud&&c.cloud.job"); [ -n "$JOB" ] || JOB="shell-${DEV}-film-${SLUG}"
IMGN=$(cfg "c.cloud&&c.cloud.image"); [ -n "$IMGN" ] || IMGN="shell-app-${DEV}-film-${SLUG}:job"; IMG="${REGISTRY}/${IMGN}"
# the user's gcloud login goes stale and cannot re-prompt here; the sandbox service account keeps working
if ! gcloud auth print-access-token >/dev/null 2>&1; then export CLOUDSDK_CORE_ACCOUNT="shell-${DEV}@${PROJECT_ID}.iam.gserviceaccount.com"; fi
G=(--region "$REGION" --project "$PROJECT_ID" --quiet)
VMIP=$(hostname -I | tr ' ' '\n' | grep -E '^10\.' | head -1); PORT="${FARM_PORT:-$(cfg "c.ports&&c.ports.receiver")}"; PORT="${PORT:-3999}"
mkdir -p "$P/out/frames"; TOKF="$P/out/.farm-token"; [ -f "$TOKF" ] || { head -c 18 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' > "$TOKF"; chmod 600 "$TOKF"; }
N=$(node -e "const c=require('$P/film.config.json');console.log(Math.round(c.dur*(c.fps||60)))")

missing_ranges() { python3 - "$P/out/frames" "$N" <<'E'
import os, sys
d, n = sys.argv[1], int(sys.argv[2]); have = {int(f[1:7]) for f in os.listdir(d) if f.startswith('f') and f.endswith('.jpg')}
miss = [f for f in range(n) if f not in have]; out = []; s = p = None
for f in miss:
    if s is None: s = p = f
    elif f == p + 1: p = f
    else: out.append((s, p)); s = p = f
if s is not None: out.append((s, p))
print(','.join(f'{a}-{b}' for a, b in out))
E
}
count_frames() { node -e "let n=0;for(const p of process.argv[1].split(',').filter(Boolean)){const[a,b]=p.split('-').map(Number);n+=(b??a)-a+1}console.log(n)" "$1"; }
receiver_up() { curl -s -m 3 "http://${VMIP}:${PORT}/ping" 2>/dev/null | grep -q pong; }

case "$CMD" in
  deploy)
    "$KIT/cloud/build-context.sh" "$P" >/dev/null
    # --network host: on SHELL VMs the Docker bridge MTU (1500) is above the NIC MTU (1460), so downloads inside a bridged build stall
    nice docker build --network host -q -t "$IMG" "$P/out/cloud-ctx" | tail -1
    docker push -q "$IMG" | tail -1
    if gcloud run jobs describe "$JOB" "${G[@]}" >/dev/null 2>&1; then gcloud run jobs update "$JOB" --image "$IMG" "${G[@]}" | tail -1
    else gcloud run jobs create "$JOB" --image "$IMG" "${G[@]}" --vpc-connector sandbox-vpc-connector --vpc-egress private-ranges-only \
      --cpu 4 --memory 8Gi --max-retries 2 --task-timeout 3600 --tasks 1 --command node --args /app/kit/cloud/job.mjs | tail -1; fi
    echo "job $JOB ready ($IMG)";;
  render)
    WHAT="${1:-missing}"; TASKS=""; [ "${2:-}" = "--tasks" ] && TASKS="$3"
    case "$WHAT" in missing) R=$(missing_ranges);; all) R="0-$((N-1))";; *) R="$WHAT";; esac
    [ -n "$R" ] || { echo "nothing to render: all $N frames are on disk"; exit 0; }
    F=$(count_frames "$R"); [ -n "$TASKS" ] || TASKS=$(( (F + 7) / 8 ))
    # share the regional Cloud Run capacity with other films rendering now: about 100 tasks x 4 vCPU in all (FARM_TOTAL_TASKS)
    OTHERS=$(gcloud run jobs executions list "${G[@]}" --format="csv[no-heading](metadata.name,status.runningCount)" --limit 200 2>/dev/null | awk -F, -v me="$JOB" '$1 ~ /-film-/ && index($1, me"-") != 1 && $2 > 0' | wc -l)
    CAP=$(( ${FARM_TOTAL_TASKS:-100} / (OTHERS + 1) )); [ "$CAP" -lt 8 ] && CAP=8; [ "$TASKS" -gt "$CAP" ] && TASKS=$CAP; [ "$TASKS" -lt 1 ] && TASKS=1
    [ "$OTHERS" -gt 0 ] && echo "$OTHERS other film render(s) running: capped at $CAP tasks"
    if ! receiver_up; then
      FARM_TOKEN=$(cat "$TOKF") nohup nice node "$KIT/cloud/receiver.mjs" --out "$P/out/frames" --port "$PORT" > "$P/out/receiver.log" 2>&1 &
      echo $! > "$P/out/.receiver.pid"; for i in $(seq 1 20); do receiver_up && break; sleep 0.5; done; receiver_up || { echo "receiver did not start (see out/receiver.log)"; exit 1; }; fi
    gcloud run jobs update "$JOB" "${G[@]}" --tasks "$TASKS" --parallelism "$TASKS" --update-env-vars "^@^FRAMES=${R}@SINK=http://${VMIP}:${PORT}@FARM_TOKEN=$(cat "$TOKF")" | tail -1
    EX=$(gcloud run jobs execute "$JOB" "${G[@]}" --async 2>&1 | grep -o "${JOB}-[a-z0-9]*" | head -1); echo "$EX" > "$P/out/.farm-exec"
    echo "execution $EX: $F frames on $TASKS tasks";;
  status)
    EX=$(cat "$P/out/.farm-exec" 2>/dev/null || true)
    [ -n "$EX" ] && gcloud run jobs executions describe "$EX" "${G[@]}" --format="csv[no-heading](metadata.name,status.runningCount,status.succeededCount,status.failedCount,status.completionTime)" | awk -F, '{print "execution "$1": running "($2==""?0:$2)", succeeded "($3==""?0:$3)", failed "($4==""?0:$4)", completed "($5==""?"no":$5)}'
    echo "frames on disk: $(find "$P/out/frames" -name 'f*.jpg' | wc -l) of $N"; tail -1 "$P/out/receiver.log" 2>/dev/null || true;;
  wait)
    EX=$(cat "$P/out/.farm-exec"); until [ -n "$(gcloud run jobs executions describe "$EX" "${G[@]}" --format='value(status.completionTime)' 2>/dev/null)" ]; do sleep 20; done
    "$0" status "$P"; R=$(missing_ranges); [ -z "$R" ] && echo "all frames present" || echo "missing: $R  (run: farm.sh render $P missing)";;
  missing) missing_ranges;;
  cleanup)
    gcloud run jobs delete "$JOB" "${G[@]}" 2>&1 | tail -1 || true
    PIDF="$P/out/.receiver.pid"
    if [ -f "$PIDF" ]; then PID=$(cat "$PIDF"); if ps -o args= -p "$PID" 2>/dev/null | grep -q "receiver.mjs --out $P/out/frames"; then kill -TERM "$PID" && echo "stopped this film's receiver ($PID)"; fi; rm -f "$PIDF"; fi;;
  *) echo "unknown command $CMD"; exit 1;;
esac
