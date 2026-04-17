# kiosk-builder

> Rob Clausing | kiosk-builder v1.1  
> Bunting Magnetics Co. | Internal AI Tooling

---

## What This Is

A Claude skill that builds and deploys full-screen operational kiosk displays to the Maggie VPS. Zero framework, zero build pipeline. Pure HTML, CSS, and JavaScript packaged into a Docker container with nginx, reverse-proxied through Caddy with SSL.

Used for shop floor displays, wall-mounted dashboards, and multi-monitor video walls.

---

## What It Produces

- A running kiosk at a target subdomain (e.g., `safety.buntinggpt.com`)
- Docker container on Maggie (`89.116.157.23`) serving the display
- nginx:alpine image, no external dependencies
- Caddy reverse proxy entry with SSL termination
- Optional PIL-generated image assets (charts, floor maps, status panels)

---

## Supported Display Modes

| Mode | Resolution | Use Case |
|------|------------|----------|
| Single monitor | 1920x1080 | One wall-mounted screen |
| 2x2 video wall | 3840x2160 | Four-panel display grid |

---

## Trigger Phrases (for Claude)

Activate this skill when you say things like:

- "Build a shop floor kiosk for..."
- "Create a wall display showing..."
- "Deploy a rotating kiosk to Maggie"
- "I need a monitor display for the production floor"
- "Build a video wall for..."

---

## What Goes In

Claude will prompt for:

1. **Display content** -- what panels to show (safety stats, OTD, schedules, job status, etc.)
2. **Rotation interval** -- how long each panel displays before cycling
3. **Target subdomain** -- where to deploy (e.g., `floor1.buntinggpt.com`)
4. **Monitor mode** -- single or 2x2 video wall
5. **Any Epicor or Supabase data to pull** -- read-only, via existing BAQ integrations

---

## What Goes Out

```
/opt/<kiosk-name>/
  index.html          # Full-screen display entry point
  assets/             # PIL-generated images, if any
  docker-compose.yml  # Container definition
  nginx.conf          # nginx config
```

Caddy picks up the new reverse proxy entry automatically on reload. SSL is handled by Caddy's existing Let's Encrypt integration.

---

## Architecture Notes

- **No backend.** Data is either baked into the HTML at build time or fetched client-side from Supabase REST. No FastAPI, no WebSocket, no Node process.
- **No framework.** Vanilla JS only. This keeps containers small and eliminates dependency drift.
- **Rotation logic** is handled by a simple JS interval. No state management.
- **PIL assets** are generated once at build time by a Python script and committed as static files. They do not regenerate at runtime.
- **All containers bind to `127.0.0.1`**, not `0.0.0.0`. Caddy handles external ingress. Do not change this.

---

## Deployment Flow

1. Claude generates the HTML, CSS, JS, nginx config, and docker-compose file
2. Files are placed in `/opt/<kiosk-name>/` on Maggie
3. `docker compose up -d` starts the container
4. Caddy entry is added and reloaded (`caddy reload`)
5. SSL certificate is issued automatically
6. Smoke test: `curl -I https://<subdomain>` should return `200`

---

## Constraints

- Kiosk displays are **read-only**. No forms, no user input, no authentication.
- Data shown is **non-sensitive** by design. These screens are visible on the shop floor.
- Do not use this for anything requiring login or role-based access.
- Do not bind containers to `0.0.0.0`. Always use `127.0.0.1`.
- Do not install Node, React, or any build toolchain inside the container.

---

## Existing Kiosk Containers on Maggie

Several `kiosk-*` containers exist from prior builds and may be stale. Before deploying a new kiosk to an existing subdomain, verify the container state:

```bash
docker ps -a | grep kiosk
```

Stale containers are candidates for the kill protocol. Check Caddy for orphaned domain entries.

---

## Skill Location

```
/mnt/skills/user/kiosk-builder/SKILL.md
```

This skill is part of the BuntingGPT internal Claude tooling stack. It is not a public-facing product. Operational logic is encoded in the companion GP3 payload.

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| `stacked-monitor` | Calculate multi-monitor region maps and xrandr config for irregular grids |
| `static-site-deployer` | Deploy static sites that require no kiosk-specific constraints |
| `canvas-design` | Generate poster-style PNG assets for use inside kiosk panels |

---

*n0v8v LLC | GP3 v1.0 | Bunting Magnetics Co. internal use*
