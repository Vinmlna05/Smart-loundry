<?php

namespace App\Http\Controllers\Pengusaha;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\PengusahaDashboardPresenter;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(PengusahaDashboardPresenter $presenter): Response
    {
        return Inertia::render('Pengusaha/Dashboard', [
            'dashboard' => $presenter->present(),
        ]);
    }
}
