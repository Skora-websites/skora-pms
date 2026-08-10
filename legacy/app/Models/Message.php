<?php

// app/Models/Message.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model {
    use SoftDeletes;
    protected $fillable = ['sender_id', 'content', 'doctor_id', 'chat_room_id', 'timestamp'];

    public function sender() {
        return $this->belongsTo(User::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    protected $casts = [
    'timestamp' => 'datetime',
];


}