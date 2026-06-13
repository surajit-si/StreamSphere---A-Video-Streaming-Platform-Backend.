# 🎥 StreamSphere

A production-inspired video streaming platform backend built with Node.js, Express.js, MongoDB, JWT authentication, and Cloudinary.

StreamSphere is designed to simulate the backend architecture of modern video streaming platforms. The project focuses on scalable API design, secure authentication, media management, and clean backend engineering practices.

---

## 🚀 Features

### Authentication & Authorization

* User registration and login
* JWT-based authentication
* Access Token & Refresh Token workflow
* Secure password hashing with bcrypt
* Cookie-based authentication

### User Management

* User profiles
* Avatar and cover image uploads
* Account updates
* Watch history

### Video Management

* Upload videos
* Update video details
* Delete videos
* Publish/unpublish videos
* Video metadata management

### Social Features

* Channel subscriptions
* Likes and comments

### Backend Architecture

* RESTful API design
* Centralized error handling
* Custom API response structure
* Middleware-based architecture
* Modular and scalable code organization

---

## 🛠️ Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication & Security

* JSON Web Tokens (JWT)
* bcrypt
* Cookie Parser

### File Upload & Media Storage

* Multer
* Cloudinary

### Development Tools

* Nodemon
* Postman

---

## 🔒 Authentication Flow

1. User logs in.
2. Server generates Access Token and Refresh Token.
3. Tokens are stored in secure HTTP-only cookies.
4. Access Token is used for protected routes.
5. Refresh Token is used to generate new Access Tokens.
6. Refresh Tokens are rotated for enhanced security.

---

## 🎯 Learning Goals

This project was built as a practical way to learn and implement:

* Backend architecture
* Authentication systems
* Database modeling
* REST API development
* Media upload workflows
* Security best practices
* Production-oriented project structure

---

## 📜 License

This project is open-source and available under the MIT License.

---

### Built with ❤️ while learning backend development and production-level engineering practices.
