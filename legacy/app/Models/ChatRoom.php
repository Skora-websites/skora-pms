<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatRoom extends Model {
    protected $fillable = ['name', 'type'];

    public function messages() {
        return $this->hasMany(Message::class);
    }

    public function settings() {
        return $this->hasMany(UserChatSetting::class);
    }
}