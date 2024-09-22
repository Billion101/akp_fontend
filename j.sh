version: "3.9"

services:
  db:
    image: mysql:8.0.32
    container_name: akp_backend-db
    restart: always
    command: --default-authentication-plugin=mysql_native_password
    environment:
      MYSQL_ROOT_PASSWORD: 59522214
      MYSQL_DATABASE: akp_system
      MYSQL_USER: billion
      MYSQL_PASSWORD: 59522214
    ports:
      - "3306:3306"
    volumes:
      - /db_data:/var/lib/mysql
      - ./init-db:/docker-entrypoint-initdb.d
    networks:
      - mynetwork
  
app:
    build: .
    container_name: akp_bakend-api
    image: node:20
    environment:
      JWT_SECRET: 707332d93a8fdc2557d3645edde98eed66cf77372a35f63276498df7c9455c1bc4981711a62e5cd2d7afae965e6bca3345ab5ceecf8aa93b740c002e923ae540
      PORT: 3000
      DATABASE_HOST: db
      DATABASE_USER: billion
      DATABASE_PASSWORD: 59522214
      DATABASE_NAME: akp_system
      DATABASE_PORT: 3306
    ports:
      - "3000:3000"
    depends_on:
      - db
    networks:
      - mynetwork

networks:
  mynetwork:
    driver: bridge
