<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_name','company_short_name','company_tagline','company_description',
        'light_logo','dark_logo','favicon',
        'company_email1','company_email2',
        'company_mobile1','company_mobile2',
        'company_whatsapp1','company_whatsapp2',
        'facebook','twitter','linkedin','instagram','pintrest','map',
        'company_address1','company_address2',
        'currency_name','currency_symbol',
        'default_trial_days',
    ];
}
