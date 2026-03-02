# BlogVault — Blog Platform API

A production-ready RESTful API for a blog platform built with **Node.js, Express, MongoDB, and AWS S3**. Features a premium dark-mode UI client served directly from the API server.

---

## ✨ Features

| Category | Details |
|---|---|
| **Posts** | CRUD · Pagination · Sorting · Filter by tags/status/author · Full-text search |
| **Tags** | Create · List · Delete · Color-coded |
| **Images** | Upload to AWS S3 · Pre-signed URL access · Auto-delete on post removal |
| **Client UI** | Dark glassmorphism UI · Live search · Drag-drop upload · Tag filter · Modals |
| **Code Quality** | JSDoc on every endpoint · Consistent JSON responses · Global error handler |

---

## Project Structure

```
blog-platform-api/
├── client/
│   ├── index.html          ← Premium dark-mode UI
│   ├── style.css           ← Glassmorphism CSS design system
│   └── script.js           ← Fully featured client JS
│
├── src/
│   ├── config/
│   │   ├── db.js           ← MongoDB connection
│   │   └── s3.js           ← AWS S3 client
│   │
│   ├── controllers/
│   │   ├── post.controller.js   ← All post logic with JSDoc
│   │   └── tag.controller.js    ← Tag CRUD with JSDoc
│   │
│   ├── middleware/
│   │   ├── upload.middleware.js ← Multer · file-type & size validation
│   │   └── error.middleware.js  ← Global error handler
│   │
│   ├── models/
│   │   ├── post.model.js   ← Post schema (title, desc, image, tags, author, status)
│   │   └── tag.model.js    ← Tag schema (name, color)
│   │
│   ├── routes/
│   │   ├── post.routes.js  ← All post routes
│   │   └── tag.routes.js   ← All tag routes
│   │
│   └── app.js              ← Express app setup
│
├── server.js               ← Entry point
├── .env                    ← Environment variables
└── package.json
```

---

## Tech Stack

- **Runtime**: Node.js + Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cloud Storage**: AWS S3 (SDK v3) — image upload + pre-signed URLs
- **File Handling**: Multer (memory storage)
- **Environment**: dotenv

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_s3_bucket_name
```

> ⚠️ **Never commit your `.env` file to version control.**

---

## Installation & Running

```bash
# Install dependencies
npm install

# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:5000`  
Client UI at: `http://localhost:5000`

---

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | API health check |

---

### Posts — `/api/posts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts` | Create a new post (multipart/form-data) |
| `GET` | `/api/posts` | Get all posts with filter/sort/pagination |
| `GET` | `/api/posts/search?keyword=` | Search posts by keyword |
| `GET` | `/api/posts/filter-by-tag/:tagName` | Filter posts by tag name |
| `GET` | `/api/posts/:id` | Get a single post by ID |
| `PUT` | `/api/posts/:id` | Update a post |
| `DELETE` | `/api/posts/:id` | Delete a post (+ S3 image cleanup) |

#### GET `/api/posts` — Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 6 | Posts per page (max 50) |
| `sortBy` | string | `createdAt` | `createdAt` \| `updatedAt` \| `title` |
| `order` | string | `desc` | `asc` \| `desc` |
| `tags` | string | — | Comma-separated tag names (e.g. `nodejs,api`) |
| `status` | string | — | `published` \| `draft` |
| `author` | string | — | Author name (partial, case-insensitive) |

#### POST `/api/posts` — Form-Data Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Post title (max 200 chars) |
| `desc` | string | ✅ | Post content/description |
| `author` | string | — | Author name (default: Anonymous) |
| `status` | string | — | `published` \| `draft` |
| `tags` | string | — | Comma-separated tag names |
| `image` | file | — | Image file (JPG/PNG/WebP/GIF, max 5 MB) |

---

### Tags — `/api/tags`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tags` | Create a new tag |
| `GET` | `/api/tags` | Get all tags |
| `DELETE` | `/api/tags/:id` | Delete a tag by ID |

#### POST `/api/tags` — JSON Body

```json
{
  "name": "nodejs",
  "color": "#6366f1"
}
```

---

## Example Responses

### Success (create post)

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "title": "Getting Started with Node.js",
    "desc": "A comprehensive guide...",
    "image": "https://signed-s3-url...",
    "author": "Saniya Khatik",
    "status": "published",
    "tags": [{ "_id": "...", "name": "nodejs", "color": "#6366f1" }],
    "createdAt": "2024-03-01T10:00:00.000Z"
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Title and description are required"
}
```

---

## Author

**Saniya Jabbar Khatik**  
BTech Computer Science (AI & ML)  
[GitHub](https://github.com/Saniya777-byte)