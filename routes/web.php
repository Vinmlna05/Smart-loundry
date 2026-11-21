<?php

use App\Http\Controllers\Pelanggan\ChatbotController;
use App\Http\Controllers\Pelanggan\LayananController;
use App\Http\Controllers\Pelanggan\PesananController;
use App\Http\Controllers\Pelanggan\TrackingController;
use App\Http\Controllers\Pengusaha\ChatbotSettingController;
use App\Http\Controllers\Pengusaha\DashboardController as PengusahaDashboardController;
use App\Http\Controllers\Pengusaha\LaporanController as PengusahaLaporanController;
use App\Http\Controllers\Pengusaha\LayananController as PengusahaLayananController;
use App\Http\Controllers\Pengusaha\PelangganController as PengusahaPelangganController;
use App\Http\Controllers\Pengusaha\PembayaranController as PengusahaPembayaranController;
use App\Http\Controllers\Pengusaha\PesananController as PengusahaPesananController;
use App\Http\Controllers\Pengusaha\ProfilUsahaController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/__diag-order', function (Request $request) {
    if ($request->query('token') !== 'cleanora-diag-7f3a9') {
        abort(404);
    }

    $out = [];

    try {
        $connection = \Illuminate\Support\Facades\DB::connection();
        $out['db'] = [
            'database' => $connection->getDatabaseName(),
            'host' => $connection->getConfig('host'),
            'username' => $connection->getConfig('username'),
            'driver' => $connection->getConfig('driver'),
            'server' => \Illuminate\Support\Facades\DB::selectOne('select current_user as u, current_schema() as s, version() as v'),
        ];
        $out['tables'] = \Illuminate\Support\Facades\DB::select(
            "select tablename from pg_tables where schemaname = 'public' order by tablename"
        );
        $out['services'] = \App\Models\Service::count();
        $out['migrations'] = \Illuminate\Support\Facades\DB::table('migrations')->count();
    } catch (\Throwable $e) {
        $out['db_error'] = [
            'class' => get_class($e),
            'message' => $e->getMessage(),
        ];
    }

    if (isset($out['db_error'])) {
        return response()->json($out);
    }

    $out['php'] = PHP_VERSION;

    try {
        $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
        $out['pdo'] = [
            'emulate_prepares' => $pdo->getAttribute(PDO::ATTR_EMULATE_PREPARES),
            'disable_prepares_const' => defined('PDO::PGSQL_ATTR_DISABLE_PREPARES') ? PDO::PGSQL_ATTR_DISABLE_PREPARES : null,
        ];
    } catch (\Throwable $e) {
        $out['pdo_error'] = $e->getMessage();
    }

    $reset = function () {
        while (\Illuminate\Support\Facades\DB::transactionLevel() > 0) {
            try {
                \Illuminate\Support\Facades\DB::rollBack();
            } catch (\Throwable $e) {
                break;
            }
        }
    };

    $attempt = function (string $label, callable $fn) use (&$out, $reset) {
        $reset();

        try {
            $value = $fn();
            $reset();
            $out['tests'][$label] = ['ok' => true, 'value' => $value];
        } catch (\Throwable $e) {
            $reset();

            $item = [
                'ok' => false,
                'class' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ];

            if ($e instanceof \Illuminate\Database\QueryException) {
                $item['sql'] = $e->getSql();
                $item['bindings'] = $e->getBindings();
            }

            $out['tests'][$label] = $item;
        }
    };

    $attempt('autocommit_services_active', fn () => \App\Models\Service::where('is_active', true)->first()?->id);
    $attempt('autocommit_users_role', fn () => \App\Models\User::where('role', 'pelanggan')->first()?->id);

    $attempt('tx_single_services', function () {
        \Illuminate\Support\Facades\DB::beginTransaction();

        return \App\Models\Service::where('is_active', true)->first()?->id;
    });

    $attempt('tx_users_then_services', function () {
        \Illuminate\Support\Facades\DB::beginTransaction();
        $userId = \App\Models\User::where('role', 'pelanggan')->first()?->id;
        $serviceId = \App\Models\Service::where('is_active', true)->first()?->id;

        return ['user' => $userId, 'service' => $serviceId];
    });

    $attempt('tx_create_order', function () {
        $user = \App\Models\User::where('role', 'pelanggan')->first();
        $service = \App\Models\Service::where('is_active', true)->first();

        if (! $user || ! $service) {
            return 'skipped: user/service missing';
        }

        \Illuminate\Support\Facades\DB::beginTransaction();

        $order = app(\App\Actions\Orders\CreateOrder::class)->handle([
            'name' => 'Tes Diagnostik',
            'whatsapp' => '081234567890',
            'service_id' => $service->id,
            'estimated_quantity' => 2,
            'intake_method' => 'antar',
            'delivery_method' => 'ambil',
            'schedule_date' => now()->toDateString(),
            'schedule_time' => '08:00-10:00',
            'source' => 'manual',
        ], $user);

        return $order->order_number;
    });

    return response()->json($out);
});

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

    Route::get('/pelanggan/pesanan/{nomorPesanan}', [PesananController::class, 'detail'])
        ->name('pelanggan.pesanan.detail');
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

    Route::get('/pengusaha/laporan', [PengusahaLaporanController::class, 'index'])
        ->name('pengusaha.laporan');

    Route::patch('/pengusaha/profil', [ProfilUsahaController::class, 'update'])
        ->name('pengusaha.profil.update');

    Route::post('/pengusaha/profil/qris', [ProfilUsahaController::class, 'updateQris'])
        ->name('pengusaha.profil.qris');

    Route::get('/pengusaha/chatbot', [ChatbotSettingController::class, 'index'])
        ->name('pengusaha.chatbot');

    Route::post('/pengusaha/chatbot', [ChatbotSettingController::class, 'update'])
        ->name('pengusaha.chatbot.update');

    Route::post('/pengusaha/chatbot/uji', [ChatbotSettingController::class, 'test'])
        ->middleware('throttle:30,1')
        ->name('pengusaha.chatbot.uji');

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
