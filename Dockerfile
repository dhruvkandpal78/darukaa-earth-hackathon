# Compile React separately so the runtime only contains Python and static website assets.
FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

# One service serves both the browser build and the API, avoiding cross-origin login complexity.
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend ./backend
COPY --from=frontend /app/dist ./dist
RUN useradd --create-home --uid 10001 appuser
USER appuser
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "python -m backend.migrate && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
