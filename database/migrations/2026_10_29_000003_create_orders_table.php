<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 30)->unique();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source', 20)->default('manual');
            $table->string('intake_method', 20);
            $table->string('delivery_method', 20)->nullable();
            $table->text('pickup_address')->nullable();
            $table->date('schedule_date');
            $table->string('schedule_time', 20);
            $table->decimal('estimated_weight', 8, 2);
            $table->decimal('actual_weight', 8, 2)->nullable();
            $table->unsignedInteger('estimated_price');
            $table->unsignedInteger('final_price')->nullable();
            $table->string('status', 40)->default('draft')->index();
            $table->string('payment_status', 20)->default('belum_dibayar');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
