<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mail_setting extends Model
{
    protected $table = 'mail_settings';
    protected $fillable = [
        'mailer', 'host', 'port', 'username', 'password', 'encryption', 'from_address', 'from_name'
    ];
}
