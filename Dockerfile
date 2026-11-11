# Agency Studio (app/server.mjs): the template form app, with Chromium for rendering and python-pptx for PowerPoint.
# Playwright needs glibc, so this uses Debian slim rather than node:22-alpine.
#   docker build -t agency-studio . && docker run --rm -p 8080:8080 agency-studio
FROM node:22-bookworm-slim
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright NODE_ENV=production PORT=8080
WORKDIR /repo
# apt prefers IPv6, which the SHELL VM's Docker bridge does not route; force IPv4 so builds do not hang
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4 \
 && apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip python3-lxml python3-pil fonts-liberation \
 && pip3 install --no-cache-dir --break-system-packages python-pptx==1.0.2 \
 && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
 && npx playwright install --with-deps --only-shell chromium \
 && rm -rf /var/lib/apt/lists/* /root/.npm /tmp/*
COPY . .
# tokens, vectors and gallery thumbnails are built into the image (about a minute)
RUN node scripts/build-tokens.mjs && node app/build-thumbs.mjs \
 && useradd -m studio && chown -R studio /repo
USER studio
EXPOSE 8080
CMD ["node", "app/server.mjs"]
