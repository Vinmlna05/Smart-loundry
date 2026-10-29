<?php

namespace App\Services\Catalog;

use App\Models\Service;
use Illuminate\Support\Collection;

class ServiceCatalog
{
    /**
     * @return Collection<int, Service>
     */
    public function active(): Collection
    {
        return Service::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * Order-form options shared by the manual form and the chatbot.
     *
     * @param  Collection<int, Service>|null  $services
     * @return array<int, array<string, mixed>>
     */
    public function options(?Collection $services = null): array
    {
        return ($services ?? $this->active())
            ->map(fn (Service $service) => [
                'id' => $service->id,
                'slug' => $service->slug,
                'name' => $service->name,
                'category' => $service->category,
                'description' => $service->description,
                'unit' => $service->unit,
                'price' => $service->price,
                'min' => $service->min_quantity,
                'step' => $service->step_quantity,
                'estimatedHours' => $service->estimated_hours,
                'duration' => $this->durationLabel($service->estimated_hours),
                'startingAt' => $service->is_starting_at,
            ])
            ->values()
            ->all();
    }

    /**
     * Full list for the owner service management page.
     *
     * @return array<int, array<string, mixed>>
     */
    public function adminList(): array
    {
        return Service::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Service $service) => [
                'id' => $service->id,
                'slug' => $service->slug,
                'name' => $service->name,
                'category' => $service->category,
                'description' => $service->description,
                'price' => $service->price,
                'unit' => $service->unit,
                'unitLabel' => 'per '.$service->unit,
                'minimum' => $this->quantityLabel($service->min_quantity, $service->unit),
                'duration' => $this->durationLabel($service->estimated_hours),
                'estimatedHours' => $service->estimated_hours,
                'minQuantity' => $service->min_quantity,
                'stepQuantity' => $service->step_quantity,
                'startingAt' => $service->is_starting_at,
                'active' => $service->is_active,
                'updatedAt' => $service->updated_at?->toDateString(),
                'ordersThisMonth' => 0,
                'includes' => [],
                'note' => $service->description,
            ])
            ->values()
            ->all();
    }

    public function durationLabel(?int $hours): string
    {
        if (! $hours) {
            return 'Dikonfirmasi outlet';
        }

        if ($hours < 24) {
            return "{$hours} jam";
        }

        $days = (int) ceil($hours / 24);

        return "{$days} hari";
    }

    public function quantityLabel(float|int $quantity, string $unit): string
    {
        $value = rtrim(rtrim(number_format((float) $quantity, 2, ',', '.'), '0'), ',');

        return "{$value} {$unit}";
    }
}
