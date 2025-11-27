# Stage 1: Build the React application
FROM node:20 AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build # Assuming this outputs to a /app/build directory

# Stage 2: Serve the static files with Nginx (very lightweight image)
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html # Copy static assets
# Copy custom Nginx config if needed, otherwise default port 80 is used
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
