Blog Platform API

A RESTful backend API for a blog platform built using Node.js, Express, MongoDB, and AWS S3.
This project supports full CRUD operations for posts, tag management, search, filtering, pagination, and image upload to AWS S3.

Tech Stack

Node.js

Express.js

MongoDB (Mongoose)

AWS S3 (AWS SDK v3)

Multer (memory storage)

dotenv

CORS

Features
Post Management

Create a new post

Get all posts (with pagination and sorting)

Get a single post by ID

Update a post

Delete a post

Tag Management

Create tags

Attach multiple tags to a post

Filter posts by tag

Advanced Querying

Pagination

Sorting (ascending / descending)

Search by keyword (title and description)

Filter posts by tag IDs

Image Upload

Upload post images to AWS S3

Store image URL in MongoDB

Uses AWS SDK v3

Uses memory storage with Multer

Project Structure
blog-platform-api/
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── s3.js
│   │
│   ├── controllers/
│   │   ├── post.controller.js
│   │   └── tag.controller.js
│   │
│   ├── middleware/
│   │   └── upload.middleware.js
│   │
│   ├── models/
│   │   ├── post.model.js
│   │   └── tag.model.js
│   │
│   ├── routes/
│   │   ├── post.routes.js
│   │   └── tag.routes.js
│   │
│   └── app.js
│
├── server.js
├── package.json
└── .env
Installation
1. Clone the Repository
git clone https://github.com/your-username/blog-platform-api.git
cd blog-platform-api
2. Install Dependencies
npm install
3. Configure Environment Variables

Create a .env file in the root directory:

PORT=5000
MONGO_URI=your_mongodb_connection_string

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name
Run the Application
Development Mode
npm run dev
Production Mode
npm start

Server runs on:

http://localhost:5000
API Endpoints
Tag Routes
Create Tag
POST /api/tags

Body (JSON):

{
  "name": "Technology"
}
Post Routes
Create Post (with Image Upload)
POST /api/posts

Body: form-data

Key	Type	Description
title	Text	Post title
desc	Text	Post description
image	File	Image file
tags	Text	Comma-separated tag IDs
Get All Posts
GET /api/posts

Query Parameters:

page

limit

sortBy

order

tags

Example:

GET /api/posts?page=1&limit=5&sortBy=createdAt&order=desc
Search Posts
GET /api/posts/search?keyword=node
Get Post By ID
GET /api/posts/:id
Update Post
PUT /api/posts/:id

Body (JSON):

{
  "title": "Updated Title"
}
Delete Post
DELETE /api/posts/:id
AWS S3 Integration

Images are uploaded using Multer memory storage.

Files are sent to AWS S3 using PutObjectCommand.

Image URLs are stored in the Post document.

Bucket can be configured as public or accessed using signed URLs.

Error Handling

400 – Bad Request

404 – Not Found

500 – Internal Server Error

All responses follow a consistent JSON structure.

Future Improvements

Authentication and Authorization (JWT)

Role-based access control

Signed URLs for private S3 access

Deployment (Render / AWS / Railway)

Frontend integration

Author

Saniya Jabbar Khatik
BTech Computer Science (AI & ML)