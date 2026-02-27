FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV API_INTERNAL_URL=http://api:4000
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["npm", "run", "start"]
