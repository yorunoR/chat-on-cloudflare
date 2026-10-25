FROM node:24.21-bookworm

ENV LANG=C.UTF-8 TZ=Asia/Tokyo

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
    build-essential \
    vim \
    && npm install -g pnpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ARG CLAUDE_CODE_VERSION=latest

RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}"
