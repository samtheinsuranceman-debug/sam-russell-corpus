# syntax=docker/dockerfile:1
#
# Two stages: build the browser bundle and the server bundle, then ship only
# what runs. The browser bundle bakes every VITE_* value at build time, so the
# edition and the public disclosures MUST be passed as build arguments (Railway:
# service variables are exposed to Docker builds as build args when declared
# here). A runtime-only value cannot change what the browser was built to say;
# the server refuses to start in production when the two disagree.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY . .

# Edition and public disclosures, baked into the browser bundle.
ARG VITE_PUBLIC_WELLNESS_MODE=true
ARG VITE_ENABLE_CLINICAL_TOOLS=false
ARG VITE_ENABLE_PAID_SUBSCRIPTIONS=false
ARG VITE_RELEASE_POSTURE=production
ARG VITE_PRIVACY_CONTACT_EMAIL
ARG VITE_LEGAL_BUSINESS_NAME
ARG VITE_LEGAL_BUSINESS_ADDRESS
ARG VITE_HEALTH_DATA_PROCESSORS
ARG VITE_MEMBERSHIP_PRICE_CENTS
ARG VITE_ENABLE_MARKETING_ANALYTICS=false
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID
ARG VITE_CLINICAL_COVERED_ENTITY_NAME
ARG VITE_CLINICAL_NPP_URL
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_EMAIL_AUTH=false
ARG VITE_APP_ID
ENV VITE_PUBLIC_WELLNESS_MODE=$VITE_PUBLIC_WELLNESS_MODE \
    VITE_ENABLE_CLINICAL_TOOLS=$VITE_ENABLE_CLINICAL_TOOLS \
    VITE_ENABLE_PAID_SUBSCRIPTIONS=$VITE_ENABLE_PAID_SUBSCRIPTIONS \
    VITE_RELEASE_POSTURE=$VITE_RELEASE_POSTURE \
    VITE_PRIVACY_CONTACT_EMAIL=$VITE_PRIVACY_CONTACT_EMAIL \
    VITE_LEGAL_BUSINESS_NAME=$VITE_LEGAL_BUSINESS_NAME \
    VITE_LEGAL_BUSINESS_ADDRESS=$VITE_LEGAL_BUSINESS_ADDRESS \
    VITE_HEALTH_DATA_PROCESSORS=$VITE_HEALTH_DATA_PROCESSORS \
    VITE_MEMBERSHIP_PRICE_CENTS=$VITE_MEMBERSHIP_PRICE_CENTS \
    VITE_ENABLE_MARKETING_ANALYTICS=$VITE_ENABLE_MARKETING_ANALYTICS \
    VITE_ANALYTICS_ENDPOINT=$VITE_ANALYTICS_ENDPOINT \
    VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID \
    VITE_CLINICAL_COVERED_ENTITY_NAME=$VITE_CLINICAL_COVERED_ENTITY_NAME \
    VITE_CLINICAL_NPP_URL=$VITE_CLINICAL_NPP_URL \
    VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL \
    VITE_EMAIL_AUTH=$VITE_EMAIL_AUTH \
    VITE_APP_ID=$VITE_APP_ID
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
# Migrations ship with the image so an operator can apply them from a shell
# on the same revision that will run against them.
COPY --from=build /app/drizzle ./drizzle
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
