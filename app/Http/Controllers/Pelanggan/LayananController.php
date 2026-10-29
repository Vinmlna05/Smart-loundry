<?php

namespace App\Http\Controllers\Pelanggan;

use App\Http\Controllers\Controller;
use App\Services\Catalog\ServiceCatalog;
use Inertia\Inertia;
use Inertia\Response;

class LayananController extends Controller
{
    public function index(ServiceCatalog $catalog): Response
    {
        return Inertia::render('Pelanggan/Layanan', [
            'services' => $catalog->options(),
        ]);
    }
}
