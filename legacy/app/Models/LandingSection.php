<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LandingSection extends Model
{
    protected $fillable = [
        'key',
        'name',
        'title',
        'subtitle',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(LandingItem::class, 'section_key', 'key')
                    ->orderBy('order', 'asc');
    }
}
