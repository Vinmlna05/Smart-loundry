<?php

namespace App\Http\Controllers\Pengusaha;

use App\Http\Controllers\Controller;
use App\Http\Requests\BusinessProfileRequest;
use App\Http\Requests\BusinessQrisRequest;
use App\Services\Business\BusinessProfile;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProfilUsahaController extends Controller
{
    public function edit(BusinessProfile $profile): Response
    {
        return Inertia::render('Pengusaha/Profil', [
            'profile' => $profile->all(),
            'qrisUrl' => $profile->qrisUrl(),
        ]);
    }

    public function update(
        BusinessProfileRequest $request,
        BusinessProfile $profile,
    ): RedirectResponse {
        $profile->update($request->validated());

        return back()->with('status', 'Profil usaha diperbarui.');
    }

    public function updateQris(
        BusinessQrisRequest $request,
        BusinessProfile $profile,
    ): RedirectResponse {
        $profile->updateQris($request->file('qris'));

        return back()->with('status', 'Foto QRIS diperbarui.');
    }
}
