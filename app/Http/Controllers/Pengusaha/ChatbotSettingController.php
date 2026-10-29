<?php

namespace App\Http\Controllers\Pengusaha;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatbotSettingsRequest;
use App\Models\ChatSession;
use App\Models\Order;
use App\Services\Catalog\ServiceCatalog;
use App\Services\Chatbot\ChatbotSettings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ChatbotSettingController extends Controller
{
    public function index(ChatbotSettings $settings, ServiceCatalog $catalog): Response
    {
        $conversationsToday = ChatSession::query()
            ->whereDate('created_at', today())
            ->count();

        $ordersToday = Order::query()
            ->where('source', 'chatbot')
            ->whereDate('created_at', today())
            ->count();

        return Inertia::render('Pengusaha/Chatbot', [
            'settings' => $settings->all(),
            'services' => $catalog->options(),
            'stats' => [
                'conversationsToday' => $conversationsToday,
                'ordersFromChatbot' => $ordersToday,
                'completionRate' => $conversationsToday > 0
                    ? (int) round(min(100, ($ordersToday / $conversationsToday) * 100))
                    : 0,
            ],
            'knowledge' => [
                'outletCount' => 1,
                'hours' => '08.00-20.00',
                'area' => 'Bandung',
            ],
        ]);
    }

    public function update(ChatbotSettingsRequest $request, ChatbotSettings $settings): RedirectResponse
    {
        $settings->update($request->validated());

        return back()->with('status', 'Pengaturan chatbot disimpan.');
    }
}
