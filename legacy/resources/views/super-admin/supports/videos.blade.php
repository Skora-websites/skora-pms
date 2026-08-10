<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>Super Admin || Support Videos</title>
    @include('super-admin.inc.header-links')
    <style>
        .page-header-color { color: #0e606e; }
        .video-card { transition: all 0.25s ease; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .video-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(14, 96, 110, 0.15); border-color: #0e606e; }
        .video-container { width: 100%; padding-top: 56.25%; position: relative; background: #000; }
        .video-container video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 12px 12px 0 0; }
        .btn-upload { background: linear-gradient(135deg, #0e606e, #137e91); color: white; border: none; }
        .btn-upload:hover { box-shadow: 0 4px 12px rgba(14, 96, 110, 0.3); color: white; }
    </style>
</head>
<body>
    <div class="layout-wrapper layout-content-navbar">
        <div class="layout-container">
            @include('super-admin.inc.sidebar')
            <div class="layout-page">
                @include('super-admin.inc.header')
                <div class="content-wrapper">
                    <div class="container-xxl flex-grow-1 container-p-y">
                        
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 class="mb-1 page-header-color fw-bold">Support Videos</h4>
                                <p class="text-muted mb-0">Upload tutorial videos for doctors (e.g. How to use dashboard, Book appointments)</p>
                            </div>
                            <button class="btn btn-upload rounded-pill" data-bs-toggle="modal" data-bs-target="#uploadModal">
                                <i class="ri-upload-cloud-2-line me-1"></i> Upload New Video
                            </button>
                        </div>

                        @if(session('success'))
                            <div class="alert alert-success alert-dismissible" role="alert">
                                {{ session('success') }}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        @endif

                        @if($errors->any())
                            <div class="alert alert-danger">
                                <ul class="mb-0">
                                    @foreach($errors->all() as $err)
                                        <li>{{ $err }}</li>
                                    @endforeach
                                </ul>
                            </div>
                        @endif

                        <div class="row g-4">
                            @forelse($videos as $video)
                                <div class="col-md-6 col-lg-4">
                                    <div class="card video-card h-100">
                                        <div class="video-container">
                                            @if($video->video_type === 'youtube')
                                                @php
                                                    $url = $video->video_url;
                                                    $video_id = '';
                                                    if (preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $url, $match)) {
                                                        $video_id = $match[1];
                                                    }
                                                @endphp
                                                @if($video_id)
                                                    <iframe src="https://www.youtube.com/embed/{{ $video_id }}" 
                                                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                                                        frameborder="0" allowfullscreen></iframe>
                                                @else
                                                    <div class="d-flex align-items-center justify-content-center h-100 text-white">Invalid YouTube Link</div>
                                                @endif
                                            @else
                                                <video controls preload="metadata">
                                                    <source src="{{ asset($video->video_path) }}" type="video/mp4">
                                                    Your browser does not support HTML video.
                                                </video>
                                            @endif
                                        </div>
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-2">
                                                @if($video->video_type === 'youtube')
                                                    <span class="badge bg-label-danger me-2"><i class="ri-youtube-line"></i> YouTube</span>
                                                @else
                                                    <span class="badge bg-label-primary me-2"><i class="ri-video-line"></i> Internal</span>
                                                @endif
                                                <h5 class="card-title fw-bold text-dark text-truncate mb-0" title="{{ $video->title }}">{{ $video->title }}</h5>
                                            </div>
                                            <p class="card-text text-muted small" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                                {{ $video->description ?: 'No description provided.' }}
                                            </p>
                                        </div>
                                        <div class="card-footer bg-transparent border-top d-flex justify-content-between align-items-center">
                                            <span class="text-muted small"><i class="ri-calendar-line"></i> {{ $video->created_at->format('M d, Y') }}</span>
                                            <form action="{{ route('super-admin.supports.destroy-video', $video->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this resource?');">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="btn btn-sm btn-outline-danger rounded-pill"><i class="ri-delete-bin-line"></i></button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            @empty
                                <div class="col-12 text-center py-5">
                                    <img src="{{ asset('assets/img/illustrations/empty-state.svg') }}" style="max-height: 150px; opacity: 0.5;" alt="Empty" class="mb-3">
                                    <h5 class="text-muted">No Support Resources Yet</h5>
                                    <p class="text-muted">Add videos or YouTube tutorials to guide your users through the dashboard features.</p>
                                </div>
                            @endforelse
                        </div>

                    </div>
                    @include('super-admin.inc.footer')
                </div>
            </div>
        </div>
    </div>

    <!-- Upload Modal -->
    <div class="modal fade" id="uploadModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-bottom">
                    <h5 class="modal-title fw-bold" id="exampleModalLabel">Add Support Resource</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{ route('super-admin.supports.store-video') }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    <div class="modal-body pb-0">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Resource Title <span class="text-danger">*</span></label>
                            <input type="text" name="title" class="form-control" placeholder="e.g. How to book an appointment" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Description (Optional)</label>
                            <textarea name="description" class="form-control" rows="3" placeholder="Brief description of the tutorial"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label fw-bold d-block">Resource Type <span class="text-danger">*</span></label>
                            <div class="form-check form-check-inline mt-2">
                                <input class="form-check-input" type="radio" name="video_type" id="typeUpload" value="upload" checked>
                                <label class="form-check-label" for="typeUpload">Direct File Upload</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="video_type" id="typeYoutube" value="youtube">
                                <label class="form-check-label" for="typeYoutube">YouTube URL</label>
                            </div>
                        </div>

                        <div id="fileUploadGroup" class="mb-3">
                            <label class="form-label fw-bold">Video File <span class="text-danger">*</span></label>
                            <input class="form-control" type="file" id="videoFileInput" name="video" accept="video/mp4,video/x-m4v,video/*">
                            <small class="text-muted">Max size: 50MB. Recommended format: MP4.</small>
                        </div>

                        <div id="youtubeUrlGroup" class="mb-3" style="display: none;">
                            <label class="form-label fw-bold">YouTube URL <span class="text-danger">*</span></label>
                            <input type="url" id="videoUrlInput" name="video_url" class="form-control" placeholder="https://www.youtube.com/watch?v=...">
                        </div>
                    </div>
                    <div class="modal-footer pt-3">
                        <button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-upload rounded-pill">Save Resource</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    @include('super-admin.inc.footer-links')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const typeUpload = document.getElementById('typeUpload');
            const typeYoutube = document.getElementById('typeYoutube');
            const fileGroup = document.getElementById('fileUploadGroup');
            const urlGroup = document.getElementById('youtubeUrlGroup');
            const fileInput = document.getElementById('videoFileInput');
            const urlInput = document.getElementById('videoUrlInput');

            typeUpload.addEventListener('change', function() {
                if(this.checked) {
                    fileGroup.style.display = 'block';
                    urlGroup.style.display = 'none';
                    fileInput.required = true;
                    urlInput.required = false;
                }
            });

            typeYoutube.addEventListener('change', function() {
                if(this.checked) {
                    fileGroup.style.display = 'none';
                    urlGroup.style.display = 'block';
                    fileInput.required = false;
                    urlInput.required = true;
                }
            });

            // Set initial required state
            fileInput.required = true;
        });
    </script>

    @include('super-admin.inc.footer-links')
</body>
</html>
