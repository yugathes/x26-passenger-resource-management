# X26 Passenger Resource Management System

A RESTful API for managing passenger resources and bookings using TypeScript, Express, Prisma, and PostgreSQL.

## 🚀 Features

- **TypeScript** - Type-safe development
- **Express** - Fast and flexible web framework
- **Prisma ORM** - Modern database toolkit
- **PostgreSQL** - Robust relational database
- **Docker** - Containerized deployment
- **Testing** - Comprehensive test coverage with Jest

## 📋 Day 1 Goals Completed

✅ TypeScript + Express + Prisma + PostgreSQL setup
✅ App skeleton with proper structure
✅ Health endpoint with database connection check
✅ Basic schema (Passenger, Resource, Booking)
✅ Tests for health endpoint
✅ Docker configuration
✅ Ready for Day 2 business logic

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.5+
- **Framework**: Express 4.18+
- **ORM**: Prisma 5.22+
- **Database**: PostgreSQL 15+
- **Testing**: Jest 29+
- **Containerization**: Docker

## 📁 Project Structure

```
x26-passenger-resource-management/
├── src/
│   └── index.ts          # Main application entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── tests/
│   └── health.test.ts    # Health endpoint tests
├── Dockerfile            # Docker image definition
├── docker-compose.yml    # Docker services
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest configuration
└── .env                  # Environment variables
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker (optional, for containerized setup)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd x26-passenger-resource-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start PostgreSQL (using Docker):
```bash
docker-compose up -d postgres
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

### Development

Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:3000`

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## 🏥 API Endpoints

### Health Check

**GET** `/health`

Check the health status of the application and database connection.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "development"
}
```

## 🗄️ Database Schema

### Passenger
- `id` (UUID, primary key)
- `name` (String)
- `email` (String, unique)
- `phone` (String, nullable)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Resource
- `id` (UUID, primary key)
- `name` (String)
- `type` (String)
- `status` (String, default: "available")
- `passengerId` (UUID, nullable, foreign key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Booking
- `id` (UUID, primary key)
- `passengerId` (UUID, foreign key)
- `resourceId` (UUID, foreign key)
- `status` (String, default: "confirmed")
- `startDate` (DateTime)
- `endDate` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🐳 Docker

### Using Docker Compose

Start all services:
```bash
docker-compose up -d
```

Stop all services:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

### Building the Docker Image

```bash
docker build -t prms-api .
```

### Running the Docker Container

```bash
docker run -p 3000:3000 --env-file .env prms-api
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/prms?schema=public` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |

## 🧪 Testing

The project includes tests for the health endpoint. Additional tests will be added in Day 2 for business logic.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on the repository.