<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'category',
        'description',
        'unit',
        'price',
        'min_quantity',
        'step_quantity',
        'estimated_hours',
        'is_starting_at',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'min_quantity' => 'float',
            'step_quantity' => 'float',
            'estimated_hours' => 'integer',
            'is_starting_at' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
