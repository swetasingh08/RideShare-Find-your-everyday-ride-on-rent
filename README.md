# RideShare - Find Your Everyday Ride on Rent

A full-stack vehicle rental and ride-sharing platform built with React, Node.js, Express, MongoDB, Clerk, and modern location-based services.

RideShare allows users to discover vehicles, compare rental options, make bookings, manage vehicle listings, track active rentals, process payments, and communicate with the platform through AI-powered assistance.

![RideShare Logo](client/public/rideShareLogo.png)

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-528FF0?style=for-the-badge&logo=razorpay&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)

---

## 📑 Table of Contents

- [🌐 Live Demo](#-live-demo)
- [📝 About the Project](#-about-the-project)
- [✨ Key Features](#-key-features)
- [👥 User Roles](#-user-roles)
- [🧭 Application Flow](#-application-flow)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [📦 Project Structure](#-project-structure)
- [⚙️ Environment Variables](#️-environment-variables)
- [🚀 Getting Started](#-getting-started)
- [💻 Available Commands](#-available-commands)
- [🌐 API Overview](#-api-overview)
- [☁️ Deployment](#️-deployment)
- [🔐 Security Notes](#-security-notes)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌐 Live Demo

| Environment | URL |
|-------------|-----|
| 🖥️ Frontend | https://ride-share-find-your-everyday-ride-xi.vercel.app/ |
| 🚂 Backend API | https://ride-share-find-your-everyday-ride.vercel.app/ |

The backend root endpoint returns:

```text
Server is running
```

---

## 📝 About the Project

RideShare is a modern vehicle rental platform designed to simplify everyday transportation.

Users can browse available cars, search by location, view vehicle details, request bookings, make payments, download invoices, track active bookings, and manage their profiles.

Vehicle owners use the same user account system to publish and manage their vehicles. Admins can manage users, review access requests, verify vehicle listings, moderate reviews, and control application roles.

The platform uses Clerk Organizations for authentication and role management with two primary application roles:

- `admin`
- `user`

Vehicle owners are regular users with additional vehicle-management capabilities.

---

## ✨ Key Features

### 🚗 Vehicle Discovery

- Browse available rental vehicles
- Search vehicles by location
- View detailed vehicle information
- Filter by category, price, fuel type, transmission, seating capacity, and availability
- View vehicle images, specifications, rules, pricing, and pickup details
- Display vehicle locations on interactive maps

### 📅 Booking Management

- Check vehicle availability
- Generate booking quotes
- Select pickup and return dates
- Support hourly and daily rental pricing
- Apply security deposits and additional charges
- Request owner approval for bookings
- Cancel bookings
- View current and previous bookings
- Coordinate pickup and return details

### 💳 Payments and Invoices

- Razorpay payment integration
- Secure payment verification
- Additional booking charge support
- Payment webhook handling
- Booking payment status tracking
- Downloadable PDF invoices

Payments can be enabled or disabled through the `PAYMENTS_ENABLED` environment variable.

### 🧑‍💼 Vehicle Owner Features

- Add new vehicles
- Upload vehicle photos and documents
- Edit vehicle details
- Set pricing and rental policies
- Configure delivery availability
- Manage vehicle availability
- View owner dashboard statistics
- Manage renter bookings
- Receive pricing suggestions

### 👮 Admin Features

- Admin dashboard
- User management
- User role management
- Invite users through Clerk
- Review account access requests
- Verify vehicle listings
- Moderate reviews
- Remove users
- Resend invitations
- Manage platform members

### 🔐 Authentication and Authorization

- Clerk-based authentication
- Organization-based roles
- Admin and user access control
- Protected backend routes
- Role-aware frontend routing
- Automatic dashboard redirection
- Profile completion flow
- Secure JWT verification

### 📍 Location and Tracking

- Location search and geocoding
- Reverse geocoding
- Route calculation
- Vehicle pickup location support
- Booking tracking
- Live tracking updates
- Tracking session management

### 🤖 AI Assistant

- AI-powered vehicle recommendations
- Conversational vehicle search
- Search assistance based on budget, location, category, and preferences
- Conversation history support
- Gemini AI integration

### 🔔 Notifications

- Booking notifications
- Payment notifications
- Review notifications
- Vehicle verification updates
- Read and unread notification states

### ⭐ Reviews and Ratings

- Submit reviews after completed bookings
- View vehicle reviews
- Owner responses
- Admin review moderation

### 🎨 Modern User Interface

- Responsive design
- Light and dark themes
- Tailwind CSS styling
- Animated interactions
- Mobile-friendly layouts
- Toast notifications
- Interactive maps
- Reusable UI components

---

## 👥 User Roles

### 👑 Admin

Admins are responsible for managing the platform.

Admin capabilities include:

- Manage users
- Change user roles
- Review account requests
- Invite users
- Verify vehicle listings
- Moderate reviews
- Remove platform members
- View administrative information

### 👤 User

Users can use RideShare as renters and vehicle owners.

User capabilities include:

- Browse vehicles
- Book vehicles
- Make payments
- View bookings
- Download invoices
- Track active rentals
- Add and manage vehicles
- Manage vehicle availability
- Respond to reviews
- Complete their profile

> RideShare uses one unified user role instead of separate renter and vehicle-owner accounts.

---

## 🧭 Application Flow

```text
Visitor
   │
   ├── Browse vehicles
   ├── Search by location
   ├── View vehicle details
   └── Sign in or request access
           │
           ▼
       Authenticated User
           │
           ├── Complete profile
           ├── Book a vehicle
           ├── Make payment
           ├── Track booking
           ├── Download invoice
           └── List and manage vehicles
                    │
                    ▼
                  Admin
                    │
                    ├── Manage users
                    ├── Review access requests
                    ├── Verify vehicles
                    └── Moderate reviews
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| React | Frontend user interface |
| Vite | Frontend build tool and development server |
| React Router | Client-side routing |
| Tailwind CSS | Responsive styling |
| Motion | UI animations |
| Axios | API communication |
| Leaflet | Interactive maps |
| React Leaflet | React integration for Leaflet |
| Node.js | Backend JavaScript runtime |
| Express.js | REST API server |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| Clerk | Authentication and organization roles |
| Razorpay | Payment processing |
| ImageKit | Image storage and optimization |
| PDFKit | PDF invoice generation |
| Gemini API | AI-powered recommendations and chat |
| Vercel | Cloud deployment |

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │   React + Vite App  │
                    │   Tailwind CSS UI   │
                    └──────────┬──────────┘
                               │
                               │ Axios / HTTPS
                               ▼
                    ┌─────────────────────┐
                    │ Express REST API    │
                    │ Authentication      │
                    │ Business Services   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │ MongoDB    │   │ Clerk      │   │ External   │
       │ Database   │   │ Auth/Roles │   │ Services   │
       └────────────┘   └────────────┘   └────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                         Razorpay       Gemini AI       Maps
```

---

## 📦 Project Structure

```text
RideShare/
├── client/
│   ├── public/
│   │   ├── favicon.png
│   │   ├── rideShareLogo.png
│   │   └── rideShareLogoDark.png
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── owner/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
│
├── server/
│   ├── configs/
│   ├── controllers/
│   ├── jobs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   └── vercel.json
│
├── documentation/
├── LICENSE
└── README.md
```

---

## ⚙️ Environment Variables

### Frontend Environment Variables

Create `client/.env`:

```env
VITE_BASE_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLERK_ORG_SLUG=car-rental
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CURRENCY=₹
```

| Variable | Description |
|----------|-------------|
| `VITE_BASE_URL` | Backend API URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key |
| `VITE_CLERK_ORG_SLUG` | Clerk organization slug |
| `VITE_CLERK_SIGN_IN_URL` | Frontend sign-in route |
| `VITE_CURRENCY` | Currency symbol displayed in the application |

> In Vercel, `VITE_BASE_URL` must point to the backend deployment URL, not the frontend URL.

### Backend Environment Variables

Create `server/.env`:

```env
PAYMENTS_ENABLED=false

MONGODB_URI=your_mongodb_connection_string
MONGODB_SERVER_SELECTION_TIMEOUT_MS=10000
MONGODB_CONNECT_TIMEOUT_MS=10000

CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_JWT_KEY=your_clerk_jwt_key
CLERK_ORG_ID=your_clerk_organization_id
CLERK_ORG_SLUG=car-rental

CLERK_AUTHORIZED_PARTIES=http://localhost:5173,https://your-frontend.vercel.app
CLERK_INVITE_REDIRECT_URL=http://localhost:5173

CLERK_ROLE_ADMIN=org:admin
CLERK_ROLE_USER=org:user

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

TRACKING_SIMULATION_DURATION_MS=120000
MIN_TRACKING_UPDATE_DISTANCE_KM=0.02
MIN_TRACKING_UPDATE_INTERVAL_MS=15000

GEOCODER_URL=https://nominatim.openstreetmap.org
ROUTER_URL=https://router.project-osrm.org
GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_SERVER_API_KEY=
LOCATION_USER_AGENT=RideShare/1.0 location features

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-flash-lite-latest
GEMINI_FALLBACK_MODEL=gemini-2.0-flash
AI_TIMEOUT_MS=20000
```

Never commit `.env` files or expose backend secrets in frontend variables.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RideShare
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../server
npm install
```

### 4. Configure Environment Variables

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Add the required credentials to both files.

### 5. Configure Clerk

Clerk must be configured with:

- One organization
- `org:admin` role
- `org:user` role
- Correct frontend authorized party
- Correct backend authorized parties
- Correct production frontend URL

The setup script can create or update the application roles:

```bash
cd server
npm run clerk:setup
```

### 6. Start the Backend

```bash
cd server
npm run server
```

The backend runs on:

```text
http://localhost:3000
```

### 7. Start the Frontend

Open another terminal:

```bash
cd client
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

---

## 💻 Available Commands

### Frontend Commands

Run from the `client` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

### Backend Commands

Run from the `server` directory:

| Command | Description |
|---------|-------------|
| `npm run server` | Start the backend with Nodemon |
| `npm start` | Start the backend normally |
| `npm run clerk:setup` | Configure Clerk organization roles |

---

## 🌐 API Overview

### User Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/user/access-request` | Submit an account access request |
| `GET` | `/api/user/data` | Get authenticated user data |
| `PUT` | `/api/user/profile` | Update user profile |
| `GET` | `/api/user/cars` | Get available vehicles |
| `GET` | `/api/user/cars/nearby` | Get nearby vehicles |

### Vehicle Owner Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/owner/add-car` | Add a vehicle |
| `POST` | `/api/owner/update-car` | Update a vehicle |
| `GET` | `/api/owner/cars` | Get owner vehicles |
| `POST` | `/api/owner/toggle-car` | Change vehicle availability |
| `POST` | `/api/owner/delete-car` | Delete a vehicle |
| `GET` | `/api/owner/dashboard` | Get owner dashboard information |

### Booking Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings/check-availability` | Check vehicle availability |
| `POST` | `/api/bookings/quote` | Generate a booking quote |
| `POST` | `/api/bookings/create` | Create a booking |
| `GET` | `/api/bookings/user` | Get user bookings |
| `GET` | `/api/bookings/owner` | Get owner bookings |
| `POST` | `/api/bookings/cancel` | Cancel a booking |
| `POST` | `/api/bookings/change-status` | Update booking status |

### Payment Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/create-order` | Create a Razorpay order |
| `POST` | `/api/payments/verify` | Verify a payment |
| `POST` | `/api/payments/create-charge-order` | Create an additional charge order |
| `POST` | `/api/payments/verify-charge` | Verify an additional charge |
| `POST` | `/api/payments/webhook` | Receive payment webhook events |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List platform users |
| `POST` | `/api/admin/invite` | Invite a user |
| `POST` | `/api/admin/change-role` | Change a user's role |
| `GET` | `/api/admin/access-requests` | List account requests |
| `POST` | `/api/admin/access-requests/review` | Approve or reject requests |
| `GET` | `/api/admin/vehicle-verifications` | List vehicle verification requests |
| `POST` | `/api/admin/vehicle-verifications/review` | Review vehicle listings |
| `GET` | `/api/admin/reviews` | List reviews for moderation |

Protected endpoints require a valid Clerk session token.

---

## ☁️ Deployment

### Frontend Deployment on Vercel

1. Create a new Vercel project.
2. Select the repository.
3. Set the root directory to:

```text
client
```

4. Use the following build settings:

```text
Build Command: npm run build
Output Directory: dist
```

5. Add the frontend environment variables.
6. Deploy the project.

### Backend Deployment on Vercel

1. Create another Vercel project.
2. Select the same repository.
3. Set the root directory to:

```text
server
```

4. Add all backend environment variables.
5. Set the frontend domain in:

```env
CLERK_AUTHORIZED_PARTIES
```

6. Deploy the backend.
7. Update the frontend variable:

```env
VITE_BASE_URL=https://your-backend.vercel.app
```

8. Redeploy the frontend after changing the backend URL.

### Important Clerk Configuration

The frontend production URL must match the authorized party configured in Clerk.

For example:

```env
CLERK_AUTHORIZED_PARTIES=http://localhost:5173,https://your-frontend.vercel.app
```

Do not include a different Vercel deployment URL or an incorrect trailing slash.

---

## 🔐 Security Notes

- Never commit `.env` files.
- Never expose `CLERK_SECRET_KEY` in the frontend.
- Never expose `MONGODB_URI` in frontend variables.
- Never expose Razorpay secret keys in the browser.
- Use `VITE_` variables only for values safe to expose publicly.
- Keep frontend and backend Clerk URLs synchronized.
- Verify payment webhooks using the configured webhook secret.
- Use protected API routes for user, booking, payment, and admin operations.
- Store uploaded files through a secure image-storage provider.
- Restrict production API credentials to production domains.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Clone your fork:

```bash
git clone <your-fork-url>
cd RideShare
```

3. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

4. Install dependencies:

```bash
cd client
npm install

cd ../server
npm install
```

5. Make your changes.
6. Run linting and builds:

```bash
cd client
npm run lint
npm run build
```

7. Commit your changes:

```bash
git commit -m "feat: describe your change"
```

8. Push your branch:

```bash
git push origin feature/your-feature-name
```

9. Open a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

### 🚗 RideShare — Find your everyday ride

Built with React, Express, MongoDB, Clerk, and modern web technologies.

⭐ Star the repository if you find it useful!

</div>
