<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Draft = 'draft';
    case Terkonfirmasi = 'terkonfirmasi';
    case MenungguPenjemputan = 'menunggu_penjemputan';
    case MenungguAntaranPelanggan = 'menunggu_antaran_pelanggan';
    case Diterima = 'diterima';
    case Ditimbang = 'ditimbang';
    case MenungguPembayaran = 'menunggu_pembayaran';
    case Lunas = 'lunas';
    case SiapDiproses = 'siap_diproses';
    case Diproses = 'diproses';
    case SelesaiDicuci = 'selesai_dicuci';
    case SiapDiambil = 'siap_diambil';
    case DalamPengantaran = 'dalam_pengantaran';
    case DiterimaPelanggan = 'diterima_pelanggan';
    case Selesai = 'selesai';
    case Dibatalkan = 'dibatalkan';

    /**
     * Human readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Terkonfirmasi => 'Terkonfirmasi',
            self::MenungguPenjemputan => 'Menunggu penjemputan',
            self::MenungguAntaranPelanggan => 'Menunggu antaran pelanggan',
            self::Diterima => 'Diterima',
            self::Ditimbang => 'Ditimbang',
            self::MenungguPembayaran => 'Menunggu pembayaran',
            self::Lunas => 'Lunas',
            self::SiapDiproses => 'Siap diproses',
            self::Diproses => 'Diproses',
            self::SelesaiDicuci => 'Selesai dicuci',
            self::SiapDiambil => 'Siap diambil',
            self::DalamPengantaran => 'Dalam pengantaran',
            self::DiterimaPelanggan => 'Diterima pelanggan',
            self::Selesai => 'Selesai',
            self::Dibatalkan => 'Dibatalkan',
        };
    }

    /**
     * Badge tone used by the interface.
     */
    public function tone(): string
    {
        return match ($this) {
            self::Lunas, self::Selesai, self::DiterimaPelanggan => 'success',
            self::MenungguPembayaran, self::MenungguPenjemputan, self::MenungguAntaranPelanggan => 'warning',
            self::Dibatalkan => 'danger',
            default => 'primary',
        };
    }

    /**
     * Statuses that may follow this status.
     *
     * @return array<int, self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::Terkonfirmasi, self::Dibatalkan],
            self::Terkonfirmasi => [self::MenungguPenjemputan, self::MenungguAntaranPelanggan, self::Dibatalkan],
            self::MenungguPenjemputan, self::MenungguAntaranPelanggan => [self::Diterima, self::Dibatalkan],
            self::Diterima => [self::Ditimbang, self::Dibatalkan],
            self::Ditimbang => [self::MenungguPembayaran, self::Dibatalkan],
            self::MenungguPembayaran => [self::Lunas, self::Dibatalkan],
            self::Lunas => [self::SiapDiproses, self::Dibatalkan],
            self::SiapDiproses => [self::Diproses, self::Dibatalkan],
            self::Diproses => [self::SelesaiDicuci, self::Dibatalkan],
            self::SelesaiDicuci => [self::SiapDiambil, self::DalamPengantaran],
            self::SiapDiambil, self::DalamPengantaran => [self::DiterimaPelanggan],
            self::DiterimaPelanggan => [self::Selesai],
            self::Selesai, self::Dibatalkan => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions(), true);
    }
}
