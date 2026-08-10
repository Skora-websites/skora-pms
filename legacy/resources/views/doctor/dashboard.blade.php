@extends('layouts.layout-doctor')
@section('title', 'Doctor | Dashboard')

@push('styles')
<link rel="stylesheet" href="{{ asset('assets-doctor/css/common-dashboard.css') }}">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ── Global Dashboard Tokens ──────────────────────── */
:root {
    --brand-teal:   #0b727f;
    --brand-dark:   #0c4843;
    --brand-light:  #e6f9f9;
    --brand-accent: #35ecdd;
    --success:      #16a34a;
    --danger:       #dc2626;
    --warning:      #d97706;
    --purple:       #9376c5;
    --blue:         #2563eb;
    --orange:       #ea580c;
}

/* ── Skeleton Loader ──────────────────────────────── */
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
}
@keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
.skeleton-row { height: 18px; margin: 8px 0; }

/* ── Shared Card Reset ────────────────────────────── */
.dash-card {
    border-radius: 18px;
    padding: 22px 20px;
    position: relative;
    overflow: hidden;
    transition: transform .25s ease, box-shadow .25s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    border: none;
    text-align: left;
}
.dash-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.14) !important;
}

/* ── WELCOME CARD ─────────────────────────────────── */
.card-welcome {
    background: linear-gradient(135deg, #0c4843 0%, #0b727f 50%, #0e9b8a 100%);
    color: #fff;
    box-shadow: 0 8px 30px rgba(11,114,127,0.35);
}
.card-welcome::before {
    content: '';
    position: absolute;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    top: -40px; right: -40px;
}
.card-welcome::after {
    content: '';
    position: absolute;
    width: 120px; height: 120px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    bottom: -30px; left: 20px;
}
.card-welcome h2 { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px; }
.card-welcome h4 { font-size: 17px; font-weight: 600; color: rgba(255,255,255,.9); margin-bottom: 6px; }
.card-welcome p  { font-size: 12px; color: rgba(255,255,255,.75); margin-bottom: 18px; }
.card-welcome .btn-profile {
    display: inline-block;
    background: rgba(255,255,255,0.18);
    border: 1.5px solid rgba(255,255,255,0.4);
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    padding: 8px 28px;
    border-radius: 50px;
    backdrop-filter: blur(4px);
    transition: background .2s, transform .2s;
    text-decoration: none;
    cursor: pointer;
}
.card-welcome .btn-profile:hover {
    background: rgba(255,255,255,0.28);
    transform: translateY(-2px);
    color: #fff;
}

/* ── APPOINTMENT STAT CARD ────────────────────────── */
.card-appt {
    background: #fff;
    box-shadow: 0 4px 20px rgba(11,114,127,0.10);
    border-top: 4px solid var(--brand-teal) !important;
}
.card-appt .stat-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #e6f9f9, #b2f0ee);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
    color: var(--brand-teal);
    margin-bottom: 14px;
}
.card-appt .stat-number {
    font-size: 34px;
    font-weight: 800;
    color: var(--brand-dark);
    line-height: 1;
}
.card-appt .stat-label { font-size: 13px; font-weight: 600; color: #374151; margin: 6px 0 4px; }
.card-appt .today-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: linear-gradient(90deg, #0b727f, #0e9b8a);
    color: #fff;
    font-size: 11px; font-weight: 700;
    border-radius: 20px;
    padding: 3px 10px;
}

/* ── HOME VISIT CARD ──────────────────────────────── */
.card-homevisit {
    background: #fff;
    box-shadow: 0 4px 20px rgba(124,58,237,0.10);
    border-top: 4px solid var(--purple) !important;
}
.card-homevisit .stat-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #f3e8ff, #ddd6fe);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
    color: var(--purple);
    margin-bottom: 14px;
}
.card-homevisit .stat-number { font-size: 34px; font-weight: 800; color: var(--purple); line-height: 1; }
.card-homevisit .stat-label  { font-size: 13px; font-weight: 600; color: #374151; margin: 6px 0 4px; }
.card-homevisit .today-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: linear-gradient(90deg, #9376c5, #9376c5);
    color: #fff;
    font-size: 11px; font-weight: 700;
    border-radius: 20px;
    padding: 3px 10px;
}

/* ── TREND BADGE ──────────────────────────────────── */
.trend-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 11px; font-weight: 700;
    border-radius: 20px;
    padding: 3px 9px;
}
.trend-up   { background: #dcfce7; color: #16a34a; }
.trend-down { background: #fee2e2; color: #dc2626; }

/* ── INCOME/EXPENSE CARD ─────────────────────────── */
.card-finance {
    background: #fff;
    box-shadow: 0 4px 20px rgba(22,163,74,0.10);
    border-radius: 18px;
    padding: 22px 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    border: none;
    border-left: 4px solid var(--success);
    transition: transform .25s ease, box-shadow .25s ease;
}
.card-finance:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.12) !important;
}
.card-finance .fin-block { display: flex; flex-direction: column; }
.card-finance .fin-row {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}
.card-finance .fin-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
}
.fin-income-icon { background: #dcfce7; color: var(--success); }
.fin-expense-icon { background: #fee2e2; color: var(--danger); }
.card-finance .fin-amount {
    font-size: 22px; font-weight: 800;
    color: #111827;
    letter-spacing: -.5px;
}
.card-finance .fin-amount.income { color: var(--success); }
.card-finance .fin-amount.expense { color: var(--danger); }
.card-finance .fin-label { font-size: 13px; font-weight: 700; color: #374151; }
.card-finance .fin-sub   { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.fin-divider { height: 1px; background: #f3f4f6; margin: 14px 0; }
.card-finance .progress {
    height: 5px;
    border-radius: 10px;
    background: #f3f4f6;
    margin-top: 8px;
    margin-bottom: 4px;
    overflow: hidden;
}
.eye-toggle {
    cursor: pointer;
    color: #9ca3af;
    font-size: 15px;
    transition: color .2s;
    border: none;
    background: none;
    padding: 0;
}
.eye-toggle:hover { color: var(--brand-dark); }

/* ── STAT ROW CARDS (Total Appts, Bills, Tests, Inv) ─ */
.card-stat {
    border-radius: 16px;
    padding: 20px 18px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    overflow: hidden;
    border: none;
    transition: transform .25s ease, box-shadow .25s ease;
    text-decoration: none;
}
.card-stat:hover { transform: translateY(-5px); }
.card-stat .cs-icon {
    width: 50px; height: 50px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    margin-bottom: 14px;
}
.card-stat .cs-number {
    font-size: 36px; font-weight: 800; line-height: 1;
}
.card-stat .cs-title  { font-size: 13px; font-weight: 600; margin: 6px 0 2px; }
.card-stat .cs-sub    { font-size: 11px; opacity: .7; }
.card-stat::after {
    content: '';
    position: absolute;
    width: 100px; height: 100px;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
    bottom: -30px; right: -20px;
}
/* Appointments stat – teal */
.cs-teal   { background: linear-gradient(135deg,#0b727f,#0e9b8a); color:#fff; box-shadow: 0 8px 24px rgba(11,114,127,0.3); }
.cs-teal   .cs-icon { background: rgba(255,255,255,0.2); color: #fff; }
/* Bills stat – green */
.cs-green  { background: linear-gradient(135deg,#16a34a,#22c55e); color:#fff; box-shadow: 0 8px 24px rgba(22,163,74,0.3); }
.cs-green  .cs-icon { background: rgba(255,255,255,0.2); color: #fff; }
/* Tests stat – amber */
.cs-amber  { background: linear-gradient(135deg,#d97706,#f59e0b); color:#fff; box-shadow: 0 8px 24px rgba(217,119,6,0.3); }
.cs-amber  .cs-icon { background: rgba(255,255,255,0.2); color: #fff; }
/* Inventory stat – cyan */
.cs-cyan   { background: linear-gradient(135deg,#0e7490,#06b6d4); color:#fff; box-shadow: 0 8px 24px rgba(14,116,144,0.3); }
.cs-cyan   .cs-icon { background: rgba(255,255,255,0.2); color: #fff; }

/* ── CHART CARD ──────────────────────────────────── */
.card-chart {
    background: #fff;
    border-radius: 18px;
    padding: 22px 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
    height: 100%;
}
.card-chart .chart-container {
    position: relative;
    height: 230px;
    margin-top: 16px;
    background: linear-gradient(135deg, #f0fdfc 0%, #e6f9f9 100%);
    border-radius: 12px;
    padding: 10px;
    animation: none;
}
.card-chart .chart-container canvas {
    background: transparent;
    border-radius: 8px;
}

/* ── TABLE CARD ──────────────────────────────────── */
.table-card {
    background: #fff;
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
}
.table-card .table thead th {
    background: linear-gradient(90deg, var(--brand-dark) 0%, var(--brand-teal) 100%);
    color: #fff;
    font-weight: 600;
    border: none;
    font-size: 13px;
    letter-spacing: .4px;
    padding: 12px 14px;
}
.table-card .table tbody tr {
    transition: background .15s;
    cursor: pointer;
}
.table-card .table tbody tr:hover { background: var(--brand-light); }
.table-card .table td { vertical-align: middle; font-size: 13px; padding: 11px 14px; }

/* ── Section header ──────────────────────────────── */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}
.section-header h5 {
    font-size: 15px;
    font-weight: 700;
    color: var(--brand-dark);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* ── Link card wrapper ───────────────────────────── */
.btn-link-card { text-decoration: none; display: block; height: 100%; }

/* ── Misc ────────────────────────────────────────── */
a.row-link { color: inherit; text-decoration: none; }
</style>
@endpush

@section('content')
<div class="main-wrapper">
    <div class="page-wrapper">

        {{-- ── Banner ──────────────────────────────────────────────── --}}
        <img src="{{ asset('assets-doctor/img/banner.png') }}"
             alt="Dashboard Banner"
             loading="eager"
             width="1200" height="240"
             style="width:100%;height:220px;object-fit:cover;border-radius:4px 6px 4px 4px;">

        <div class="content pb-0">
            <div class="row" style="margin:-90px 0 0;">

                {{-- ── Welcome Card ────────────────────────────────── --}}
                <div class="col-md-6 ps-1 pe-1 mb-3">
                    <div class="dash-card card-welcome">
                        <div class="d-flex align-items-center gap-3 mb-2">
                            <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <img src="{{ asset('assets-doctor/img/dashboard-dk.png') }}" alt="user" width="32" height="36" style="filter:brightness(10);">
                            </div>
                            <div>
                                <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:500;letter-spacing:.5px;text-transform:uppercase;">Welcome Back 👋</div>
                                <h2 style="margin:0;">Hello!</h2>
                            </div>
                        </div>
                        <h4 style="margin-bottom:4px;">{{ Auth::user()->role === 'doctor' ? 'Dr.' : '' }} {{ Auth::user()->name }}</h4>
                        <p><i class="ti ti-calendar-check me-1"></i>Today: <strong style="color:#fff;">{{ now()->format('l, d M Y') }}</strong></p>
                        <div style="margin-top:auto;">
                            <a href="{{ route('doctor.profile') }}" class="btn-profile"><i class="ti ti-user me-1"></i>View Profile</a>
                        </div>
                    </div>
                </div>

                {{-- ── New Appointments stat card ──────────────────── --}}
                @can('dashboard-appointments-view')
                <div class="col-md-3 ps-1 pe-1 mb-3">
                    <a href="{{ route('doctors.appointment') }}" class="btn-link-card" title="View Appointments">
                        <div class="dash-card card-appt">
                            @php
                                $aptTrend = $newAppointmentsPercentage;
                                $aptIcon  = $aptTrend >= 0 ? '↑' : '↓';
                            @endphp
                            <div class="d-flex justify-content-between align-items-start w-100">
                                <div class="stat-icon"><i class="ti ti-calendar-stats"></i></div>
                                <span class="trend-badge {{ $aptTrend >= 0 ? 'trend-up' : 'trend-down' }}">
                                    {{ $aptIcon }} {{ abs($aptTrend) }}%
                                </span>
                            </div>
                            <div class="stat-number">{{ $newAppointmentsCount }}</div>
                            <div class="stat-label">New Appointments</div>
                            <span class="today-badge"><i class="ti ti-sun me-1" style="font-size:10px;"></i>Today: {{ $totaltodayAppointments }}</span>
                            <div style="font-size:11px;color:#6b7280;margin-top:8px;">This month</div>
                        </div>
                    </a>
                </div>
                @endcan

                {{-- ── Home Visit stat card ────────────────────────── --}}
                @can('dashboard-home-visit-view')
                <div class="col-md-3 ps-1 pe-1 mb-3">
                    <a href="{{ route('doctor-home-visit') }}" class="btn-link-card" title="View Home Visits">
                        <div class="dash-card card-homevisit">
                            @php
                                $hvTrend = $homeVisitPercentage;
                                $hvIcon  = $hvTrend >= 0 ? '↑' : '↓';
                            @endphp
                            <div class="d-flex justify-content-between align-items-start w-100">
                                <div class="stat-icon"><i class="ti ti-home-heart"></i></div>
                                <span class="trend-badge {{ $hvTrend >= 0 ? 'trend-up' : 'trend-down' }}">
                                    {{ $hvIcon }} {{ abs($hvTrend) }}%
                                </span>
                            </div>
                            <div class="stat-number">{{ $homeVisitAppointments }}</div>
                            <div class="stat-label">Home Visit</div>
                            <span class="today-badge"><i class="ti ti-home me-1" style="font-size:10px;"></i>Today: {{ $totaltodayhomeAppointments }}</span>
                            <div style="font-size:11px;color:#6b7280;margin-top:8px;">This month</div>
                        </div>
                    </a>
                </div>
                @endcan

                {{-- ────────────────────────────────────────────────────────
                     ROW 2 — Chart + Income/Expense
                ─────────────────────────────────────────────────────────── --}}
                <div class="row mt-3 w-100 mx-0">
                    <div class="col-md-8 ps-1 pe-1 mb-3">
                        <div class="card-chart">
                            <div class="section-header w-100">
                                <h5><i class="ti ti-chart-line"></i> Weekly Appointments</h5>
                                <span style="font-size:12px;font-weight:600;background:#e6f9f9;color:var(--brand-teal);padding:3px 10px;border-radius:20px;">{{ array_sum($weeklyData) }} this week</span>
                            </div>
                            <div class="chart-container">
                                @can('dashboard-appointments-view')
                                <canvas id="appointmentChart"></canvas>
                                @endcan
                            </div>
                        </div>   
                    </div>
                   

                    @can('income-expense') 
                    <div class="col-md-4 ps-1 pe-1 mb-3">
                        <a href="{{ route('doctor.income-expence') }}" class="btn-link-card" style="text-decoration:none;">
                        <div class="card-finance">

                            {{-- Income Block --}}
                            @can('dashboard-income-view')
                            <div class="fin-block">
                                <div class="fin-row">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="fin-icon fin-income-icon"><i class="ti ti-trending-up"></i></div>
                                        <div>
                                            <div class="fin-label">Total Income</div>
                                            <div class="fin-sub">{{ $lastIncomeTime }} · {{ $totalBills }} bills</div>
                                        </div>
                                    </div>
                                    <button class="eye-toggle" id="incomeToggle" onclick="event.preventDefault();toggleAmount('incomeAmount', this)" title="Toggle visibility">
                                        <i class="ti ti-eye" id="incomeIcon"></i>
                                    </button>
                                </div>
                                <div class="fin-amount income">₹<span id="incomeAmount">****</span></div>
                                @php $billedPct = $totalAppointments > 0 ? round(($totalBills / $totalAppointments) * 100) : 0; @endphp
                                <div class="d-flex justify-content-between" style="font-size:11px;color:#6b7280;margin-top:10px;">
                                    <span>Billing Rate</span><span>{{ $billedPct }}%</span>
                                </div>
                                <div class="progress"><div class="progress-bar bg-success" style="width:{{ $billedPct }}%;"></div></div>
                            </div>
                            @endcan

                            <div class="fin-divider"></div>

                            {{-- Expense Block --}}
                            @can('dashboard-expense-view')
                            <div class="fin-block">
                                <div class="fin-row">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="fin-icon fin-expense-icon"><i class="ti ti-trending-down"></i></div>
                                        <div>
                                            <div class="fin-label">Total Expense</div>
                                            <div class="fin-sub">{{ $lastExpenseTime }} · Monthly</div>
                                        </div>
                                    </div>
                                    <button class="eye-toggle" id="expenseToggle" onclick="event.preventDefault();toggleAmount('expenseAmount', this)" title="Toggle visibility">
                                        <i class="ti ti-eye" id="expenseIcon"></i>
                                    </button>
                                </div>
                                <div class="fin-amount expense">₹<span id="expenseAmount">****</span></div>
                                @php $spentPct = $totalIncome > 0 ? min(round(($totalExpense / $totalIncome) * 100), 100) : 0; @endphp
                                <div class="d-flex justify-content-between" style="font-size:11px;color:#6b7280;margin-top:10px;">
                                    <span>Spent of Income</span><span>{{ $spentPct }}%</span>
                                </div>
                                <div class="progress"><div class="progress-bar bg-danger" style="width:{{ $spentPct }}%;"></div></div>
                            </div>
                            @endcan
                        </div>
                        </a>
                    </div>
                    @endcan

                </div>

                {{-- ────────────────────────────────────────────────────────
                     ROW 3 — Quick Stats (Appointments · Billing · Test · Inventory)
                ─────────────────────────────────────────────────────────── --}}
                <div class="row mt-2 w-100 mx-0">

                    {{-- Total Appointments --}}
                    @can('appointments')
                    <div class="col-md-3 ps-1 pe-1 mb-3">
                        <a href="{{ route('doctors.appointment') }}" class="btn-link-card">
                            <div class="card-stat cs-teal">
                                <div class="cs-icon"><i class="ti ti-users"></i></div>
                                <div class="cs-number">{{ $totalAppointments }}</div>
                                <div class="cs-title">Total Appointments</div>
                                <div class="cs-sub">Active this month</div>
                            </div>
                        </a>
                    </div>
                    @endcan

                    {{-- Total Billing --}}
                    @can('billing')
                    <div class="col-md-3 ps-1 pe-1 mb-3">
                        <a href="{{ route('doctor-billing') }}" class="btn-link-card">
                            <div class="card-stat cs-green">
                                <div class="cs-icon"><i class="ti ti-receipt"></i></div>
                                <div class="cs-number">{{ $totalBills }}</div>
                                <div class="cs-title">Total Bills</div>
                                <div class="cs-sub">₹{{ number_format($totalBillingAmount) }} generated</div>
                            </div>
                        </a>
                    </div>
                    @endcan

                    {{-- Test Booking --}}
                    @can('test-booking')
                    <div class="col-md-3 ps-1 pe-1 mb-3">
                        <a href="{{ route('doctor-test-booking') }}" class="btn-link-card">
                            <div class="card-stat cs-amber">
                                <div class="cs-icon"><i class="ti ti-flask"></i></div>
                                <div class="cs-number">{{ $totalTestBookings }}</div>
                                <div class="cs-title">Test Bookings</div>
                                @php $testPct = $totalAppointments > 0 ? min(($totalTestBookings / $totalAppointments) * 100, 100) : 0; @endphp
                                <div class="cs-sub">{{ round($testPct) }}% of appointments</div>
                                <div style="height:4px;border-radius:4px;background:rgba(255,255,255,0.3);margin-top:10px;width:100%;overflow:hidden;">
                                    <div style="height:100%;width:{{ $testPct }}%;background:rgba(255,255,255,0.7);border-radius:4px;"></div>
                                </div>
                            </div>
                        </a>
                    </div>
                    @endcan

                    {{-- Inventory --}}
                    <div class="col-md-3 ps-1 pe-1 mb-3">
                        <a href="{{ route('doctors.shoping') }}" class="btn-link-card">
                            <div class="card-stat cs-cyan">
                                <div class="cs-icon"><i class="ti ti-box"></i></div>
                                <div class="cs-number" style="font-size:22px;">Soon</div>
                                <div class="cs-title">Inventory</div>
                                <div class="cs-sub">Coming Soon</div>
                                <div style="height:4px;border-radius:4px;background:rgba(255,255,255,0.3);margin-top:10px;width:100%;overflow:hidden;">
                                    <div style="height:100%;width:80%;background:rgba(255,255,255,0.7);border-radius:4px;"></div>
                                </div>
                            </div>
                        </a>
                    </div>

                </div>

                {{-- ────────────────────────────────────────────────────────
                     ROW 4 — Recent Appointments Table
                ─────────────────────────────────────────────────────────── --}}
                @can('appointments')
                <div class="mt-3 mb-4 w-100">
                    <div class="table-card">
                        <div class="section-header">
                            <h5><i class="ti ti-clock-hour-4" style="color:var(--brand-teal);"></i> Recent Appointments</h5>
                            <a href="{{ route('doctors.appointment') }}" class="btn btn-sm" style="background:var(--brand-light);color:var(--brand-teal);font-weight:600;border-radius:20px;font-size:12px;">
                                View All <i class="ti ti-arrow-right ms-1"></i>
                            </a>
                        </div>

                        {{-- Skeleton (shown instantly, hidden after table loads) --}}
                        <div id="tableSkeleton">
                            @for($s = 0; $s < 5; $s++)
                            <div class="d-flex gap-3 mb-2">
                                <div class="skeleton skeleton-row" style="width:4%;"></div>
                                <div class="skeleton skeleton-row" style="width:18%;"></div>
                                <div class="skeleton skeleton-row" style="width:20%;"></div>
                                <div class="skeleton skeleton-row" style="width:12%;"></div>
                                <div class="skeleton skeleton-row" style="width:10%;"></div>
                                <div class="skeleton skeleton-row" style="width:14%;"></div>
                                <div class="skeleton skeleton-row" style="width:8%;"></div>
                            </div>
                            @endfor
                        </div>

                        <div class="table-responsive" id="tableContent" style="display:none;">
                            <table class="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Date &amp; Time</th>
                                        <th>Patient</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Consult</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @forelse($recentAppointments as $index => $visit)
                                    <tr onclick="window.location='{{ url('/doctor-consultation') }}/{{ $visit->id }}'" style="cursor:pointer;">
                                        <td>{{ $recentAppointments->firstItem() + $index }}</td>
                                        <td>
                                            <div>{{ \Carbon\Carbon::parse($visit->date)->format('d M Y') }}</div>
                                            <small class="text-muted">{{ \Carbon\Carbon::parse($visit->time)->format('g:i A') }}</small>
                                        </td>
                                        <td>
                                            <div class="fw-bold">{{ $visit->patient->name ?? '—' }}</div>
                                            <small class="text-muted">ID: #{{ $visit->patient_id }}</small>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary text-white">
                                                {{ ucfirst(str_replace('_', ' ', $visit->case_type)) }}
                                            </span>
                                        </td>
                                        <td>
                                            @php
                                                $statusClass = match($visit->status) {
                                                    'pending'   => 'bg-warning text-dark',
                                                    'confirmed' => 'bg-info text-white',
                                                    'completed' => 'bg-success text-white',
                                                    'cancelled' => 'bg-danger text-white',
                                                    default     => 'bg-secondary text-white',
                                                };
                                            @endphp
                                            <span class="badge {{ $statusClass }}">{{ ucfirst($visit->status) }}</span>
                                        </td>
                                        <td>
                                            <a href="{{ url('/doctor-consultation') }}/{{ $visit->id }}"
                                               class="btn btn-sm btn-outline-primary"
                                               onclick="event.stopPropagation()">
                                                Consult
                                            </a>
                                        </td>
                                        <td>
                                            <button type="button"
                                                    class="btn btn-sm btn-outline-secondary view-appointment-btn"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#appointmentModal"
                                                    data-appointment-id="{{ $visit->id }}"
                                                    onclick="event.stopPropagation()"
                                                    title="View Details">
                                                <i class="ti ti-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    @empty
                                    <tr>
                                        <td colspan="7" class="text-center py-5">
                                            <i class="ti ti-calendar-off" style="font-size:48px;color:#dee2e6;"></i>
                                            <p class="mt-3 text-muted fw-medium">No appointments today</p>
                                            <a href="{{ route('book-appointment') }}" class="btn btn-primary btn-sm mt-1">
                                                <i class="ti ti-plus me-1"></i> Book Appointment
                                            </a>
                                        </td>
                                    </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>

                        {{-- Pagination info --}}
                        @if($recentAppointments->count() > 0)
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                            <small class="text-muted">
                                Showing {{ $recentAppointments->firstItem() }}–{{ $recentAppointments->lastItem() }}
                                of {{ $recentAppointments->total() }} today
                            </small>
                            <a href="{{ route('doctors.appointment') }}" class="text-primary" style="font-size:13px;">
                                All appointments →
                            </a>
                        </div>
                        @endif
                    </div>
                </div>
                @endcan

            </div>{{-- /row --}}
        </div>{{-- /content --}}
    </div>{{-- /page-wrapper --}}
</div>{{-- /main-wrapper --}}

{{-- ── Appointment Details Modal ───────────────────────────────────────── --}}
<div class="modal fade" id="appointmentModal" tabindex="-1" aria-labelledby="appointmentModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="appointmentModalLabel">
                    <i class="ti ti-calendar-event me-2"></i>Appointment Details
                </h5>
                <button type="button" class="btn-close rounded-circle shadow bg-white me-2"
                        data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="row g-4" id="appointment-content">
                    <div class="col-12 text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-3 text-muted">Loading details...</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

@push('scripts')
{{-- Chart.js loaded only when needed (deferred) --}}
<script>
// ── Toggle skeleton → table instantly ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('tableSkeleton').style.display = 'none';
    var tc = document.getElementById('tableContent');
    if (tc) tc.style.display = 'block';
});

// ── Income / Expense visibility toggle ───────────────────────────────────
const _income  = {{ $totalIncome  ?? 0 }};
const _expense = {{ $totalExpense ?? 0 }};
let amountTimers = {};

function toggleAmount(id, btnOrIcon) {
    const el = document.getElementById(id);
    if (!el) return;
    // Support both: button element (new design) or direct icon element (legacy)
    const iconEl = (btnOrIcon.tagName === 'BUTTON') ? btnOrIcon.querySelector('i') : btnOrIcon;
    if (el.textContent === '****') {
        el.textContent = (id === 'incomeAmount')
            ? _income.toLocaleString('en-IN')
            : _expense.toLocaleString('en-IN');
        if (iconEl) { iconEl.classList.remove('ti-eye'); iconEl.classList.add('ti-eye-off'); }
        
        // Clear existing timer if any
        if (amountTimers[id]) clearTimeout(amountTimers[id]);
        
        // Auto-hide after 5 seconds
        amountTimers[id] = setTimeout(() => {
            el.textContent = '****';
            if (iconEl) { iconEl.classList.remove('ti-eye-off'); iconEl.classList.add('ti-eye'); }
            delete amountTimers[id];
        }, 5000);
    } else {
        el.textContent = '****';
        if (iconEl) { iconEl.classList.remove('ti-eye-off'); iconEl.classList.add('ti-eye'); }
        if (amountTimers[id]) {
            clearTimeout(amountTimers[id]);
            delete amountTimers[id];
        }
    }
}

// ── Appointment detail modal ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('appointmentModal');
    if (!modal) return;

    modal.addEventListener('show.bs.modal', function (event) {
        const btn  = event.relatedTarget;
        const id   = btn.getAttribute('data-appointment-id');
        const area = document.getElementById('appointment-content');

        area.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3 text-muted">Loading details...</p>
            </div>`;

        fetch('{{ url("show-detail-appointment") }}/' + id)
            .then(r => { if (!r.ok) throw new Error('Network error'); return r.json(); })
            .then(data => {
                const statusColor = { completed: 'success', cancelled: 'danger', confirmed: 'info', pending: 'warning' };
                area.innerHTML = `
                    <div class="col-md-6">
                        <h6 class="fw-bold mb-3 border-bottom pb-2"><i class="ti ti-user me-1"></i>Patient Information</h6>
                        <p><strong>Name:</strong> ${data.patient?.name || '—'}</p>
                        <p><strong>Patient ID:</strong> #${data.patient_id || '—'}</p>
                        <p><strong>Contact:</strong> ${data.patient?.phone || data.patient?.mobile || 'Not available'}</p>
                        <p><strong>Age / Gender:</strong> ${data.patient?.age || '—'} / ${data.patient?.gender || '—'}</p>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold mb-3 border-bottom pb-2"><i class="ti ti-calendar me-1"></i>Appointment Information</h6>
                        <p><strong>Date:</strong> ${data.date ? new Date(data.date).toLocaleDateString('en-IN') : '—'}</p>
                        <p><strong>Time:</strong> ${data.time || '—'}</p>
                        <p><strong>Type:</strong> <span class="badge bg-primary">${(data.case_type || '').replace('_',' ').toUpperCase()}</span></p>
                        <p><strong>Status:</strong> <span class="badge bg-${statusColor[data.status] || 'secondary'}">${(data.status || '').toUpperCase()}</span></p>
                    </div>
                    <div class="col-12 mt-3">
                        <h6 class="fw-bold mb-3 border-bottom pb-2"><i class="ti ti-stethoscope me-1"></i>Vital Signs</h6>
                        <div class="row g-3">
                            <div class="col-md-3"><strong>Blood Pressure:</strong><br>${data.bp || '—'}</div>
                            <div class="col-md-3"><strong>Weight:</strong><br>${data.weight ? data.weight+' kg' : '—'}</div>
                            <div class="col-md-3"><strong>Height:</strong><br>${data.height ? data.height+' cm' : '—'}</div>
                            <div class="col-md-3"><strong>Blood Group:</strong><br>${data.blood_group || '—'}</div>
                        </div>
                    </div>
                    <div class="col-12 mt-3">
                        <h6 class="fw-bold mb-3 border-bottom pb-2"><i class="ti ti-notes me-1"></i>Remarks &amp; Notes</h6>
                        <p class="bg-light p-3 rounded mb-2">${data.remarks || 'No remarks'}</p>
                        <p class="bg-light p-3 rounded"><strong>Note:</strong> ${data.note || '—'}</p>
                    </div>
                    ${data.consent_file ? `
                    <div class="col-12 mt-2">
                        <a href="${data.consent_file}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="ti ti-file-download me-1"></i>View Consent File
                        </a>
                    </div>` : ''}
                `;
            })
            .catch(() => {
                area.innerHTML = `<div class="col-12"><div class="alert alert-danger"><strong>Error:</strong> Could not load details. Please try again.</div></div>`;
            });
    });
});
</script>

{{-- Deferred Chart.js — loads after page is interactive --}}
<script>
(function () {
    const chartEl = document.getElementById('appointmentChart');
    if (!chartEl) return;

    const weeklyData   = @json(array_values($weeklyData));
    const weeklyLabels = @json(array_keys($weeklyData));

    function initChart() {
        new Chart(chartEl, {
            type: 'line',
            data: {
                labels: weeklyLabels,
                datasets: [{
                    label: 'Appointments',
                    data: weeklyData,
                    fill: true,
                    backgroundColor: 'rgba(11,114,127,0.12)',
                    borderColor: '#0c4843',
                    borderWidth: 2.5,
                    tension: 0.45,
                    pointRadius: 5,
                    pointBackgroundColor: '#0e8379',
                    pointHoverRadius: 7,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                animation: { duration: 800, easing: 'easeInOutQuart' }
            }
        });
    }

    // Load Chart.js only when the browser is idle / after main thread
    if ('requestIdleCallback' in window) {
        requestIdleCallback(function () {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            s.onload = initChart;
            document.body.appendChild(s);
        });
    } else {
        window.addEventListener('load', function () {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            s.onload = initChart;
            document.body.appendChild(s);
        });
    }
})();
</script>
@endpush
@endsection
