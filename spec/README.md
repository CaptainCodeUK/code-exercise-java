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