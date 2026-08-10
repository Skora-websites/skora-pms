<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Support & Help</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Header Links -->
    @include('doctor.inc.header-links')
    @include('doctor.inc.custom')

    <!-- CSS -->
    <style>
        .page-header-color { color: #0e606e; }
        .nav-tabs-custom { border-bottom: 2px solid #e2e8f0; margin-bottom: 25px; }
        .nav-tabs-custom .nav-link { border: none; color: #64748b; font-weight: 600; padding: 12px 20px; transition: all 0.3s; background: transparent; position: relative; }
        .nav-tabs-custom .nav-link:hover { color: #0e606e; }
        .nav-tabs-custom .nav-link.active { color: #0e606e; background: transparent; }
        .nav-tabs-custom .nav-link.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background-color: #0e606e; border-radius: 3px 3px 0 0; }
        
        .ticket-card { border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.2s; cursor: pointer; }
        .ticket-card:hover { border-color: #0e606e; box-shadow: 0 4px 15px rgba(14, 96, 110, 0.08); transform: translateY(-2px); }
        .badge-open { background-color: #e8fadf !important; color: #71dd37 !important; }
        .badge-closed { background-color: #ffe0e0 !important; color: #ff3e1d !important; }

        .chat-container { display: flex; flex-direction: column; gap: 20px; max-height: 50vh; overflow-y: auto; padding: 25px; background: #fdfdfd; border-radius: 16px; scroll-behavior: smooth; }
        .chat-msg { max-width: 80%; padding: 14px 18px; border-radius: 20px; position: relative; font-size: 14px; line-height: 1.5; }
        .chat-doctor { background: #0e606e; color: white; align-self: flex-end; border-bottom-right-radius: 2px; box-shadow: 0 4px 12px rgba(14,96,110,0.15); }
        .chat-admin { background: #f0f4f5; color: #2c3e50; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #e1e8ea; }
        .chat-time { display: block; font-size: 10px; margin-top: 6px; font-weight: 500; }
        .chat-doctor .chat-time { color: rgba(255,255,255,0.7); text-align: right; }
        .chat-admin .chat-time { color: #8e9aaf; }

        .video-card { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; transition: all 0.25s ease; background: #fff; }
        .video-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(14, 96, 110, 0.15); border-color: #0e606e; }
        .video-container { width: 100%; padding-top: 56.25%; position: relative; background: #000; }
        .video-container video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        
        .btn-theme { background-color: #0e606e; color: white; border-radius: 50px; padding: 10px 25px; transition: all 0.3s; border: none; }
        .btn-theme:hover { background-color: #0b4b56; color: white; box-shadow: 0 4px 10px rgba(14, 96, 110, 0.2); }

        .reply-box-wrapper { background: #fff; border-radius: 30px; box-shadow: 0 -5px 25px rgba(0,0,0,0.03); transition: all 0.3s ease; border: 1.5px solid #eee; }
        .reply-box-wrapper:focus-within { border-color: #0e606e; box-shadow: 0 5px 20px rgba(14,96,110,0.08); }
        .file-preview-strip { background: #f8f9fa; border-radius: 12px 12px 0 0; padding: 8px 15px; border-bottom: 1px dashed #e0e0e0; margin-bottom: -1px; }
    </style>
</head>
<body>
    <div class="main-wrapper">
        @include('doctor.inc.header')
        @include('doctor.inc.sidebar')

        <div class="page-wrapper">
            <div class="content pb-0">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 class="mb-1 page-header-color fw-bold">Support & Help Center</h4>
                        <p class="text-muted mb-0">Manage your support tickets and watch tutorial videos.</p>
                    </div>
                </div>

                @if(session('success'))
                    <div class="alert alert-success alert-dismissible" role="alert">
                        {{ session('success') }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                @endif
                @if ($errors->any())
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <ul class="mb-0">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                @endif

                <ul class="nav nav-tabs nav-tabs-custom" id="supportTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="tickets-tab" data-bs-toggle="tab" data-bs-target="#tickets" type="button" role="tab" aria-controls="tickets" aria-selected="true">
                            <i class="ri-customer-service-2-line me-1"></i> My Tickets
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="videos-tab" data-bs-toggle="tab" data-bs-target="#videos" type="button" role="tab" aria-controls="videos" aria-selected="false">
                            <i class="ri-video-chat-line me-1"></i> Tutorial Videos
                        </button>
                    </li>
                </ul>

                <div class="tab-content border-0 p-0" id="supportTabsContent">
                    
                    <!-- TICKETS TAB -->
                    <div class="tab-pane fade show active" id="tickets" role="tabpanel" aria-labelledby="tickets-tab">
                        <div class="card mb-4 border-0 shadow-sm">
                            <div class="card-body d-flex justify-content-between align-items-center bg-light rounded-3 p-4">
                                <div>
                                    <h5 class="fw-bold mb-1">Need Help?</h5>
                                    <p class="text-muted mb-0">Create a support ticket and our admin team will get back to you.</p>
                                </div>
                                <button class="btn btn-theme" data-bs-toggle="modal" data-bs-target="#raiseTicketModal">
                                    <i class="ri-add-line me-1"></i> Raise Ticket
                                </button>
                            </div>
                        </div>

                        <div class="row g-4">
                            @forelse($tickets as $ticket)
                                <div class="col-md-6 col-lg-4">
                                    <a href="{{ route('doctor.supports.show', $ticket->id) }}" class="card ticket-card h-100 text-decoration-none transition-all">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-3">
                                                <span class="badge rounded-pill {{ $ticket->status === 'open' ? 'badge-open' : 'badge-closed' }}">
                                                    {{ ucfirst($ticket->status) }}
                                                </span>
                                                <small class="text-muted">{{ $ticket->created_at->diffForHumans() }}</small>
                                            </div>
                                            <h5 class="fw-bold text-dark mb-2">{{ Str::limit($ticket->subject, 50) }}</h5>
                                            <p class="text-muted small mb-3">Ticket ID: #{{ str_pad($ticket->id, 5, '0', STR_PAD_LEFT) }}</p>
                                            <div class="d-flex justify-content-between align-items-center mt-auto">
                                                <span class="text-primary small fw-bold"><i class="ri-message-3-line"></i> {{ $ticket->messages->count() }} Messages</span>
                                                <i class="ri-arrow-right-line text-muted"></i>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            @empty
                                <div class="col-12 text-center py-5">
                                    <div class="avatar avatar-xl mx-auto mb-3 bg-light rounded-circle d-flex align-items-center justify-content-center">
                                        <i class="ri-inbox-archive-line fs-2 text-muted"></i>
                                    </div>
                                    <h5 class="text-muted fw-bold">No Support Tickets</h5>
                                    <p class="text-muted mb-0">You haven't raised any support tickets yet.</p>
                                </div>
                            @endforelse
                        </div>
                    </div>

                    <!-- VIDEOS TAB -->
                    <div class="tab-pane fade" id="videos" role="tabpanel" aria-labelledby="videos-tab">
                        <div class="row g-4 pt-2">
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
                                                    <span class="badge bg-label-primary me-2"><i class="ri-video-line"></i> Tutorial</span>
                                                @endif
                                                <h5 class="card-title fw-bold text-dark text-truncate mb-0" title="{{ $video->title }}">{{ $video->title }}</h5>
                                            </div>
                                            <p class="card-text text-muted small mb-0" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                                                {{ $video->description ?: 'No description provided.' }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            @empty
                                <div class="col-12 text-center py-5">
                                    <div class="avatar avatar-xl mx-auto mb-3 bg-light rounded-circle d-flex align-items-center justify-content-center">
                                        <i class="ri-video-download-line fs-2 text-muted"></i>
                                    </div>
                                    <h5 class="text-muted fw-bold">No Tutorial Videos</h5>
                                    <p class="text-muted mb-0">Admin hasn't uploaded any videos yet.</p>
                                </div>
                            @endforelse
                        </div>
                    </div>

                </div>

            </div>
            @include('doctor.inc.footer')
        </div>
    </div>

    <!-- Raise Ticket Modal -->
    <div class="modal fade" id="raiseTicketModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-bottom bg-light">
                    <h5 class="modal-title fw-bold">Raise Support Ticket</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{ route('doctor.supports.store') }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    <div class="modal-body pb-0">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Subject <span class="text-danger">*</span></label>
                            <input type="text" name="subject" class="form-control" placeholder="Briefly describe the issue" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Message <span class="text-danger">*</span></label>
                            <textarea name="message" class="form-control" rows="4" placeholder="Provide detailed information..." required></textarea>
                        </div>
                        <div class="mb-4">
                            <label class="form-label fw-bold">Attachment (Optional)</label>
                            <input type="file" name="attachment" class="form-control" accept="image/*,application/pdf">
                            <small class="text-muted">You can attach an image or PDF (Max 10MB)</small>
                        </div>
                    </div>
                    <div class="modal-footer pt-2">
                        <button type="button" class="btn btn-outline-secondary rounded-pill" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-upload rounded-pill" style="background:#0e606e; color:white;">Submit Ticket</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    @include('doctor.inc.footer-links')
    
    <!-- Script tag removed as page behaves statically and reply form has been moved to support-show.blade.php -->
</body>
</html>