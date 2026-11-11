# Agency 2026 show app (run of show with event codes). Build context is show/ (publish-app runs `docker build .` here).
# Run `node show/pack.mjs` first: it copies the tokens, fonts, logos, sound cues and motion videos the show uses into show/.bundle/.
#   cd show && publish-app agency-show --database --min-instances 1 --memory 1Gi
FROM node:22-alpine
WORKDIR /app/show
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
# repo media gathered by pack.mjs, laid out as in the repo (/app/brand, /app/styles, /app/examples ...)
COPY .bundle/ /app/
RUN test -f /app/styles/tokens.css || (echo "show/.bundle is missing: run node show/pack.mjs before building" && exit 1)
COPY server.mjs index.html stage.html stage.css stage.js control.html control.css control.js agenda.schema.json ./
COPY lib ./lib
COPY server ./server
COPY samples ./samples
ENV NODE_ENV=production PORT=8080 SHOW_ASSETS_DIR=/tmp/agency-show-assets
EXPOSE 8080
USER node
CMD ["node", "server.mjs"]
