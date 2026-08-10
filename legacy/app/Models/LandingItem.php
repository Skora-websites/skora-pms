<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingItem extends Model
{
    protected $fillable = [
        'section_key',
        'title',
        'description',
        'image',
        'icon',
        'badge',
        'link',
        'link_text',
        'price_monthly',
        'price_yearly',
        'price_original_monthly',
        'price_original_yearly',
        'features',
        'stars',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'features' => 'array',
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'price_original_monthly' => 'decimal:2',
        'price_original_yearly' => 'decimal:2',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(LandingSection::class, 'section_key', 'key');
    }
}
