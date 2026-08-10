<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $apiUrl;
    protected $appKey;
    protected $authKey;
    protected $maxRetries = 3;

    public function __construct()
    {
        $this->apiUrl  = config('services.whatsapp.url', env('WHATSAPP_API_URL'));
        $this->appKey = config('services.whatsapp.appkey');
        $this->authKey = config('services.whatsapp.authkey');
    }

    public function sendMessage(string $mobile, string $message, ?string $fileUrl = null): bool
    {
        $formData = [
            ['name' => 'appkey',  'contents' => $this->appKey],
            ['name' => 'authkey', 'contents' => $this->authKey],
            ['name' => 'to',      'contents' => $mobile],
            ['name' => 'message', 'contents' => $this->sanitizeMessage($message)],
            ['name' => 'sandbox', 'contents' => 'false'],
        ];

        if ($fileUrl) {
            $formData[] = ['name' => 'file', 'contents' => $fileUrl];
        }

        for ($retry = 0; $retry < $this->maxRetries; $retry++) {
            try {
                $response = Http::timeout(30)
                    ->asMultipart()
                    ->post($this->apiUrl, $formData);

                if ($response->successful()) {
                    Log::info('✅ WhatsApp registration message sent', [
                        'mobile' => $mobile,
                        'attempt' => $retry + 1,
                    ]);
                    return true;
                }

                Log::warning("⚠️ WhatsApp attempt " . ($retry + 1) . " failed", [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                // exponential backoff: 1s, 2s, 4s
                sleep(pow(2, $retry));

            } catch (\Exception $e) {
                Log::error("❌ WhatsApp error on attempt " . ($retry + 1), [
                    'mobile' => $mobile,
                    'error'  => $e->getMessage(),
                ]);
            }
        }

        Log::error('🚨 WhatsApp failed after all retries', ['mobile' => $mobile]);
        return false;
    }

    private function sanitizeMessage(string $message): string
    {
        return strip_tags($message);
    }
}
