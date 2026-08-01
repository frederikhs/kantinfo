# KantInfo

A backend and frontend application for displaying a canteen menu.
Data provided by kokkeneskoekken.

### How to get started

### Requirements for local development

- Docker
- Docker Compose

Get going by creating your own `.env` file by copying `.env.example` and supplying the `SCHOOL_ID` and `OFFER_ID` environment variables. These are used by the Go backend to fetch the current menu data for your canteen.

Start the project using Docker Compose:

```shell
docker compose up -d --build
```

Now you can visit the frontend React application at http://172.33.0.2 or http://localhost:42069 if you cannot connect directly to the Docker network.

When running `docker-compose-dev.yml` the backend Go application will watch for file changes to *.go files and the frontend React application will be running in Vite development server mode. Your file changes should be reflected in both the frontend and backend.
