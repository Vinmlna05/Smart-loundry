<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    if ($request->user()) {
        return redirect()->route($request->user()->dashboardRoute());
    }

    return redirect()->route('login');
});

Route::get('/dashboard', function (Request $request) {
    return redirect()->route($request->user()->dashboardRoute());
})->middleware('auth')->name('dashboard');

Route::middleware(['auth', 'role:pelanggan'])->group(function () {
    Route::get('/pelanggan/dashboard', function () {
        return Inertia::render('Pelanggan/Dashboard');
    })->name('pelanggan.dashboard');

    Route::get('/pelanggan/layanan', function () {
        return Inertia::render('Pelanggan/Layanan');
    })->name('pelanggan.layanan');

    Route::get('/pelanggan/pesan', function () {
        return Inertia::render('Pelanggan/Pesan');
    })->name('pelanggan.pesan');

    Route::get('/pelanggan/pesan/konfirmasi', function () {
        return Inertia::render('Pelanggan/Konfirmasi');
    })->name('pelanggan.pesan.konfirmasi');

    Route::get('/pelanggan/chatbot', function () {
        return Inertia::render('Pelanggan/Chatbot');
    })->name('pelanggan.chatbot');

    Route::get('/pelanggan/lacak-pesanan', function () {
        return Inertia::render('Pelanggan/LacakPesanan');
    })->name('pelanggan.lacak-pesanan');

    Route::get('/pelanggan/pesanan/{nomorPesanan}', function (string $nomorPesanan) {
        return Inertia::render('Pelanggan/DetailPesanan', [
            'nomorPesanan' => $nomorPesanan,
        ]);
    })->name('pelanggan.pesanan.detail');
});

Route::middleware(['auth', 'role:pengusaha'])->group(function () {
    Route::get('/pengusaha/dashboard', function () {
        return Inertia::render('Pengusaha/Dashboard');
    })->name('pengusaha.dashboard');

    Route::get('/pengusaha/pesanan', function () {
        return Inertia::render('Pengusaha/Pesanan');
    })->name('pengusaha.pesanan');

    Route::get('/pengusaha/pelanggan', function () {
        return Inertia::render('Pengusaha/Pelanggan');
    })->name('pengusaha.pelanggan');

    Route::get('/pengusaha/layanan', function () {
        return Inertia::render('Pengusaha/Layanan');
    })->name('pengusaha.layanan');

    Route::get('/pengusaha/pembayaran', function () {
        return Inertia::render('Pengusaha/Pembayaran');
    })->name('pengusaha.pembayaran');

    Route::get('/pengusaha/laporan', function () {
        return Inertia::render('Pengusaha/Laporan');
    })->name('pengusaha.laporan');

    Route::get('/pengusaha/chatbot', function () {
        return Inertia::render('Pengusaha/Chatbot');
    })->name('pengusaha.chatbot');

    Route::get('/pengusaha/pesanan/{nomorPesanan}', function (string $nomorPesanan) {
        return Inertia::render('Pengusaha/DetailPesanan', [
            'nomorPesanan' => $nomorPesanan,
        ]);
    })->name('pengusaha.pesanan.detail');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
