version: '3.8'

services:
  frontend:
    build:
      context: ./akp_fontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://103.240.242.36:3000
    networks:
      - app-network

  # MySQL Database
  mysqldb:
    image: mysql:8.0
    restart: always
    command:
      - --default-authentication-plugin=mysql_native_password
      - --bind-address=0.0.0.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    environment:
      MYSQL_DATABASE: akp_system
      MYSQL_USER: billion
      MYSQL_PASSWORD: 59522214
      MYSQL_ROOT_PASSWORD: 59522214
    ports:
      - "3306:3306"
    volumes:
      - ./db_data:/var/lib/mysql
      - ./init-db:/docker-entrypoint-initdb.d
    networks:
      - app-network    

  # Backend (Node.js)
  backend:
    build:
      context: ./akp_backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DATABASE=akp_system
      - DATABASE_HOST=mysqldb
      - DATABASE_USER=billion
      - DATABASE_PASSWORD=59522214
      - DATABASE_PORT=3306
      - JWT_SECRET=707329d93a8fdc2557d3645edde98eed66cf77372a35f63276498df7c9455c1bc4981711a62e5cd2d7afae965e6bca3345ab5ceecf8aa93b740c002e923ae540
    depends_on:
      mysqldb:
        condition: service_healthy
    networks:
      - app-network

# Shared network for services
networks:
  app-network:
    driver: bridge
