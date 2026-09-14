FROM postgres:16-alpine

COPY backend/src/models/schema.sql /docker-entrypoint-initdb.d/001-schema.sql
