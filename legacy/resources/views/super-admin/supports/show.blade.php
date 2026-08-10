<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>Super Admin || View Ticket #{{ $ticket->id }}</title>
    @include('super-admin.inc.header-links')
    <style>
        .page-header-color { color: #0e606e; }
        .chat-container { display: flex; flex-direction: column; gap: 20px; max-height: 60vh; overflow-y: auto; padding: 25px; background: #fdfdfd; border-radius: 16px; scroll-behavior: smooth; }
        .chat-msg { max-width: 80%; padding: 14px 20px; border-radius: 20px; position: relative; font-size: 14.5px; line-height: 1.5; word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; }
        .chat-admin { background: #0e606e; color: white; align-self: flex-end; border-bottom-right-radius: 2px; box-shadow: 0 4px 15px rgba(14,96,110,0.15); }
        .chat-user { background: #f0f4f5; color: #2c3e50; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #e1e8ea; }
        .chat-time { display: block; font-size: 10.5px; margin-top: 6px; font-weight: 500; }
        .chat-admin .chat-time { color: rgba(255,255,255,0.7); text-align: right; }
        .chat-user .chat-time { color: #8e9aaf; }
        .ticket-info-card { border-top: 4px solid #0e606e; border-radius: 12px; }
        .reply-box-wrapper { background: #fff; border-radius: 30px; box-shadow: 0 -5px 25px rgba(0,0,0,0.03); transition: all 0.3s ease; border: 1.5px solid #eee; }
        .reply-box-wrapper:focus-within { border-color: #0e606e; box-shadow: 0 5px 20px rgba(14,96,110,0.08); }
        .file-preview-strip { background: #f8f9fa; border-radius: 12px 12px 0 0; padding: 8px 15px; border-bottom: 1px dashed #e0e0e0; margin-bottom: -1px; }
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
                                <a href="{{ route('super-admin.supports.index') }}" class="text-muted d-block mb-1"><i class="ri-arrow-left-line"></i> Back to Tickets</a>
                                <h4 class="mb-0 page-header-color fw-bold">Ticket #{{ str_pad($ticket->id, 5, '0', STR_PAD_LEFT) }}</h4>
                            </div>
                            @if($ticket->status === 'open')
                                <form action="{{ route('super-admin.supports.close', $ticket->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to close this ticket?');">
                                    @csrf
                                    <button type="submit" class="btn btn-outline-danger shadow-sm rounded-pill"><i class="ri-lock-2-line me-1"></i> Close Ticket</button>
                                </form>
                            @else
                                <span class="badge bg-label-danger fs-6"><i class="ri-lock-2-line me-1"></i> Closed</span>
                            @endif
                        </div>

                        @if(session('success'))
                            <div class="alert alert-success alert-dismissible" role="alert">
                                {{ session('success') }}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        @endif

                        <div class="row g-4">
                            <!-- Ticket Details sidebar -->
                            <div class="col-md-4 col-lg-3">
                                <div class="card ticket-info-card shadow-sm h-100">
                                    <div class="card-body">
                                        <div class="text-center mb-4">
                                            <div class="avatar avatar-xl mx-auto mb-3">
                                                <span class="avatar-initial rounded-circle bg-label-primary"><i class="ri-user-star-line fs-2"></i></span>
                                            </div>
                                            <h5 class="fw-bold mb-1">{{ $ticket->user->name ?? 'Unknown User' }}</h5>
                                            <span class="badge bg-label-secondary">{{ ucfirst($ticket->user->role ?? 'User') }}</span>
                                        </div>
                                        <hr class="my-4">
                                        <div class="info-item mb-3">
                                            <small class="text-muted d-block text-uppercase fw-bold mb-1">Subject</small>
                                            <span class="text-dark fw-medium">{{ $ticket->subject }}</span>
                                        </div>
                                        <div class="info-item mb-3">
                                            <small class="text-muted d-block text-uppercase fw-bold mb-1">Status</small>
                                            <span class="badge {{ $ticket->status === 'open' ? 'bg-label-success' : 'bg-label-danger' }}">{{ ucfirst($ticket->status) }}</span>
                                        </div>
                                        <div class="info-item mb-3">
                                            <small class="text-muted d-block text-uppercase fw-bold mb-1">Created At</small>
                                            <span class="text-dark">{{ $ticket->created_at->format('M d, Y h:i A') }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Chat Area -->
                            <div class="col-md-8 col-lg-9">
                                <div class="card shadow-sm border-0 h-100 d-flex flex-column">
                                    <div class="card-header border-bottom bg-white py-3">
                                        <h5 class="mb-0 fw-bold"><i class="ri-message-3-line text-primary me-2"></i> Conversation</h5>
                                    </div>
                                    
                                    <div class="card-body p-0 flex-grow-1">
                                        <div class="chat-container h-100" id="chatArea" data-ticket-id="{{ $ticket->id }}" data-last-id="{{ $ticket->messages->last() ? $ticket->messages->last()->id : 0 }}">
                                            @foreach($ticket->messages as $msg)
                                                <div class="chat-msg {{ $msg->is_admin_reply ? 'chat-admin' : 'chat-user' }}">
                                                    @if(!$msg->is_admin_reply)
                                                        <strong class="d-block mb-1" style="font-size: 12px; color: #013e48;">{{ $msg->sender->name ?? 'User' }}</strong>
                                                    @else
                                                        <strong class="d-block mb-1" style="font-size: 12px;">Admin</strong>
                                                    @endif
                                                    
                                                    @if($msg->message)
                                                        <p class="mb-2">{{ $msg->message }}</p>
                                                    @endif

                                                    @if($msg->attachment_path)
                                                        <div class="attachment-box mt-2 p-2 rounded bg-white bg-opacity-10 shadow-sm border border-white border-opacity-20 text-white">
                                                            @if($msg->attachment_type === 'image')
                                                                <a href="{{ asset($msg->attachment_path) }}" target="_blank">
                                                                    <img src="{{ asset($msg->attachment_path) }}" class="img-fluid rounded mb-1" style="max-height: 200px; object-fit: cover; width: 100%;">
                                                                </a>
                                                            @else
                                                                <div class="d-flex align-items-center">
                                                                    <i class="ri-file-pdf-2-line ri-2x me-2 text-danger"></i>
                                                                    <div class="overflow-hidden">
                                                                        <small class="d-block text-truncate">PDF Document</small>
                                                                        <a href="{{ asset($msg->attachment_path) }}" target="_blank" class="btn btn-sm btn-light py-0 px-2 mt-1">Download</a>
                                                                    </div>
                                                                </div>
                                                            @endif
                                                        </div>
                                                    @endif

                                                    <span class="chat-time">{{ $msg->created_at->format('M d, h:i A') }}</span>
                                                </div>
                                            @endforeach
                                        </div>
                                    </div>

                                    @if($ticket->status === 'open')
                                        <div class="card-footer bg-white border-top p-4">
                                            <form action="{{ route('super-admin.supports.reply', $ticket->id) }}" method="POST" enctype="multipart/form-data" id="replyForm" data-ticket-id="{{ $ticket->id }}">
                                                @csrf
                                                <div id="fileInfo" class="file-preview-strip d-none align-items-center justify-content-between">
                                                    <div class="d-flex align-items-center">
                                                        <i class="ri-file-3-line text-primary me-2"></i>
                                                        <span id="fileName" class="small fw-bold text-dark"></span>
                                                    </div>
                                                    <a href="javascript:void(0)" class="btn btn-sm btn-icon rounded-circle remove-file text-danger">
                                                        <i class="ri-close-line"></i>
                                                    </a>
                                                </div>
                                                <div class="reply-box-wrapper d-flex align-items-center px-2 py-1">
                                                    <div class="flex-shrink-0">
                                                        <label for="attachmentInput" class="btn btn-icon btn-text-secondary rounded-circle mb-0" title="Attach Image or PDF" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                                            <i class="ri-add-line ri-xl"></i>
                                                        </label>
                                                        <input type="file" name="attachment" id="attachmentInput" style="display: none;" accept="image/*,application/pdf">
                                                    </div>
                                                    <div class="flex-grow-1 mx-2" style="min-width: 0;">
                                                        <textarea name="message" class="form-control border-0 bg-transparent px-1 py-2 shadow-none" placeholder="Type your reply here..." rows="1" required style="resize:none; max-height: 120px; overflow-y: auto; width: 100%; display: block;" id="chatTextarea"></textarea>
                                                    </div>
                                                    <div class="flex-shrink-0">
                                                        <button class="btn btn-icon rounded-circle shadow-sm" type="submit" style="width: 40px; height: 40px; background-color: #0e606e; color: white; border: none; display: flex; align-items: center; justify-content: center;">
                                                            <i class="ri-send-plane-2-fill ri-lg"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="mt-2 text-center">
                                                    <small class="text-muted" style="font-size: 10px; letter-spacing: 0.5px;">Supported: JPG, PNG, PDF &bull; Max 10MB</small>
                                                </div>
                                            </form>
                                        </div>
                                    @else
                                        <div class="card-footer bg-light text-center text-muted border-top py-3">
                                            <i class="ri-lock-line me-1"></i> This ticket has been closed. No further replies can be added.
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>

                    </div>
                    @include('super-admin.inc.footer')
                </div>
            </div>
        </div>
    </div>
    @include('super-admin.inc.footer-links')
    <script>
        let pollingInterval = null;
        const ticketId = {{ $ticket->id }};

        // Scroll to bottom of chat
        function scrollToBottom() {
            const chatArea = document.getElementById('chatArea');
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        document.addEventListener('DOMContentLoaded', function() {
            scrollToBottom();
            startPolling();

            const replyForm = document.getElementById('replyForm');
            const attachmentInput = document.getElementById('attachmentInput');
            const fileInfo = document.getElementById('fileInfo');
            const fileName = document.getElementById('fileName');
            const removeFile = document.querySelector('.remove-file');

            if (attachmentInput) {
                attachmentInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        fileName.textContent = this.files[0].name;
                        fileInfo.classList.remove('d-none');
                        fileInfo.classList.add('d-flex');
                    } else {
                        fileInfo.classList.add('d-none');
                        fileInfo.classList.remove('d-flex');
                    }
                });
            }

            if (removeFile) {
                removeFile.addEventListener('click', function() {
                    attachmentInput.value = '';
                    fileInfo.classList.add('d-none');
                    fileInfo.classList.remove('d-flex');
                });
            }

            // AJAX Form Submission
            if (replyForm) {
                const textarea = document.getElementById('chatTextarea');

                // Enter to Send
                if (textarea) {
                    textarea.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (textarea.value.trim() !== '' || attachmentInput.value !== '') {
                                replyForm.requestSubmit();
                            }
                        }
                    });
                }

                replyForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const submitBtn = this.querySelector('button[type="submit"]');
                    const textarea = document.getElementById('chatTextarea');
                    const btnIcon = submitBtn.innerHTML;

                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

                    const formData = new FormData(this);

                    try {
                        const response = await fetch(this.action, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest'
                            }
                        });

                        const data = await response.json();

                        if (data.success) {
                            appendMessage(data.data);
                            const chatArea = document.getElementById('chatArea');
                            chatArea.dataset.lastId = data.data.id;
                            scrollToBottom();
                            
                            // Reset form
                            textarea.value = '';
                            attachmentInput.value = '';
                            fileInfo.classList.add('d-none');
                            fileInfo.classList.remove('d-flex');
                        }
                    } catch (error) {
                        console.error("Submission error:", error);
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="ri-send-plane-2-fill ri-lg"></i>';
                    }
                });
            }
        });

        function startPolling() {
            if (pollingInterval) return;
            pollingInterval = setInterval(fetchNewMessages, 3000);
        }

        async function fetchNewMessages() {
            const chatArea = document.getElementById('chatArea');
            const lastId = chatArea.dataset.lastId;
            const url = `{{ url('/super-admin/supports') }}/${ticketId}/messages?last_id=${lastId}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.success && data.messages.length > 0) {
                    data.messages.forEach(msg => {
                        appendMessage(msg);
                    });
                    chatArea.dataset.lastId = data.messages[data.messages.length - 1].id;
                    scrollToBottom();
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }

        function appendMessage(msg) {
            const chatArea = document.getElementById('chatArea');
            // Check if message already exists
            if (chatArea.querySelector(`[data-message-id="${msg.id}"]`)) return;

            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-msg ${msg.is_admin_reply ? 'chat-admin' : 'chat-user'}`;
            msgDiv.dataset.messageId = msg.id;

            let attachmentHtml = '';
            if (msg.attachment_path) {
                attachmentHtml = `
                    <div class="attachment-box mt-2 p-2 rounded bg-white bg-opacity-10 shadow-sm border border-white border-opacity-20 text-white">
                        ${msg.attachment_type === 'image' ? `
                            <a href="${msg.attachment_path}" target="_blank">
                                <img src="${msg.attachment_path}" class="img-fluid rounded mb-1" style="max-height: 200px; object-fit: cover; width: 100%;">
                            </a>
                        ` : `
                            <div class="d-flex align-items-center">
                                <i class="ri-file-pdf-2-line ri-2x me-2 text-danger"></i>
                                <div class="overflow-hidden">
                                    <small class="d-block text-truncate">PDF Document</small>
                                    <a href="${msg.attachment_path}" target="_blank" class="btn btn-sm btn-light py-0 px-2 mt-1">Download</a>
                                </div>
                            </div>
                        `}
                    </div>
                `;
            }

            msgDiv.innerHTML = `
                <strong class="d-block mb-1" style="font-size: 12px; ${!msg.is_admin_reply ? 'color: #013e48;' : ''}">${msg.is_admin_reply ? 'Admin' : (msg.sender_name || 'User')}</strong>
                ${msg.message ? `<p class="mb-2">${msg.message}</p>` : ''}
                ${attachmentHtml}
                <span class="chat-time">${msg.created_at}</span>
            `;

            chatArea.appendChild(msgDiv);
        }
    </script>
</body>
</html>
