<?php

namespace App\Jobs;

use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendRegistrationWhatsApp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $mobile;
    public $name;
    public $email;

    public function __construct($mobile, $name, $email)
    {
        $this->mobile = $mobile;
        $this->name = $name;
        $this->email = $email;
    }

    public function handle(WhatsAppService $whatsappService)
    {
        $message = "Dear {$this->name},\n" .
                   "Your registration with Skoracares is successful!\n" .
                   "Email: {$this->email}\n" .
                   "Please log in to access your account.\n" .
                   "Regards,\nSkoracares Team";

        $sent = $whatsappService->sendMessage($this->mobile, $message);

        if (!$sent) {
            Log::error('WhatsApp registration notification failed', ['mobile' => $this->mobile]);
        }
    }
}