# Swagger API Documentation

This project uses [L5-Swagger](https://github.com/DarkaOnLine/L5-Swagger) to generate interactive API documentation using Swagger/OpenAPI.

## Accessing the Documentation

Once your Laravel application is running, you can access the Swagger UI at:

```
http://your-domain.com/api/documentation
```

For local development:
```
http://localhost:8000/api/documentation
```

## Generating Documentation

The documentation is automatically generated when you run:

```bash
php artisan l5-swagger:generate
```

You can also set `L5_SWAGGER_GENERATE_ALWAYS=true` in your `.env` file to regenerate documentation on each request (useful for development).

## Adding API Documentation

API documentation is added using OpenAPI annotations in your controllers. Here's an example:

```php
use OpenApi\Attributes as OA;

#[OA\Get(
    path: "/api/endpoint",
    summary: "Endpoint summary",
    description: "Detailed description",
    tags: ["TagName"],
    responses: [
        new OA\Response(
            response: 200,
            description: "Success response",
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "message", type: "string", example: "Success"),
                ]
            )
        ),
    ]
)]
public function index()
{
    // Your controller logic
}
```

## Authentication

The API uses Laravel Sanctum for authentication. To test authenticated endpoints in Swagger UI:

1. Click the "Authorize" button at the top of the Swagger UI
2. Enter your token in the format: `Bearer your-token-here`
3. Click "Authorize" to apply the token to all requests

## Current Documented Endpoints

- **Authentication**: Login, Logout
- **Language**: Switch language, Get translations

More endpoints will be documented as the API evolves.

## Configuration

Swagger configuration is located in `config/l5-swagger.php`. Key settings:

- `generate_always`: Set to `true` in development to regenerate docs on each request
- `base`: API base path (default: `/api`)
- `securityDefinitions`: Authentication schemes (Sanctum is configured)

## Resources

- [L5-Swagger Documentation](https://github.com/DarkaOnLine/L5-Swagger)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger PHP Annotations](https://zircote.github.io/swagger-php/)

