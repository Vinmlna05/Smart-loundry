<?php

use App\Http\Controllers\Pelanggan\ChatbotController;
use App\Http\Controllers\Pelanggan\LayananController;
use App\Http\Controllers\Pelanggan\PesananController;
use App\Http\Controllers\Pelanggan\TrackingController;
use App\Http\Controllers\Pengusaha\ChatbotSettingController;
use App\Http\Controllers\Pengusaha\DashboardController as PengusahaDashboardController;
use App\Http\Controllers\Pengusaha\LayananController as PengusahaLayananController;
use App\Http\Controllers\Pengusaha\PembayaranController as PengusahaPembayaranController;
use App\Http\Controllers\Pengusaha\PelangganController as PengusahaPelangganController;
use App\Http\Controllers\Pengusaha\PesananController as PengusahaPesananController;
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

    Route::get('/pelanggan/layanan', [LayananController::class, 'index'])
        ->name('pelanggan.layanan');

    Route::get('/pelanggan/pesan', [PesananController::class, 'form'])
        ->name('pelanggan.pesan');

    Route::get('/pelanggan/pesan/konfirmasi', [PesananController::class, 'create'])
        ->name('pelanggan.pesan.konfirmasi');

    Route::post('/pelanggan/pesan', [PesananController::class, 'store'])
        ->name('pelanggan.pesan.store');

    Route::get('/pelanggan/pesan/berhasil/{nomorPesanan}', [PesananController::class, 'success'])
        ->name('pelanggan.pesan.berhasil');

    Route::get('/pelanggan/chatbot', [ChatbotController::class, 'index'])
        ->name('pelanggan.chatbot');

    Route::post('/pelanggan/chatbot/pesan', [ChatbotController::class, 'message'])
        ->middleware('throttle:30,1')
        ->name('pelanggan.chatbot.pesan');

    Route::post('/pelanggan/chatbot/konfirmasi', [ChatbotController::class, 'confirm'])
        ->middleware('throttle:10,1')
        ->name('pelanggan.chatbot.konfirmasi');

    Route::get('/pelanggan/lacak-pesanan', [TrackingController::class, 'index'])
        ->name('pelanggan.lacak-pesanan');

    Route::post('/pelanggan/lacak-pesanan', [TrackingController::class, 'search'])
        ->middleware('throttle:10,1')
        ->name('pelanggan.lacak-pesanan.cari');

    Route::get('/pelanggan/pesanan/{nomorPesanan}', function (string $nomorPesanan) {
        return Inertia::render('Pelanggan/DetailPesanan', [
            'nomorPesanan' => $nomorPesanan,
        ]);
    })->name('pelanggan.pesanan.detail');
});

Route::middleware(['auth', 'role:pengusaha'])->group(function () {
    Route::get('/pengusaha/dashboard', [PengusahaDashboardController::class, 'index'])
        ->name('pengusaha.dashboard');

    Route::get('/pengusaha/pesanan', [PengusahaPesananController::class, 'index'])
        ->name('pengusaha.pesanan');

    Route::get('/pengusaha/pelanggan', [PengusahaPelangganController::class, 'index'])
        ->name('pengusaha.pelanggan');

    Route::get('/pengusaha/layanan', [PengusahaLayananController::class, 'index'])
        ->name('pengusaha.layanan');

    Route::post('/pengusaha/layanan', [PengusahaLayananController::class, 'store'])
        ->name('pengusaha.layanan.store');

    Route::patch('/pengusaha/layanan/{service}', [PengusahaLayananController::class, 'update'])
        ->name('pengusaha.layanan.update');

    Route::get('/pengusaha/pembayaran', [PengusahaPembayaranController::class, 'index'])
        ->name('pengusaha.pembayaran');

    Route::get('/pengusaha/laporan', function () {
        return Inertia::render('Pengusaha/Laporan');
    })->name('pengusaha.laporan');

    Route::get('/pengusaha/chatbot', [ChatbotSettingController::class, 'index'])
        ->name('pengusaha.chatbot');

    Route::post('/pengusaha/chatbot', [ChatbotSettingController::class, 'update'])
        ->name('pengusaha.chatbot.update');

    Route::get('/pengusaha/pesanan/{order:order_number}', [PengusahaPesananController::class, 'show'])
        ->name('pengusaha.pesanan.detail');

    Route::patch('/pengusaha/pesanan/{order:order_number}/terima', [PengusahaPesananController::class, 'receive'])
        ->name('pengusaha.pesanan.terima');

    Route::patch('/pengusaha/pesanan/{order:order_number}/timbang', [PengusahaPesananController::class, 'weigh'])
        ->name('pengusaha.pesanan.timbang');

    Route::patch('/pengusaha/pesanan/{order:order_number}/bayar', [PengusahaPesananController::class, 'pay'])
        ->name('pengusaha.pesanan.bayar');

    Route::patch('/pengusaha/pesanan/{order:order_number}/siap', [PengusahaPesananController::class, 'ready'])
        ->name('pengusaha.pesanan.siap');

    Route::patch('/pengusaha/pesanan/{order:order_number}/selesai', [PengusahaPesananController::class, 'complete'])
        ->name('pengusaha.pesanan.selesai');

    Route::patch('/pengusaha/pesanan/{order:order_number}/batalkan', [PengusahaPesananController::class, 'cancel'])
        ->name('pengusaha.pesanan.batalkan');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
