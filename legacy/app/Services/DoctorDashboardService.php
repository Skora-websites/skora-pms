<?php

namespace App\Services;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Appointment;
use App\Models\Billing;
use App\Models\TestBooking;
use App\Models\Transaction;
use Illuminate\Support\Carbon;

class DoctorDashboardService
{
    /**
     * Gather all data needed for the doctor dashboard.
     *
     * @param int $doctorId
     * @return array
     */
    public function getDashboardData(int $doctorId): array
    {
        $today        = Carbon::today();
        $currentMonth = Carbon::now()->month;
        $currentYear  = Carbon::now()->year;

        // ── Today stats ──────────────────────────────────────────────────────
        $totaltodayAppointments = Appointment::where('doctor_id', $doctorId)
            ->whereDate('created_at', $today)
            ->count();

        $totaltodayhomeAppointments = Appointment::where('doctor_id', $doctorId)
            ->where('case_type', 'home_visit')
            ->whereDate('created_at', $today)
            ->count();

        // ── Monthly appointment stats ─────────────────────────────────────────
        $totalAppointments = Appointment::where('doctor_id', $doctorId)
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();

        $homeVisitAppointments = Appointment::where('doctor_id', $doctorId)
            ->where('case_type', 'home_visit')
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();

        $newAppointmentsCount = $totalAppointments;

        // ── % change vs last month ───────────────────────────────────────────
        $newAppointmentsPercentage = $this->calculatePercentageIncrease($doctorId, 'appointments');
        $homeVisitPercentage       = $this->calculatePercentageIncrease($doctorId, 'home_visits');

        // ── Income & Expense — from unified transactions table ─────────────────
        // Only APPROVED transactions count in totals
        $baseTransaction = Transaction::forUser($doctorId)
            ->approved()
            ->forMonth($currentMonth, $currentYear);

        $totalIncome  = (clone $baseTransaction)->income()->sum('amount');
        $totalExpense = (clone $baseTransaction)->expense()->sum('amount');

        // Last income/expense timestamps
        $lastIncomeTx = (clone $baseTransaction)->income()
            ->orderBy('date', 'desc')
            ->first();

        $lastIncomeTime = $lastIncomeTx
            ? Carbon::parse($lastIncomeTx->date)->format('d M Y') . ' · ' . $lastIncomeTx->description
            : 'No transactions';

        $lastExpenseTx = (clone $baseTransaction)->expense()
            ->orderBy('date', 'desc')
            ->first();

        $lastExpenseTime = $lastExpenseTx
            ? Carbon::parse($lastExpenseTx->date)->format('d M Y')
            : 'No transactions';

        // ── Billing ──────────────────────────────────────────────────────────
        $totalBills = Billing::where('doctor_id', $doctorId)
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();

        $totalBillingAmount = Billing::where('doctor_id', $doctorId)
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->sum('total_amount');

        // ── Test Bookings ────────────────────────────────────────────────────
        $totalTestBookings = TestBooking::where('doctor_id', $doctorId)
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();

        $totaltesting = $totalTestBookings;

        // ── Weekly chart data ────────────────────────────────────────────────
        $weeklyData = $this->getWeeklyAppointmentsData($doctorId);

        // ── Recent appointments (today, paginated) ───────────────────────────
        $recentAppointments = Appointment::where('doctor_id', $doctorId)
            ->with(['patient' => fn ($q) => $q->select('id', 'name')])
            ->whereDate('created_at', $today)
            ->latest()
            ->paginate(10);

        // ── Operational visits (last 5 by date) ──────────────────────────────
        $operationalVisits = Appointment::where('doctor_id', $doctorId)
            ->with('patient')
            ->orderBy('date', 'desc')
            ->limit(5)
            ->get();

        return compact(
            'totaltodayAppointments',
            'totaltodayhomeAppointments',
            'totalAppointments',
            'homeVisitAppointments',
            'newAppointmentsCount',
            'newAppointmentsPercentage',
            'homeVisitPercentage',
            'totalIncome',
            'totalExpense',
            'lastIncomeTime',
            'lastExpenseTime',
            'totalBills',
            'totalBillingAmount',
            'totalTestBookings',
            'totaltesting',
            'weeklyData',
            'recentAppointments',
            'operationalVisits'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function calculatePercentageIncrease(int $doctorId, string $type): float|int
    {
        $now          = Carbon::now();
        $currentMonth = $now->month;
        $currentYear  = $now->year;
        $prevMonth    = $now->copy()->subMonth()->month;
        $prevYear     = $now->copy()->subMonth()->year;

        $base = Appointment::where('doctor_id', $doctorId);
        if ($type === 'home_visits') {
            $base->where('case_type', 'home_visit');
        }

        $currentCount  = (clone $base)->whereMonth('created_at', $currentMonth)->whereYear('created_at', $currentYear)->count();
        $previousCount = (clone $base)->whereMonth('created_at', $prevMonth)->whereYear('created_at', $prevYear)->count();

        if ($previousCount > 0) {
            return round((($currentCount - $previousCount) / $previousCount) * 100, 1);
        }

        return $currentCount > 0 ? 100 : 0;
    }

    private function getWeeklyAppointmentsData(int $doctorId): array
    {
        $weeklyData  = [];
        $startOfWeek = Carbon::now()->startOfWeek();

        for ($i = 0; $i < 7; $i++) {
            $day  = $startOfWeek->copy()->addDays($i);
            $name = $day->format('D');
            $date = $day->format('Y-m-d');

            $weeklyData[$name] = Appointment::where('doctor_id', $doctorId)
                ->whereDate('date', $date)
                ->count();
        }

        return $weeklyData;
    }
}
