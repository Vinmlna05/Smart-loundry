<?php

namespace App\Services\Orders;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class OrderStatusService
{
    /**
     * Move an order to the next status and record the change.
     */
    public function transition(
        Order $order,
        OrderStatus $to,
        ?User $actor = null,
        ?string $note = null,
    ): Order {
        $from = $order->status;

        if ($from === $to) {
            return $order;
        }

        if (! $from->canTransitionTo($to)) {
            throw new InvalidArgumentException(
                "Status pesanan tidak dapat berubah dari {$from->value} ke {$to->value}.",
            );
        }

        return DB::transaction(function () use ($order, $from, $to, $actor, $note) {
            $order->status = $to;
            $order->save();

            $order->statusLogs()->create([
                'from_status' => $from->value,
                'to_status' => $to->value,
                'changed_by' => $actor?->id,
                'note' => $note,
            ]);

            return $order->refresh();
        });
    }
}
