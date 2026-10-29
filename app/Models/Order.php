<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_id',
        'user_id',
        'source',
        'intake_method',
        'delivery_method',
        'pickup_address',
        'schedule_date',
        'schedule_time',
        'estimated_weight',
        'actual_weight',
        'estimated_price',
        'final_price',
        'status',
        'payment_status',
        'invoiced_at',
        'payment_method',
        'paid_at',
        'payment_confirmed_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'schedule_date' => 'date',
            'estimated_weight' => 'float',
            'actual_weight' => 'float',
            'estimated_price' => 'integer',
            'final_price' => 'integer',
            'invoiced_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class);
    }

    public function paymentConfirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payment_confirmed_by');
    }
}
