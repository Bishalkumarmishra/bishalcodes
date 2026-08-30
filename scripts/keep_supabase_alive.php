<?php
// Supabase Anti-Pause Keep-Alive PHP Script
// Can be executed via cron: php keep_supabase_alive.php

$supabaseUrl = "https://knopoetvssfyxmvggqei.supabase.co";
$supabaseKey = "sb_publishable_-lTSqONdT5KgK3D2d8102Q_8t9yXYbe";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl . "/rest/v1/");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: " . $supabaseKey,
    "Authorization: Bearer " . $supabaseKey
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "[" . date("Y-m-d H:i:s") . "] Supabase Pinged! HTTP Status Code: " . $httpCode . "\n";
?>
