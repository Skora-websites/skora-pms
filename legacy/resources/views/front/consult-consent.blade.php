@extends('layouts.frontend')

@push('styles')
    <style>
        body {
            background: #f4f7fb;
            font-family: 'Inter', sans-serif;
        }

        .consent-container {
            max-width: 1200px;
            margin: 60px auto;
        }

        .consent-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }

        .pdf-box {
            background: #fff;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        }

        .pdf-box embed {
            width: 100%;
            height: 750px;
            border-radius: 10px;
        }

        .consent-panel {
            background: #ffffff;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
            position: sticky;
            top: 100px;
            height: fit-content;
        }

        .doctor-card {
            background: linear-gradient(135deg, #0e606ee3, #46bccc);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
        }

        .doctor-card h5 {
            margin-bottom: 5px;
        }

        .status-pill {
            display: inline-block;
            background: #e6f4ea;
            color: #46bccc;
            padding: 6px 12px;
            border-radius: 50px;
            font-size: 0.85rem;
            margin-top: 10px;
        }

        .agree-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
        }

        .btn-submit {
            background: #46bccc;
            color: white;
            border: none;
            padding: 14px;
            font-weight: 600;
            border-radius: 8px;
            transition: 0.3s ease;
        }

        .btn-submit:hover {
            background: #3aa3b3;
            color: white;
            transform: translateY(-2px);
        }

        .btn-reject {
            background: #fff;
            color: #d32f2f;
            border: 1px solid #d32f2f;
            padding: 14px;
            font-weight: 600;
            border-radius: 8px;
            transition: 0.3s ease;
        }

        .btn-reject:hover {
            background: #ffebee;
            transform: translateY(-2px);
        }

        .appointment-details {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            font-size: 0.95rem;
            color: #475569;
        }

        @media(max-width: 992px) {
            .consent-layout {
                grid-template-columns: 1fr;
            }

            .pdf-box embed {
                height: 500px;
            }

            .consent-panel {
                position: relative;
                top: auto;
            }
        }
    </style>
@endpush

@section('content')
    <main>
        <section class="ul-breadcrumb ul-section-spacing">
            <div class="ul-container">
                <ul class="ul-breadcrumb-nav">
                    <li><a href="{{ url('/') }}">Home</a></li>
                    <li><span class="separator"><i class="flaticon-right"></i></span></li>
                    <li>Consultation Form</li>
                </ul>
                <h2 class="ul-breadcrumb-title">Consultation Form</h2>
            </div>
        </section>

        <div class="container consent-container">
            <div class="consent-layout">

                {{-- Left PDF Section --}}
                <div class="pdf-box">
                    @if($pdf && $pdf->pdf_path)
                        <embed src="{{ asset($pdf->pdf_path) }}" type="application/pdf">
                    @else
                        <div class="alert alert-warning text-center">
                            Consultation PDF not available.
                        </div>
                    @endif
                </div>

                {{-- Right Consent Panel --}}
                <div class="consent-panel">

                    <div class="doctor-card">
                        <h5>Consultation Form</h5>
                        <small>Dr. {{ $consent->doctor?->name ?? 'Doctor' }}</small>

                        @if($consent->is_accepted)
                            <div class="status-pill">
                                ✔ Consent Accepted
                            </div>
                        @elseif($consent->is_rejected)
                            <div class="status-pill" style="background: #ffebee; color: #d32f2f;">
                                ✖ Consent Rejected
                            </div>
                        @endif
                    </div>

                    @if(session('success'))
                        <div class="alert alert-success">{{ session('success') }}</div>
                    @endif
                    @if(session('error'))
                        <div class="alert alert-danger">{{ session('error') }}</div>
                    @endif

                    <div class="appointment-details">
                        <strong>Appointment Info:</strong><br>
                        Date: {{ $consent->appointment?->date ? \Carbon\Carbon::parse($consent->appointment->date)->format('d M Y') : 'N/A' }}<br>
                        Time: {{ $consent->appointment?->time ? \Carbon\Carbon::parse($consent->appointment->time)->format('h:i A') : 'N/A' }}<br>
                        For: {{ $consent->appointment?->patient?->name ?? 'Patient' }}
                    </div>

                    @if(!$consent->is_accepted && !$consent->is_rejected)
                        <form action="{{ route('submit.consult.consent', $consent->slug) }}" method="POST"
                            enctype="multipart/form-data">
                            @csrf

                            <div class="agree-box mb-3">
                                <!-- <label class="form-label" style="font-weight:600; font-size: 0.95rem; color:#334155;">Upload Document/Prescription (Optional)</label>
                                <input type="file" name="consent_file" class="form-control mb-3" accept="image/*,application/pdf"> -->

                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="agree" name="agree" required>
                                    <label class="form-check-label" style="font-size: 0.9rem;" for="agree">
                                        I confirm the details and understand the consultation terms.
                                    </label>
                                </div>
                            </div>

                            <div class="d-flex gap-2 flex-column">
                                <button type="submit" name="action" value="accept" class="btn btn-submit w-100">
                                    Allow (Confirm Appointment)
                                </button>
                                <button type="submit" name="action" value="reject" class="btn btn-reject w-100 mt-2"
                                    onclick="document.getElementById('agree').removeAttribute('required');">
                                    Reject & Cancel
                                </button>
                            </div>
                        </form>
                    @else
                        <div class="alert alert-{{ $consent->is_accepted ? 'success' : 'danger' }} text-center mt-4">
                            Your response has been recorded.<br>
                            Status: <strong>{{ $consent->is_accepted ? 'Confirmed' : 'Cancelled' }}</strong>
                        </div>
                    @endif

                </div>

            </div>
        </div>
    </main>
@endsection