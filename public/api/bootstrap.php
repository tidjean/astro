<?php

declare(strict_types=1);

function send_json(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function allow_api_request(string $method = 'POST'): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        send_json(['error' => 'Method not allowed'], 405);
    }
}

function load_env_file(string $filename): void
{
    if (!is_file($filename) || !is_readable($filename)) {
        return;
    }

    $lines = file($filename, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $trimmed, 2);
        $key = trim($key);
        $value = trim($value);

        if ($key === '') {
            continue;
        }

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

function bootstrap_env(): void
{
    $root = dirname(__DIR__, 2);

    load_env_file($root . '/.env');
    load_env_file($root . '/.env.local');
}

function read_json_body(): array
{
    $rawBody = file_get_contents('php://input');
    $payload = json_decode($rawBody ?: '{}', true);

    if (!is_array($payload)) {
        send_json(['error' => 'JSON invalide.'], 400);
    }

    return $payload;
}
