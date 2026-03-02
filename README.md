# Blog Platform API

A RESTful backend API for a blog platform built using **Node.js, Express, MongoDB, and AWS S3**.

This project supports full CRUD operations for posts, tag management, search, filtering, pagination, and image upload to AWS S3.

---

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- AWS S3 (AWS SDK v3)
- Multer (memory storage)
- dotenv
- CORS

---

## Features

### Post Management
- Create a new post (with image upload)
- Get all posts (with pagination & sorting)
- Get a single post by ID
- Update a post
- Delete a post
- Search posts by keyword
- Filter posts by tags

### Tag Management
- Create tags
- Attach multiple tags to posts
- Populate tags in responses

### Cloud Integration
- Image upload to AWS S3
- Image URL stored in MongoDB
- Uses AWS SDK v3 (modern implementation)

---

## Project Structure

blog-platform-api/
│
├── src/
│ ├── config/
│ │ ├── db.js
│ │ └── s3.js
│ │
│ ├── controllers/
│ │ ├── post.controller.js
│ │ └── tag.controller.js
│ │
│ ├── middleware/
│ │ └── upload.middleware.js
│ │
│ ├── models/
│ │ ├── post.model.js
│ │ └── tag.model.js
│ │
│ ├── routes/
│ │ ├── post.routes.js
│ │ └── tag.routes.js
│ │
│ └── app.js
│
├── server.js
├── .env
├── package.json
└── README.md

---

## Environment Variables

Create a `.env` file in the root directory and add:


PORT=5000
MONGO_URI=your_mongodb_connection_string
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name


---

## Installation & Setup

```bash
# Clone repository
git clone <your-repo-link>

# Install dependencies
npm install

# Start development server
npm run dev

Server runs on:

http://localhost:5000
API Endpoints
Posts
Method	Endpoint	Description
POST	/api/posts	Create post (form-data with image)
GET	/api/posts	Get all posts
GET	/api/posts/:id	Get post by ID
PUT	/api/posts/:id	Update post
DELETE	/api/posts/:id	Delete post
GET	/api/posts/search?keyword=	Search posts

Tags
Method	Endpoint	Description
POST	/api/tags	Create tag
GET	/api/tags	Get all tags

Example Create Post (Form-Data)
title: My First Post
desc: This is a blog post
tags: tag_id_here
image: (file upload)

Author
Saniya Jabbar Khatik
BTech Computer Science (AI & ML)