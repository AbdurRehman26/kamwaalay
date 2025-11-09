<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller as BaseController;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "Kamwaalay API",
    description: "API documentation for Kamwaalay - A platform connecting households with trusted domestic helpers",
    contact: new OA\Contact(
        email: "contact@kamwaalay.com"
    ),
    license: new OA\License(
        name: "MIT"
    )
)]
#[OA\Server(
    url: L5_SWAGGER_CONST_HOST . "/api",
    description: "API Server"
)]
#[OA\SecurityScheme(
    securityScheme: "sanctum",
    type: "apiKey",
    name: "Authorization",
    in: "header",
    description: "Enter token in format: Bearer {token}"
)]
abstract class Controller extends BaseController
{
    //
}
