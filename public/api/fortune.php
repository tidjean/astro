<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

allow_api_request('POST');
bootstrap_env();

$apiKey = getenv('CEREBRAS_API_KEY') ?: 'csk-h6jwmhphvnjmj5m8ccfhf3y32mr86x9xehv6wtn3djdeemtk';
$model = getenv('CEREBRAS_MODEL') ?: 'qwen-3-235b-a22b-instruct-2507';
$apiUrl = getenv('CEREBRAS_API_URL') ?: 'https://api.cerebras.ai/v1/chat/completions';

if ($apiKey === '') {
    send_json(['error' => 'CEREBRAS_API_KEY manquant. Configurez votre environnement PHP.'], 500);
}

$payload = read_json_body();
$prompt = isset($payload['prompt']) ? trim((string) $payload['prompt']) : '';

if ($prompt === '') {
    send_json(['error' => 'Prompt manquant.'], 400);
}

$requestPayload = [
    'model' => $model,
    'messages' => [
        [
            'role' => 'system',
            'content' => 'Tu es une voyante douce, intuitive et mystique. Tu reponds uniquement en francais avec un ton chaleureux, symbolique et rassurant. Tu ne dis jamais que tu es une IA. Tu ne donnes pas de conseil medical, juridique ou financier.',
        ],
        [
            'role' => 'user',
            'content' => $prompt,
        ],
    ],
    'temperature' => 0.9,
    'max_tokens' => 220,
    'stream' => false,
];

$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($requestPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_TIMEOUT => 60,
]);

$upstreamBody = curl_exec($ch);
$curlError = curl_error($ch);
$statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($upstreamBody === false) {
    send_json(['error' => 'Erreur reseau vers l API LLM.', 'details' => $curlError], 502);
}

if ($statusCode < 200 || $statusCode >= 300) {
    http_response_code($statusCode > 0 ? $statusCode : 502);
    echo $upstreamBody;
    exit;
}

$upstreamJson = json_decode($upstreamBody, true);
$content = $upstreamJson['choices'][0]['message']['content'] ?? '';

if (is_array($content)) {
    $content = implode(' ', array_map(
        static fn(array $item): string => isset($item['text']) ? (string) $item['text'] : '',
        array_filter($content, 'is_array')
    ));
}

send_json([
    'model' => $model,
    'response' => trim((string) $content),
]);
