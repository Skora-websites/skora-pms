@extends('layouts.layout-doctor')
@section('title', 'Doctor || Consultation PDF')

@section('content')
<div class="main-wrapper">
    <div class="page-wrapper">
        <div class="content">

            <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-4">
                <div class="flex-grow-1">
                    <h4 class="fw-bold mb-0 color-doctorrx">Consultation PDF</h4>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h5 class="fw-bold"><i class="ti ti-file-text me-1"></i>Current PDF</h5>
                </div>
                <div class="card-body">
                    @if($consultPdf && $consultPdf->pdf_path)
                      <embed src="{{ asset($consultPdf->pdf_path) }}" type="application/pdf" 
                               width="100%" 
                               height="350px" 
                               style="border: 2px solid #0e606e; border-radius: 8px;">
                    @else
                        <p class="text-muted text-center py-5">No PDF uploaded yet. Upload below 👇</p>
                    @endif
                </div>
            </div>

            <!-- Upload Form -->
            <div class="card mt-3">
                <div class="card-header">
                    <h5 class="fw-bold"><i class="ti ti-upload me-1"></i>Upload / Replace PDF</h5>
                </div>
                <div class="card-body">
                    <form action="{{ route('update.consult-pdf', Auth::id()) }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        <div class="mb-3">
                            <label class="form-label fw-bold">Select Consultation PDF</label>
                            <input type="file" name="pdf" class="form-control" accept="application/pdf" required>
                            <small class="text-muted">Only .pdf files (max 20 MB)</small>
                        </div>
                        <button type="submit" class="btn btn-success btn-lg">
                            <i class="ti ti-device-floppy me-1"></i> Upload / Update PDF
                        </button>
                    </form>
                </div>
            </div>

        </div>
    </div>
</div>
@endsection