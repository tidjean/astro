<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

allow_api_request('POST');
bootstrap_env();

$logFile = dirname(__DIR__, 2) . '/leads-debug.log';
$logMessage = static function (string $message, array $context = []) use ($logFile): void {
    $line = '[' . gmdate('c') . '] ' . $message;

    if ($context !== []) {
        $line .= ' ' . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    $line .= PHP_EOL;
    @file_put_contents($logFile, $line, FILE_APPEND);
    error_log(trim($line));
};

$payload = read_json_body();
$name = isset($payload['name']) ? trim((string) $payload['name']) : '';
$email = isset($payload['email']) ? trim((string) $payload['email']) : '';
$csvFile = dirname(__DIR__, 2) . '/leads.csv';

$logMessage('Incoming lead request', [
    'name' => $name,
    'email' => $email,
    'csv_file' => $csvFile,
    'cwd' => getcwd(),
    'script' => __FILE__,
]);

if ($name === '' || $email === '') {
    $logMessage('Rejected lead request: missing name or email');
    send_json(['error' => 'Missing name or email'], 400);
}

if (!file_exists($csvFile)) {
    $headerWritten = file_put_contents($csvFile, "name,email,created_at\n");

    if ($headerWritten === false) {
        $logMessage('Failed to initialize CSV file', [
            'csv_file' => $csvFile,
            'parent_writable' => is_writable(dirname($csvFile)),
        ]);
        send_json(['error' => 'Failed to initialize CSV file'], 500);
    }

    $logMessage('Initialized CSV file', ['csv_file' => $csvFile]);
}

$handle = fopen($csvFile, 'ab');

if ($handle === false) {
    $logMessage('Failed to open CSV file', [
        'csv_file' => $csvFile,
        'file_exists' => file_exists($csvFile),
        'file_writable' => is_writable($csvFile),
    ]);
    send_json(['error' => 'Failed to open CSV file'], 500);
}

$written = fputcsv($handle, [$name, $email, gmdate('c')]);
fclose($handle);

if ($written === false) {
    $logMessage('Failed to persist lead', ['csv_file' => $csvFile]);
    send_json(['error' => 'Failed to persist lead'], 500);
}

$logMessage('Lead persisted successfully', [
    'csv_file' => $csvFile,
    'bytes_written' => $written,
    'file_size' => @filesize($csvFile),
]);

send_json([
    'ok' => true,
    'debug' => [
        'csv_file' => $csvFile,
        'csv_exists' => file_exists($csvFile),
        'csv_writable' => file_exists($csvFile) ? is_writable($csvFile) : is_writable(dirname($csvFile)),
        'csv_size' => file_exists($csvFile) ? @filesize($csvFile) : null,
        'log_file' => $logFile,
        'cwd' => getcwd(),
        'script' => __FILE__,
    ],
]);
