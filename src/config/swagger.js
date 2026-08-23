import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";

dotenv.config();

const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Booking & Review API",
            version: "1.0.0",
            description: "API documentation for the Artist Booking and Reviews backend system.",
        },
        servers: [
            {
                url: `${appUrl}/api/v1`,
                description: "API Server",
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT token to authorize requests.",
                },
            },
            schemas: {
                SignupInput: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email", example: "user@example.com" },
                        password: { type: "string", minLength: 6, example: "securepassword123" },
                        role: { type: "string", enum: ["client", "artist"], default: "client", example: "client" },
                    },
                },
                LoginInput: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email", example: "user@example.com" },
                        password: { type: "string", example: "securepassword123" },
                    },
                },
                BookingInput: {
                    type: "object",
                    required: ["artistId", "eventStart", "eventEnd"],
                    properties: {
                        artistId: { type: "string", format: "uuid", example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" },
                        eventStart: { type: "string", format: "date-time", example: "2026-12-25T18:00:00.000Z" },
                        eventEnd: { type: "string", format: "date-time", example: "2026-12-25T21:00:00.000Z" },
                        notes: { type: "string", example: "Private corporate event" },
                    },
                },
                UpdateBookingStatusInput: {
                    type: "object",
                    required: ["status"],
                    properties: {
                        status: {
                            type: "string",
                            enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
                            example: "confirmed",
                        },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid", example: "27680789-9a74-4b53-a55e-deec2a66e4a2" },
                        email: { type: "string", format: "email", example: "user@example.com" },
                        role: { type: "string", enum: ["client", "artist"], example: "client" },
                        created_at: { type: "string", format: "date-time", example: "2026-08-23T08:31:00.000Z" },
                        updated_at: { type: "string", format: "date-time", example: "2026-08-23T08:31:00.000Z" },
                    },
                },
                Booking: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid", example: "8e36ad18-fb1b-4f51-a905-2420a3203f19" },
                        artist_id: { type: "string", format: "uuid", example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" },
                        client_id: { type: "string", format: "uuid", example: "27680789-9a74-4b53-a55e-deec2a66e4a2" },
                        event_start: { type: "string", format: "date-time", example: "2026-12-25T18:00:00.000Z" },
                        event_end: { type: "string", format: "date-time", example: "2026-12-25T21:00:00.000Z" },
                        notes: { type: "string", nullable: true, example: "Private corporate gig" },
                        status: { type: "string", enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"], example: "pending" },
                        created_at: { type: "string", format: "date-time", example: "2026-08-23T08:35:00.000Z" },
                        updated_at: { type: "string", format: "date-time", example: "2026-08-23T08:35:00.000Z" },
                    },
                },
                Review: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "64e5c3e7f41a8b0a1d6d7e2f" },
                        bookingId: { type: "string", format: "uuid", example: "8e36ad18-fb1b-4f51-a905-2420a3203f19" },
                        artistId: { type: "string", format: "uuid", example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" },
                        clientId: { type: "string", format: "uuid", example: "27680789-9a74-4b53-a55e-deec2a66e4a2" },
                        score: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                        comment: { type: "string", example: "Amazing performance! Fully recommended." },
                        createdAt: { type: "string", format: "date-time", example: "2026-08-23T08:45:00.000Z" },
                        updatedAt: { type: "string", format: "date-time", example: "2026-08-23T08:45:00.000Z" },
                    },
                },
            },
        },
        paths: {
            "/auth/signup": {
                post: {
                    tags: ["Authentication"],
                    summary: "Create a new user account",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/SignupInput" },
                            },
                        },
                    },
                    responses: {
                        201: { description: "User successfully registered" },
                        400: { description: "Validation failure" },
                        409: { description: "Email already exists" },
                    },
                },
            },
            "/auth/login": {
                post: {
                    tags: ["Authentication"],
                    summary: "Authenticate user and return JWT",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LoginInput" },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Login successful with token payload" },
                        401: { description: "Invalid credentials" },
                    },
                },
            },
            "/bookings": {
                get: {
                    tags: ["Bookings"],
                    summary: "Retrieve user's paginated bookings (Client sees created bookings; Artist sees assigned bookings)",
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: "page",
                            in: "query",
                            required: false,
                            schema: { type: "integer", default: 1 },
                            description: "The pagination page number",
                        },
                        {
                            name: "limit",
                            in: "query",
                            required: false,
                            schema: { type: "integer", default: 10 },
                            description: "The maximum number of bookings per page",
                        },
                    ],
                    responses: {
                        200: { description: "Paginated bookings list successfully returned" },
                        401: { description: "Unauthorized" },
                    },
                },
                post: {
                    tags: ["Bookings"],
                    summary: "Submit a new booking request",
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/BookingInput" },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Booking successfully created" },
                        400: { description: "Invalid start/end timings" },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden" },
                        409: { description: "Artist is already booked (overlap)" },
                    },
                },
            },
            "/bookings/{id}": {
                patch: {
                    tags: ["Bookings"],
                    summary: "Update the status of an existing booking",
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string", format: "uuid" },
                            description: "The unique UUID of the booking",
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateBookingStatusInput" },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Booking status successfully updated" },
                        401: { description: "Unauthorized" },
                        403: { description: "Access Denied" },
                        422: { description: "Invalid state transition" },
                    },
                },
            },
            "/artists/{id}/reviews": {
                get: {
                    tags: ["Reviews"],
                    summary: "Retrieve public reviews and summary stats for an artist",
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string", format: "uuid" },
                            description: "The unique UUID of the artist",
                        },
                        {
                            name: "page",
                            in: "query",
                            required: false,
                            schema: { type: "integer", default: 1 },
                            description: "The pagination page number",
                        },
                        {
                            name: "limit",
                            in: "query",
                            required: false,
                            schema: { type: "integer", default: 10 },
                            description: "The number of records per page",
                        },
                    ],
                    responses: {
                        200: { description: "Reviews list and aggregate scores summary returned" },
                        400: { description: "Invalid parameters" },
                    },
                },
                post: {
                    tags: ["Reviews"],
                    summary: "Submit a review for a completed booking with an artist",
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string", format: "uuid" },
                            description: "The unique UUID of the artist",
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["bookingId", "score"],
                                    properties: {
                                        bookingId: { type: "string", format: "uuid", example: "8e36ad18-fb1b-4f51-a905-2420a3203f19" },
                                        score: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                                        comment: { type: "string", example: "Spectacular performance!" },
                                    },
                                },
                             },
                        },
                    },
                    responses: {
                        201: { description: "Review successfully submitted" },
                        400: { description: "Validation failure (not completed, not matching, etc.)" },
                        401: { description: "Unauthorized" },
                        409: { description: "Booking has already been reviewed" },
                    },
                },
            },
        },
    },
    apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;