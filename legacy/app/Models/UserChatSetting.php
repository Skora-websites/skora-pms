<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserChatSetting extends Model {
    protected $fillable = ['user_id', 'chat_room_id', 'muted', 'last_cleared_at'];
}