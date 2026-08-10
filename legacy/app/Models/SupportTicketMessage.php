<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportTicketMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['support_ticket_id', 'sender_id', 'message', 'is_admin_reply', 'attachment_path', 'attachment_type'];

    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
