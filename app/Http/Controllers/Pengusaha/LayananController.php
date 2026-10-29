<?php

namespace App\Http\Controllers\Pengusaha;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceRequest;
use App\Models\Service;
use App\Services\Catalog\ServiceCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LayananController extends Controller
{
    public function index(ServiceCatalog $catalog): Response
    {
        return Inertia::render('Pengusaha/Layanan', [
            'services' => $catalog->adminList(),
        ]);
    }

    public function store(ServiceRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['is_active'] = $data['is_active'] ?? true;
        $data['is_starting_at'] = $data['is_starting_at'] ?? false;
        $data['sort_order'] = $data['sort_order']
            ?? ((int) Service::query()->max('sort_order') + 1);

        Service::query()->create($data);

        return back()->with('status', 'Layanan ditambahkan.');
    }

    public function update(ServiceRequest $request, Service $service): RedirectResponse
    {
        $service->update($request->validated());

        return back()->with('status', 'Layanan diperbarui.');
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'layanan';
        $slug = $base;
        $counter = 2;

        while (
            Service::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
