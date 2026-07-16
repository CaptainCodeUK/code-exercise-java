# URL Shortener Coding Exercise

## Task

Build a simple **URL shortener** in **your preferred language** (e.g. Java, C#, Python).

It should:

- Accept a full URL and return a shortened URL.
- A shortened URL should have a randomly generated alias.
- Allow a user to **customise the shortened URL** if they want to (e.g. user provides `my-custom-alias` instead of a random string).
- Persist the shortened URLs across restarts.
- Expose a **decoupled web frontend** built with a modern framework (e.g., React, Next.js, Vue.js, Angular, Flask with templates). This can be lightweight form/output just to demonstrate interaction with the API. Feel free to use UI frameworks like Bootstrap, Material-UI, Tailwind CSS, GOV.UK design system, etc. to speed up development.
- Expose a **RESTful API** to perform create/read/delete operations on URLs.  
  → Refer to the provided [`openapi.yaml`](./openapi.yaml) for API structure and expected behaviour.
- Include the ability to **delete a shortened URL** via the API.
- **Have tests**.
- Be containerised (e.g. Docker).
- Include instructions for running locally.

## Rules

- Fork the repository and work in your fork. Do not push directly to the main repository.
- There is no time limit, we want to see something you are proud of. We would like to understand roughly how long you spent on it though.
- **Commit often with meaningful messages.**
- Write tests.
- The API should validate inputs and handle errors gracefully.
- The Frontend should show errors from the API appropriately.
- Use the provided [`openapi.yaml`](./openapi.yaml) as the API contract.
- Focus on clean, maintainable code.
- AI tools (e.g., GitHub Copilot, ChatGPT) are allowed, but please **do not** copy-paste large chunks of code. Use them as assistants, not as a replacement for your own work. We will be asking.

## Deliverables

- Working software.
- Decoupled web frontend (using a modern framework like React, Next.js, Vue.js, Angular, or Flask with templates).
- RESTful API matching the OpenAPI spec.
- Tests.
- A git commit history that shows your thought process.
- Dockerfile.
- README with:
  - How to build and run locally.
  - Example usage (frontend and API).
  - Any notes or assumptions.

## Solution Layout

- Frontend: [frontend/](frontend)
- API: [backend/Api/](backend/Api)
- Docker Compose: [docker-compose.yml](docker-compose.yml)

## Build and Run Locally

### API

You can start the API from Visual Studio or from the command line.

In Visual Studio, open [backend/Api/Api.csproj](backend/Api/Api.csproj), select the http or https launch profile, and press F5 or Ctrl+F5.

From the command line, run:

```bash
dotnet run --project backend/Api/Api.csproj
```

In development the API listens on:

- http://localhost:5266
- https://localhost:7273

### Frontend

From the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

The frontend talks to the API at https://localhost:7273 by default.

## Docker

### API only

Build the API image:

```bash
docker build -t url-shortener-api ./backend/Api
```

Run the API container:

```bash
docker run --rm -p 8081:8080 -v url-shortener-api-data:/data url-shortener-api
```

Inside the container the API listens on http://+:8080, and on your machine it is exposed on http://localhost:8081.

### Frontend only

The frontend image is a static Nginx build, so the API URL is baked in at image build time.

If you are running the API locally, build the frontend image with:

```bash
docker build \
  --build-arg VITE_URL_SHORTENER_API_BASE_URL=https://localhost:7273 \
  -t url-shortener-frontend ./frontend
```

Then run the container and open http://localhost:8080.

If you are running the API in Docker, build the frontend image with:

```bash
docker build \
  --build-arg VITE_URL_SHORTENER_API_BASE_URL=http://localhost:8081 \
  -t url-shortener-frontend ./frontend
```

### Full stack with Docker Compose

From the repository root:

```bash
docker compose up --build
```

Compose always builds the frontend against the Docker API URL http://localhost:8081.

Port mapping used by Compose:

- API container port: 8080
- API host port: 8081
- Frontend container port: 80
- Frontend host port: 8080
- Frontend build arg: VITE_URL_SHORTENER_API_BASE_URL=http://localhost:8081

Open the frontend at http://localhost:8080.

## Example Usage

### Frontend

1. Start the API locally, or start the full stack with Docker Compose.
2. Start the frontend with npm run dev or by running the frontend container.
3. Enter a full URL such as https://example.com/article.
4. Optionally provide a custom alias such as launch-notes.
5. Submit the form to create a shortened link, then copy or open the returned short URL.

### API

The API exposes these endpoints:

- POST /UrlShortener/shorten
- GET /UrlShortener/urls
- GET /UrlShortener/{alias}
- DELETE /UrlShortener/{alias}

Example request when running locally:

```bash
curl -k https://localhost:7273/UrlShortener/shorten \
  -H "Content-Type: application/json" \
  -d '{"fullUrl":"https://example.com/article","customAlias":"launch-notes"}'
```

Example request when running in Docker:

```bash
curl http://localhost:8081/UrlShortener/shorten \
  -H "Content-Type: application/json" \
  -d '{"fullUrl":"https://example.com/article","customAlias":"launch-notes"}'
```

## Notes and Assumptions

- The API persists links in a SQLite database.
- The API container uses a mounted volume so shortened URLs survive restarts. If you want/need to remove all URL aliases, delete the volume and it will be recreated, along with the database on container start.
- The frontend container serves static files with Nginx and uses the API URL that was baked in at build time.
- When the API runs locally, use https://localhost:7273 for the frontend build arg.
- When the API runs in Docker or through Docker Compose, use http://localhost:8081 for the frontend build arg.
- CORS allows the local Vite frontend on http://localhost:5173 and the containerised frontend on http://localhost:8080.
