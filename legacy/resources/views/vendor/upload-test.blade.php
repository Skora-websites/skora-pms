@extends('layouts.frontend')

@section('content')
<main>
    <!-- BREADCRUMBS SECTION START -->
    <section class="ul-breadcrumb ul-section-spacing">
        <div class="ul-container">
            <ul class="ul-breadcrumb-nav">
                <li><a href="{{ url('/') }}">Home</a></li>
                <li><span class="separator"><i class="flaticon-right"></i></span></li>
                <li>Test Booking</li>
            </ul>
            <h2 class="ul-breadcrumb-title">Test Booking Details</h2>
        </div>
    </section>
    <!-- BREADCRUMBS SECTION END -->

    <div style="background-color: #f7fcfb; min-height: 80vh; padding: 60px 0;">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card shadow-sm border-0 rounded-4">
                        <div class="card-header bg-white border-0 py-4 px-5 rounded-top-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <h4 class="mb-0 text-success fw-bold">Test Request</h4>
                                <span class="badge {!! $booking->status == 'completed' ? 'bg-success' : 'bg-warning' !!} px-3 py-2 fs-6">
                                    {{ ucfirst($booking->status) }}
                                </span>
                            </div>
                        </div>
                        
                        <div class="card-body px-5 py-4">
                            @if(session('success'))
                                <div class="alert alert-success alert-dismissible fade show mb-4" role="alert">
                                    {{ session('success') }}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>
                            @endif

                            @if(session('error'))
                                <div class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                                    {{ session('error') }}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>
                            @endif

                            @if($errors->any())
                                <div class="alert alert-danger mb-4">
                                    <ul class="mb-0">
                                        @foreach($errors->all() as $error)
                                            <li>{{ $error }}</li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endif

                            <div class="row mb-4">
                                <div class="col-md-6 mb-3 mb-md-0">
                                    <div class="bg-light p-4 rounded-3 h-100">
                                        <h6 class="text-muted mb-3 text-uppercase fw-semibold" style="letter-spacing: 1px;">Patient Information</h6>
                                        <p class="mb-1"><i class="bi bi-person me-2 text-success"></i> <strong>{{ $booking->patient->name ?? 'N/A' }}</strong></p>
                                        <p class="mb-1"><i class="bi bi-telephone me-2 text-success"></i> {{ $booking->patient->phone ?? 'N/A' }}</p>
                                        <p class="mb-0"><i class="bi bi-info-circle me-2 text-success"></i> {{ $booking->patient->gender ?? 'N/A' }}, {{ $booking->patient->age ?? 'N/A' }} Years</p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="bg-light p-4 rounded-3 h-100">
                                        <h6 class="text-muted mb-3 text-uppercase fw-semibold" style="letter-spacing: 1px;">Doctor Details</h6>
                                        <p class="mb-1"><i class="bi bi-person-badge me-2 text-primary"></i> <strong>Dr. {{ $booking->doctor->name ?? 'N/A' }}</strong></p>
                                        <p class="mb-1"><i class="bi bi-calendar-event me-2 text-primary"></i> {{ \Carbon\Carbon::parse($booking->booking_date)->format('d M Y') }}</p>
                                        <p class="mb-0"><i class="bi bi-clock me-2 text-primary"></i> {{ \Carbon\Carbon::parse($booking->booking_time)->format('h:i A') }}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-4">
                                <h6 class="text-muted mb-3 text-uppercase fw-semibold" style="letter-spacing: 1px;">Tests Requested</h6>
                                <ul class="list-group">
                                    @forelse($booking->tests as $test)
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="bi bi-droplet me-2 text-info"></i> {{ $test['name'] ?? 'Unknown Test' }}</span>
                                        </li>
                                    @empty
                                        <li class="list-group-item text-muted">No tests listed</li>
                                    @endforelse
                                </ul>
                            </div>

                            @if($booking->status !== 'completed')
                            <div class="card bg-white mt-4 shadow-sm border-0 rounded-4 upload-section">
                                <div class="card-body p-4">
                                    <h5 class="mb-3 fw-bold">Upload Test Results</h5>
                                    <form action="{{ route('vendor.upload.submit', $token) }}" method="POST" enctype="multipart/form-data">
                                        @csrf
                                        <div class="mb-3">
                                            <label for="test_report" class="form-label text-muted d-block">Please upload the report in PDF or Image format (Max size: 5MB)</label>
                                            <input type="file" class="form-control form-control-lg" id="test_report" name="test_report" accept=".pdf,.png,.jpg,.jpeg" required>
                                        </div>
                                        <button type="submit" class="btn btn-success btn-lg w-100 mt-2 rounded-3 text-white fw-semibold" style="background: linear-gradient(135deg, #0c4843 0%, #1a7c75 100%); border: none;">
                                            <i class="bi bi-cloud-upload me-2"></i> Submit Report
                                        </button>
                                    </form>
                                </div>
                            </div>
                            @else
                            <div class="alert alert-info border-0 rounded-3 text-center p-4 shadow-sm mt-4">
                                <div class="mb-3"><i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i></div>
                                <h5 class="fw-bold text-dark">Report Already Uploaded</h5>
                                <p class="mb-0 text-muted">The test results for this booking have been successfully uploaded and notified to the doctor.</p>
                            </div>
                            @endif

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<style>
.upload-section { 
    border: 1px dashed #1a7c75 !important;
}
</style>
@endsection
