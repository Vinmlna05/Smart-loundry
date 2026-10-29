<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Gemini API
    |--------------------------------------------------------------------------
    |
    | The API key is only read on the server. Never expose it to the browser.
    |
    */

    'api_key' => env('GEMINI_API_KEY'),

    'model' => env('GEMINI_MODEL', 'gemini-3.5-flash'),

    'endpoint' => env('GEMINI_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta'),

    'timeout' => (int) env('GEMINI_TIMEOUT', 60),

];
