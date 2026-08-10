@extends('layouts.layout-doctor')
@section('title', 'Doctor || Patient Details')
@section('content')
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #1d4ed8, #2563eb);
            --info-gradient: linear-gradient(135deg, #0891b2, #06b6d4);
            --success-gradient: linear-gradient(135deg, #059669, #10b981);
            --warning-gradient: linear-gradient(135deg, #d97706, #f59e0b);
            --danger-gradient: linear-gradient(135deg, #dc2626, #ef4444);
            --purple-gradient: linear-gradient(135deg, #7c3aed, #8b5cf6);
            --glass-bg: rgba(255, 255, 255, 0.95);
            --border-radius-lg: 12px;
            --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .page-wrapper { background-color: #f8fafc; }
        .content { padding: 25px; }

        /* Premium Header Card */
        .patient-profile-card {
            border: none;
            border-radius: var(--border-radius-lg);
            box-shadow: var(--card-shadow);
            overflow: hidden;
            background: #fff;
            margin-bottom: 25px;
        }
        .patient-avatar-container {
            position: relative;
            padding: 20px;
        }
        .patient-avatar {
            width: 130px;
            height: 130px;
            border-radius: 12px;
            object-fit: cover;
            border: 4px solid #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .contact-btn-group .btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        .contact-btn-group .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }

        /* Modern Stats Grid */
        .stat-card {
            border: none;
            border-radius: 12px;
            padding: 1.25rem;
            background: #fff;
            box-shadow: var(--card-shadow);
            transition: transform 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 4px; height: 100%;
        }
        .stat-total::before { background: var(--primary-gradient); }
        .stat-confirmed::before { background: var(--success-gradient); }
        .stat-completed::before { background: var(--info-gradient); }
        .stat-pending::before { background: var(--warning-gradient); }
        .stat-cancelled::before { background: var(--danger-gradient); }
        .stat-home::before { background: var(--purple-gradient); }

        .stat-number { font-size: 1.75rem; font-weight: 700; margin-bottom: 2px; }
        .stat-label { font-size: 0.85rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Tables & Sections */
        .section-card {
            border: none;
            border-radius: 12px;
            box-shadow: var(--card-shadow);
            background: #fff;
            margin-bottom: 25px;
        }
        .section-header {
            padding: 18px 24px;
            border-bottom: 1px solid #f1f5f9;
            background: transparent;
        }
        .table thead { background: #f8fafc; }
        .table thead th { 
            font-size: 11px; font-weight: 700; text-transform: uppercase; 
            color: #64748b; border-bottom: none; padding: 15px 25px;
        }
        .table td { padding: 16px 25px; vertical-align: middle; border-bottom-color: #f1f5f9; }
        .table th:first-child, .table td:first-child { padding-left: 30px; }
        .table th:last-child, .table td:last-child { padding-right: 30px; }
        
        /* Modal Aesthetics */
        .modal-content { border: none; border-radius: 16px; overflow: hidden; }
        .modal-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 20px 24px; }
        .modal-title { font-weight: 700; color: #1e293b; }
        .detail-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
        .detail-value { font-size: 0.95rem; color: #1e293b; font-weight: 500; }
        .prescription-table thead { background: #f1f5f9; }
        .medicine-badge { 
            padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 11px;
            background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe;
        }

        /* Status & Case Badges */
        .badge-soft-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 11px; }
        .badge-soft-info { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 11px; }
        .badge-soft-warning { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 11px; }
        .badge-soft-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 11px; }
        
        .case-type-badge {
            background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; font-size: 10px;
            font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 20px;
            display: inline-block;
        }

        /* Action Buttons */
        .btn-view-details {
            padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 8px;
            color: #2563eb; border: 1.5px solid #dbeafe; background: #fff;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.05);
        }
        .btn-view-details:hover {
            background: #2563eb; color: #fff; border-color: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(37, 99, 235, 0.15);
        }
        .italic { font-style: italic; opacity: 0.7; }
        
        /* Solid Tabs styling for clinical history */
        .nav-tabs-solid {
            background-color: #f1f5f9;
            padding: 4px;
            border-radius: 8px;
        }
        .nav-tabs-solid .nav-link {
            border: none;
            color: #64748b;
            font-weight: 600;
            padding: 8px 16px;
            transition: all 0.2s ease;
        }
        .nav-tabs-solid .nav-link.active {
            background-color: #fff;
            color: #2563eb !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }
        .timeline-container {
            position: relative;
            padding-left: 10px;
        }
    </style>

    <div class="main-wrapper">
        <div class="page-wrapper">
            <div class="content">
                <!-- Main Header -->
                <div class="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h4 class="fw-bold mb-1">Patient Overview</h4>
                        <p class="text-muted small mb-0">Detailed medical profile and appointment history</p>
                    </div>
                </div>

                <!-- Patient Profile Card -->
                <div class="card patient-profile-card">
                    <div class="row g-0">
                        <div class="col-xl-9 col-lg-8">
                            <div class="d-sm-flex align-items-center p-4">
                                @php
                                    $profileImage = $patient->profile_photo_path
                                        ? asset($patient->profile_photo_path)
                                        : ($patient->profile_image
                                            ? asset($patient->profile_image)
                                            : asset('assets-doctor/img/profiles/avatar-01.jpg'));
                                @endphp

                                <div class="me-4 position-relative">
                                    <img src="{{ $profileImage }}" class="patient-avatar">
                                </div>

                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <h4 class="mb-0 fw-bold">{{ $patient->name }}</h4>
                                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                                            {{ $patient->registration_id ?? 'N/A' }}
                                        </span>
                                    </div>
                                    <p class="text-muted mb-2"><i class="ti ti-map-pin me-1"></i> {{ $patient->address ?? 'No address provided' }}</p>

                                    <div class="d-flex flex-wrap gap-4 mt-3">
                                        <div class="info-group">
                                            <div class="detail-label">Contact</div>
                                            <div class="detail-value">{{ $patient->phone ?? 'N/A' }}</div>
                                        </div>
                                        <div class="info-group">
                                            <div class="detail-label">Gender / DOB</div>
                                            <div class="detail-value">
                                                {{ ucfirst($patient->gender ?? 'N/A') }} • 
                                                @if ($patient->dob)
                                                    {{ \Carbon\Carbon::parse($patient->dob)->format('d M Y') }}
                                                @else
                                                    N/A
                                                @endif
                                            </div>
                                        </div>
                                        <div class="info-group">
                                            <div class="detail-label">Last Visit</div>
                                            <div class="detail-value text-primary font-bold">
                                                {{ $latestAppointment ? \Carbon\Carbon::parse($latestAppointment->date)->format('d M Y') : 'N/A' }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-xl-3 col-lg-4 border-start d-flex align-items-center justify-content-center p-4">
                            <div class="text-center w-100">
                                <div class="contact-btn-group mb-3">
                                    <a href="tel:{{ $patient->phone }}" class="btn btn-outline-primary"><i class="ti ti-phone"></i></a>
                                    <a href="https://wa.me/{{ $patient->phone }}" target="_blank" class="btn btn-outline-success mx-2"><i class="ti ti-brand-whatsapp"></i></a>
                                    <a href="mailto:{{ $patient->email }}" class="btn btn-outline-info"><i class="ti ti-mail"></i></a>
                                </div>
                                @can('appointments-create')
                                <a href="{{ route('book-appointment') }}" class="btn btn-primary w-100 py-2 fw-bold">
                                    <i class="ti ti-calendar-plus me-1"></i> Book Appointment
                                </a>
                                @endcan
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Clinical Summary Grid (Instant Overview) -->
                @php
                    $latestConsultation = \App\Models\Consultation::where('patient_id', $patient->id)->latest()->first();
                @endphp
                @if($latestConsultation)
                <div class="card section-card bg-primary-subtle border-0 mb-4">
                    <div class="card-body">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <h6 class="fw-bold mb-0 text-primary"><i class="ti ti-activity me-1"></i> Most Recent Clinical Summary</h6>
                            <span class="text-muted small">Updated: {{ \Carbon\Carbon::parse($latestConsultation->consultation_date)->format('d M Y') }}</span>
                        </div>
                        <div class="row g-3">
                            <div class="col-md-4">
                                <div class="detail-label">Diagnosis</div>
                                <div class="detail-value text-dark fw-bold">{{ $latestConsultation->diagnosis_note ?: 'No diagnosis recorded' }}</div>
                            </div>
                            <div class="col-md-8">
                                <div class="detail-label">Core Medication Plan</div>
                                <div class="detail-value text-dark">
                                    @foreach($latestConsultation->medications->take(3) as $med)
                                        <span class="badge bg-white text-primary border me-1">{{ $med->medicine_name }} ({{ $med->dose }})</span>
                                    @endforeach
                                    @if($latestConsultation->medications->count() > 3)
                                        <span class="text-muted small">+ {{ $latestConsultation->medications->count() - 3 }} more</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                @endif

                <!-- Modern Stats Cards -->
                <div class="row g-4 mb-4">
                    <div class="col-xl-2 col-md-4 col-6">
                        <div class="stat-card stat-total">
                            <div class="stat-number">{{ $appointmentStats['total'] ?? 0 }}</div>
                            <div class="stat-label">Total Logs</div>
                        </div>
                    </div>
                    <div class="col-xl-2 col-md-4 col-6">
                        <div class="stat-card stat-confirmed">
                            <div class="stat-number text-success">{{ $appointmentStats['confirmed'] ?? 0 }}</div>
                            <div class="stat-label">Confirmed</div>
                        </div>
                    </div>
                    <div class="col-xl-2 col-md-4 col-6">
                        <div class="stat-card stat-completed">
                            <div class="stat-number text-info">{{ $appointmentStats['completed'] ?? 0 }}</div>
                            <div class="stat-label">Completed</div>
                        </div>
                    </div>
                    <div class="col-xl-2 col-md-4 col-6">
                        <div class="stat-card stat-pending">
                            <div class="stat-number text-warning">{{ $appointmentStats['pending'] ?? 0 }}</div>
                            <div class="stat-label">Pending</div>
                        </div>
                    </div>
                    <div class="col-xl-2 col-md-4 col-6">
                        <div class="stat-card stat-cancelled">
                            <div class="stat-number text-danger">{{ $appointmentStats['cancelled'] ?? 0 }}</div>
                            <div class="stat-label">Cancelled</div>
                        </div>
                    </div>
                    <div class="col-xl-2 col-md-4 col-6">
                        <div class="stat-card stat-home">
                            <div class="stat-number text-purple">{{ $homeVisits->count() ?? 0 }}</div>
                            <div class="stat-label">Home Visits</div>
                        </div>
                    </div>
                </div>

                <div class="row" style="padding-right: 10px; padding-left: 10px;">
                    <!-- Recent Appointments -->
                    <div class="col-lg-12">
                        <div class="card section-card">
                            <div class="section-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0 fw-bold"><i class="ti ti-history me-2 text-primary"></i> Recent Appointments</h5>
                            </div>
                            <div class="card-body p-0">
                                @if ($recentAppointments->count() > 0)
                                    <div class="table-responsive">
                                        <table class="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Date & Time</th>
                                                    <th>Status</th>
                                                    <th>Case Type</th>
                                                    <th>Consent</th>
                                                    <th>Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach ($recentAppointments as $app)
                                                    <tr>
                                                        <td>
                                                            <div class="fw-bold">{{ \Carbon\Carbon::parse($app->date)->format('d M Y') }}</div>
                                                            <div class="text-muted small">{{ $app->time }}</div>
                                                        </td>
                                                        <td>
                                                            @if ($app->status == 'confirmed')
                                                                <span class="badge-soft-success">Confirmed</span>
                                                            @elseif($app->status == 'completed')
                                                                <span class="badge-soft-info">Completed</span>
                                                            @elseif($app->status == 'cancelled')
                                                                <span class="badge-soft-danger">Cancelled</span>
                                                            @else
                                                                <span class="badge-soft-warning">Pending</span>
                                                            @endif
                                                        </td>
                                                         <td>
                                                            <span class="case-type-badge">
                                                                {{ str_replace('_', ' ', $app->case_type ?? 'N/A') }}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            @php
                                                                $consentPath = $app->consent_file ?: ($app->consultConsent ? $app->consultConsent->consent_file : null);
                                                            @endphp
                                                            @if($consentPath)
                                                                <a href="{{ asset('storage/' . $consentPath) }}" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2 fs-11 fw-bold">
                                                                    <i class="ti ti-file-certificate me-1"></i> PDF
                                                                </a>
                                                            @else
                                                                <span class="text-muted small italic">N/A</span>
                                                            @endif
                                                        </td>
                                                         <td>
                                                            @if($app->status == 'completed')
                                                                <button class="btn btn-view-details view-consult-btn" 
                                                                        data-id="{{ $app->id }}">
                                                                    <i class="ti ti-eye me-1"></i> View
                                                                </button>
                                                            @else
                                                                <span class="text-muted small italic">No records</span>
                                                            @endif
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <div class="text-center py-5">
                                        <img src="{{ asset('assets-doctor/img/icons/empty-box.svg') }}" width="60" class="mb-2">
                                        <p class="text-muted">No appointments found</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Medical History & Clinical Records Section -->
                <div class="row" style="padding-right: 10px; padding-left: 10px;">
                    <div class="col-lg-12">
                        <div class="card section-card">
                            <div class="section-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0 fw-bold"><i class="ti ti-notes me-2 text-primary"></i> Medical History & Clinical Records</h5>
                            </div>
                            <div class="card-body">
                                @if($consultations->count() > 0)
                                    <!-- Nav tabs -->
                                    <ul class="nav nav-tabs nav-tabs-solid nav-justified mb-3 border-0 bg-light p-1 rounded-3" role="tablist">
                                        <li class="nav-item" role="presentation">
                                            <a class="nav-link active rounded-3 fw-bold" data-bs-toggle="tab" href="#medical-history-tab" role="tab">
                                                <i class="ti ti-activity me-1"></i> Medical History
                                            </a>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <a class="nav-link text-muted rounded-3 fw-bold" data-bs-toggle="tab" href="#medical-records-tab" role="tab">
                                                <i class="ti ti-file-text me-1"></i> Medical Records
                                            </a>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <a class="nav-link text-muted rounded-3 fw-bold" data-bs-toggle="tab" href="#lab-results-tab" role="tab">
                                                <i class="ti ti-microscope me-1"></i> Lab Results
                                            </a>
                                        </li>
                                        <li class="nav-item" role="presentation">
                                            <a class="nav-link text-muted rounded-3 fw-bold" data-bs-toggle="tab" href="#private-notes-tab" role="tab">
                                                <i class="ti ti-lock me-1"></i> Private Notes
                                            </a>
                                        </li>
                                    </ul>

                                    <!-- Tab panes -->
                                    <div class="tab-content p-3 border rounded-3 bg-white">
                                        <!-- Medical History Pane -->
                                        <div class="tab-pane fade show active" id="medical-history-tab" role="tabpanel">
                                            @php $hasHistory = false; @endphp
                                            <div class="timeline-container">
                                                @foreach($consultations as $consult)
                                                    @if(!empty($consult->medical_history))
                                                        @php $hasHistory = true; @endphp
                                                        <div class="d-flex mb-3 align-items-start">
                                                            <div class="flex-shrink-0 me-3 text-center" style="width: 100px;">
                                                                <span class="badge bg-primary text-white d-block mb-1">{{ \Carbon\Carbon::parse($consult->consultation_date)->format('d M Y') }}</span>
                                                                <small class="text-muted">{{ \Carbon\Carbon::parse($consult->consultation_date)->format('h:i A') }}</small>
                                                            </div>
                                                            <div class="flex-grow-1 p-3 bg-light rounded-3 border-start border-primary border-3">
                                                                <div class="fw-bold text-dark mb-1">Recorded by: {{ $consult->doctor->name ?? 'Doctor' }}</div>
                                                                <p class="mb-0 text-muted" style="white-space: pre-line;">{{ $consult->medical_history }}</p>
                                                            </div>
                                                        </div>
                                                    @endif
                                                @endforeach
                                                @if(!$hasHistory)
                                                    <div class="text-center py-4 text-muted small italic">No medical history recorded yet.</div>
                                                @endif
                                            </div>
                                        </div>

                                        <!-- Medical Records Pane -->
                                        <div class="tab-pane fade" id="medical-records-tab" role="tabpanel">
                                            @php $hasRecords = false; @endphp
                                            <div class="timeline-container">
                                                @foreach($consultations as $consult)
                                                    @if(!empty($consult->medical_records))
                                                        @php $hasRecords = true; @endphp
                                                        <div class="d-flex mb-3 align-items-start">
                                                            <div class="flex-shrink-0 me-3 text-center" style="width: 100px;">
                                                                <span class="badge bg-success text-white d-block mb-1">{{ \Carbon\Carbon::parse($consult->consultation_date)->format('d M Y') }}</span>
                                                                <small class="text-muted">{{ \Carbon\Carbon::parse($consult->consultation_date)->format('h:i A') }}</small>
                                                            </div>
                                                            <div class="flex-grow-1 p-3 bg-light rounded-3 border-start border-success border-3">
                                                                <div class="fw-bold text-dark mb-1">Recorded by: {{ $consult->doctor->name ?? 'Doctor' }}</div>
                                                                <p class="mb-0 text-muted" style="white-space: pre-line;">{{ $consult->medical_records }}</p>
                                                            </div>
                                                        </div>
                                                    @endif
                                                @endforeach
                                                @if(!$hasRecords)
                                                    <div class="text-center py-4 text-muted small italic">No medical records recorded yet.</div>
                                                @endif
                                            </div>
                                        </div>

                                        <!-- Lab Results Pane -->
                                        <div class="tab-pane fade" id="lab-results-tab" role="tabpanel">
                                            @php $hasLabResults = false; @endphp
                                            <div class="timeline-container">
                                                @foreach($consultations as $consult)
                                                    @if(!empty($consult->lab_results))
                                                        @php $hasLabResults = true; @endphp
                                                        <div class="d-flex mb-3 align-items-start">
                                                            <div class="flex-shrink-0 me-3 text-center" style="width: 100px;">
                                                                <span class="badge bg-info text-white d-block mb-1">{{ \Carbon\Carbon::parse($consult->consultation_date)->format('d M Y') }}</span>
                                                                <small class="text-muted">{{ \Carbon\Carbon::parse($consult->consultation_date)->format('h:i A') }}</small>
                                                            </div>
                                                            <div class="flex-grow-1 p-3 bg-light rounded-3 border-start border-info border-3">
                                                                <div class="fw-bold text-dark mb-1">Recorded by: {{ $consult->doctor->name ?? 'Doctor' }}</div>
                                                                <p class="mb-0 text-muted" style="white-space: pre-line;">{{ $consult->lab_results }}</p>
                                                            </div>
                                                        </div>
                                                    @endif
                                                @endforeach
                                                @if(!$hasLabResults)
                                                    <div class="text-center py-4 text-muted small italic">No lab results recorded yet.</div>
                                                @endif
                                            </div>
                                        </div>

                                        <!-- Private Notes Pane -->
                                        <div class="tab-pane fade" id="private-notes-tab" role="tabpanel">
                                            @php $hasPrivateNotes = false; @endphp
                                            <div class="timeline-container">
                                                @foreach($consultations as $consult)
                                                    @if(!empty($consult->private_notes))
                                                        @php $hasPrivateNotes = true; @endphp
                                                        <div class="d-flex mb-3 align-items-start">
                                                            <div class="flex-shrink-0 me-3 text-center" style="width: 100px;">
                                                                <span class="badge bg-warning text-white d-block mb-1">{{ \Carbon\Carbon::parse($consult->consultation_date)->format('d M Y') }}</span>
                                                                <small class="text-muted">{{ \Carbon\Carbon::parse($consult->consultation_date)->format('h:i A') }}</small>
                                                            </div>
                                                            <div class="flex-grow-1 p-3 bg-light rounded-3 border-start border-warning border-3">
                                                                <div class="fw-bold text-dark mb-1">Recorded by: {{ $consult->doctor->name ?? 'Doctor' }}</div>
                                                                <p class="mb-0 text-muted" style="white-space: pre-line;">{{ $consult->private_notes }}</p>
                                                            </div>
                                                        </div>
                                                    @endif
                                                @endforeach
                                                @if(!$hasPrivateNotes)
                                                    <div class="text-center py-4 text-muted small italic">No private notes recorded yet.</div>
                                                @endif
                                            </div>
                                        </div>
                                    </div>
                                @else
                                    <div class="text-center py-5">
                                        <p class="text-muted mb-0">No clinical record consultation logs found for this patient.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lower Sections -->
                <div class="row">
                    <div class="col-xl-6">
                        <!-- Home Visits Section ... -->
                         <div class="card section-card">
                            <div class="section-header">
                                <h5 class="mb-0 fw-bold">Home Visit History</h5>
                            </div>
                            <div class="card-body p-0">
                                @if ($homeVisits->count() > 0)
                                    <div class="table-responsive">
                                        <table class="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach ($homeVisits as $visit)
                                                    <tr>
                                                        <td>{{ \Carbon\Carbon::parse($visit->date)->format('d M Y') }} • {{ $visit->time }}</td>
                                                        <td>
                                                            <span class="badge badge-soft-{{ $visit->status == 'completed' ? 'info' : ($visit->status == 'confirmed' ? 'success' : 'warning') }}">
                                                                {{ ucfirst($visit->status) }}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <p class="text-center py-4 text-muted small">No home visits found</p>
                                @endif
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-6">
                        <!-- Billing History Section ... -->
                        <div class="card section-card">
                            <div class="section-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0 fw-bold">Billing Logs</h5>
                                <a href="{{ route('doctor-billing') }}?patient_id={{ $patient->id }}" class="btn btn-sm btn-primary-subtle text-primary">Add Bill</a>
                            </div>
                            <div class="card-body p-0">
                                @if ($billings->count() > 0)
                                    <div class="table-responsive">
                                        <table class="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Bill No</th>
                                                    <th>Total</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach ($billings as $bill)
                                                    <tr>
                                                        <td class="fw-bold">{{ $bill->bill_number }}</td>
                                                        <td>₹{{ number_format($bill->total_amount, 2) }}</td>
                                                        <td>
                                                            <span class="badge badge-soft-{{ $bill->status == 'paid' ? 'success' : 'danger' }}">
                                                                {{ ucfirst($bill->status) }}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <p class="text-center py-4 text-muted small">No billing records found</p>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Consultation Details Modal -->
    <div class="modal fade" id="consultationModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content shadow-lg border-0">
                <div class="modal-header">
                    <div>
                        <h5 class="modal-title mb-0">Consultation Summary</h5>
                        <p class="text-muted small mb-0" id="consultDateLabel"></p>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-0">
                    <div id="consultModalContent">
                        <div class="p-4 text-center" id="consultLoading">
                            <div class="spinner-border text-primary mb-2" role="status"></div>
                            <p class="text-muted small">Fetching medical records...</p>
                        </div>

                        <!-- Empty State UI -->
                        <div class="p-5 text-center" id="consultEmptyState" style="display: none;">
                            <div class="mb-3">
                                <i class="ti ti-notes-off fs-40 text-muted"></i>
                            </div>
                            <h5 class="fw-bold">No Records Found</h5>
                            <p class="text-muted small mb-4">It looks like the consultation notes haven't been captured for this visit yet. You can start one now.</p>
                            <a href="#" id="startConsultationBtn" class="btn btn-outline-primary btn-sm px-4">
                                <i class="ti ti-edit me-1"></i> Start Consultation
                            </a>
                        </div>
                        
                        <div id="consultDataContent" style="display: none;">
                            <div class="p-4 border-bottom bg-light bg-opacity-50">
                                <div class="row g-3">
                                    <div class="col-md-3">
                                        <div class="detail-label">Chief Symptoms</div>
                                        <div class="detail-value text-primary fw-bold" id="consultSymptoms"></div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="detail-label">Examination</div>
                                        <div class="detail-value text-dark" id="consultExam"></div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="detail-label">Diagnosis</div>
                                        <div class="detail-value text-danger fw-bold" id="consultDiagnosis"></div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="detail-label">Lab Tests</div>
                                        <div class="detail-value text-info fw-bold" id="consultLabTests"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-4 border-bottom">
                                <h6 class="fw-bold mb-3"><i class="ti ti-pill me-2 text-primary"></i> Prescribed Medications</h6>
                                <div class="table-responsive border rounded">
                                    <table class="table table-sm mb-0 prescription-table">
                                        <thead class="bg-light">
                                            <tr>
                                                <th>Medicine</th>
                                                <th>Dose & Freq.</th>
                                                <th>Duration</th>
                                                <th>Instruction</th>
                                            </tr>
                                        </thead>
                                        <tbody id="medicationTableBody">
                                            <!-- JS populated -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Uploaded Prescriptions Section -->
                            <div id="prescriptionUploadsSection" class="p-4 border-bottom" style="display: none;">
                                <h6 class="fw-bold mb-3"><i class="ti ti-file-upload me-2 text-success"></i> Uploaded Prescription Files</h6>
                                <div id="uploadsList" class="row g-2">
                                    <!-- JS populated -->
                                </div>
                            </div>
                            
                            <div class="p-4">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="card bg-light border-0">
                                            <div class="card-body p-3">
                                                <div class="detail-label">Medical History</div>
                                                <div class="detail-value small" id="consultHistory"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card bg-light border-0">
                                            <div class="card-body p-3">
                                                <div class="detail-label">Doctor's Private Notes</div>
                                                <div class="detail-value small" id="consultPrivateNotes"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary px-4 fw-bold" data-bs-dismiss="modal">Close</button>
                    <a href="#" id="printPrescriptionBtn" target="_blank" class="btn btn-primary px-4 fw-bold">
                        <i class="ti ti-printer me-1"></i> Print Prescription
                    </a>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        $(document).ready(function() {
            $('.view-consult-btn').on('click', function() {
                const apptId = $(this).data('id');
                $('#consultationModal').modal('show');
                $('#consultLoading').show();
                $('#consultDataContent').hide();
                
                $.ajax({
                    url: `/doctor/appointment/${apptId}/consultation-details`,
                    method: 'GET',
                    success: function(res) {
                        if (res.success) {
                            const consult = res.consultation;
                            
                            // Set Labels
                            $('#consultDateLabel').text(moment(consult.consultation_date).format('DD MMMM YYYY'));
                            if (res.is_fallback) {
                                $('#consultDateLabel').append(' <span class="badge bg-warning-subtle text-warning ms-2"><i class="ti ti-alert-triangle me-1"></i> Showing Latest Record</span>');
                            }

                            // Chief Symptoms
                            let symptomsText = '';
                            if (consult.symptoms && consult.symptoms.length > 0) {
                                symptomsText = consult.symptoms.map(s => s.symptom + (s.note ? ` (${s.note})` : '')).join(', ');
                            }
                            if (consult.symptoms_note) {
                                symptomsText = symptomsText ? `${symptomsText} | Note: ${consult.symptoms_note}` : consult.symptoms_note;
                            }
                            $('#consultSymptoms').text(symptomsText || 'None');

                            // Examination
                            let examText = '';
                            if (consult.examinations && consult.examinations.length > 0) {
                                examText = consult.examinations.map(e => e.examination_name + (e.note ? ` (${e.note})` : '')).join(', ');
                            }
                            if (consult.examination_note) {
                                examText = examText ? `${examText} | Note: ${consult.examination_note}` : consult.examination_note;
                            }
                            $('#consultExam').text(examText || 'None');

                            // Diagnosis
                            let diagnosisText = '';
                            if (consult.diagnoses && consult.diagnoses.length > 0) {
                                diagnosisText = consult.diagnoses.map(d => d.diagnosis_name + (d.note ? ` (${d.note})` : '')).join(', ');
                            }
                            if (consult.diagnosis_note) {
                                diagnosisText = diagnosisText ? `${diagnosisText} | Note: ${consult.diagnosis_note}` : consult.diagnosis_note;
                            }
                            $('#consultDiagnosis').text(diagnosisText || 'None');

                            // Lab Tests
                            let labText = '';
                            if (consult.lab_tests && consult.lab_tests.length > 0) {
                                labText = consult.lab_tests.map(l => l.lab_test_name + (l.note ? ` (${l.note})` : '')).join(', ');
                            }
                            if (consult.lab_note) {
                                labText = labText ? `${labText} | Note: ${consult.lab_note}` : consult.lab_note;
                            }
                            $('#consultLabTests').text(labText || 'None');

                            $('#consultHistory').text(consult.medical_history || 'No history recorded');
                            $('#consultPrivateNotes').text(consult.private_notes || 'No private notes');
                            
                            // Populate Meds
                            let medHtml = '';
                            if (consult.medications && consult.medications.length > 0) {
                                consult.medications.forEach(med => {
                                    medHtml += `
                                        <tr>
                                            <td><span class="fw-bold text-dark">${med.medicine_name}</span></td>
                                            <td>${med.dose || '-'} • ${med.frequency || '-'}</td>
                                            <td>${med.duration || '-'}</td>
                                            <td><small class="text-muted">${med.note || '-'}</small></td>
                                        </tr>`;
                                });
                            } else {
                                medHtml = '<tr><td colspan="4" class="text-center py-3 text-muted">No medications prescribed</td></tr>';
                            }
                            $('#medicationTableBody').html(medHtml);

                            // Handle Uploaded Files
                            let uploadHtml = '';
                            if (consult.prescription_uploads && consult.prescription_uploads.length > 0) {
                                $('#prescriptionUploadsSection').show();
                                consult.prescription_uploads.forEach(file => {
                                    let isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(file.file_type?.toLowerCase() || '');
                                    let icon = isImage ? 'ti-photo' : 'ti-file-text';
                                    let colorClass = isImage ? 'text-info' : 'text-danger';
                                    
                                    uploadHtml += `
                                        <div class="col-md-6 mb-2">
                                            <a href="/storage/${file.file_path}" target="_blank" class="text-decoration-none">
                                                <div class="d-flex align-items-center p-2 border rounded bg-white hover-shadow-sm">
                                                    <div class="flex-shrink-0 me-2">
                                                        <div class="avatar avatar-sm bg-light rounded d-flex align-items-center justify-content-center">
                                                            <i class="ti ${icon} fs-16 ${colorClass}"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1 min-width-0">
                                                        <p class="text-dark small fw-bold mb-0 text-truncate">Prescription File</p>
                                                        <span class="text-muted" style="font-size: 10px;">Click to view ${file.file_type?.toUpperCase() || ''}</span>
                                                    </div>
                                                    <i class="ti ti-external-link text-muted ms-2"></i>
                                                </div>
                                            </a>
                                        </div>`;
                                });
                            } else {
                                $('#prescriptionUploadsSection').hide();
                            }
                            $('#uploadsList').html(uploadHtml);
                            
                            // Set Print Link
                            $('#printPrescriptionBtn').attr('href', `/consultations/${consult.id}/pdf`);
                            
                            $('#consultLoading').hide();
                            $('#consultDataContent').fadeIn();
                        } else {
                            handleNoConsultation(res, apptId);
                        }
                    },
                    error: function(xhr) {
                        handleNoConsultation(xhr.responseJSON || {}, apptId);
                    }
                });
            });

            function handleNoConsultation(res, apptId) {
                $('#consultLoading').hide();
                $('#consultDataContent').hide();
                $('#consultEmptyState').show();
                $('#printPrescriptionBtn').hide();
                
                const targetId = apptId || res.appointment_id || '';
                $('#startConsultationBtn').attr('href', `/doctor-consultation/${targetId}`);
            }
        });
    </script>
    @endpush

    
@endsection
