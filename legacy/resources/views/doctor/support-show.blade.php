<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | View Ticket #{{ str_pad($ticket->id, 5, '0', STR_PAD_LEFT) }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    @include('doctor.inc.header-links')
    @include('doctor.inc.custom')

    <style>
        .page-header-color { color: #0e606e; }
        .chat-container { display: flex; flex-direction: column; gap: 20px; max-height: 60vh; overflow-y: auto; padding: 25px; background: #fdfdfd; border-radius: 16px; scroll-behavior: smooth; }
        .chat-msg { max-width: 80%; padding: 14px 20px; border-radius: 20px; position: relative; font-size: 14.5px; line-height: 1.5; word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; }
        .chat-doctor { background: #0e606e; color: white; align-self: flex-end; border-bottom-right-radius: 2px; box-shadow: 0 4px 15px rgba(14,96,110,0.15); }
        .chat-admin { background: #f0f4f5; color: #2c3e50; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #e1e8ea; }
        .chat-time { display: block; font-size: 10.5px; margin-top: 6px; font-weight: 500; }
        .chat-doctor .chat-time { color: rgba(255,255,255,0.7); text-align: right; }
        .chat-admin .chat-time { color: #8e9aaf; }
        
        .ticket-info-card { border-top: 4px solid #0e606e; border-radius: 12px; }
        .reply-box-wrapper { background: #fff; border-radius: 30px; box-shadow: 0 -5px 25px rgba(0,0,0,0.03); transition: all 0.3s ease; border: 1.5px solid #eee; }
        .reply-box-wrapper:focus-within { border-color: #0e606e; box-shadow: 0 5px 20px rgba(14,96,110,0.08); }
        .file-preview-strip { background: #f8f9fa; border-radius: 12px 12px 0 0; padding: 8px 15px; border-bottom: 1px dashed #e0e0e0; margin-bottom: -1px; }
        .btn-theme { background-color: #0e606e; color: white; border-radius: 50px; padding: 10px 25px; transition: all 0.3s; border: none; }
        .btn-theme:hover { background-color: #0b4b56; color: white; }
    </style>
</head>
<body>
    <div class="main-wrapper">
        @include('doctor.inc.header')
        @include('doctor.inc.sidebar')

        <div class="page-wrapper">
            <div class="content">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <a href="{{ route('doctor.supports') }}" class="text-muted d-block mb-1"><i class="ri-arrow-left-line"></i> Back to Support</a>
                        <h4 class="mb-0 page-header-color fw-bold">Ticket #{{ str_pad($ticket->id, 5, '0', STR_PAD_LEFT) }}</h4>
                    </div>
                    <div>
                        <span class="badge rounded-pill {{ $ticket->status === 'open' ? 'bg-label-success' : 'bg-label-danger' }} fs-6">
                            {{ ucfirst($ticket->status) }}
                        </span>
                    </div>
                </div>

                @if(session('success'))
                    <div class="alert alert-success alert-dismissible" role="alert">
                        {{ session('success') }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                @endif

                <div class="row g-4">
                    <!-- Ticket Info -->
                    <div class="col-md-4 col-lg-3">
                        <div class="card ticket-info-card shadow-sm h-100">
                            <div class="card-body">
                                <div class="info-item mb-4">
                                    <small class="text-muted d-block text-uppercase fw-bold mb-1">Subject</small>
                                    <p class="text-dark fw-bold mb-0">{{ $ticket->subject }}</p>
                                </div>
                                <hr class="my-4">
                                <div class="info-item mb-3">
                                    <small class="text-muted d-block text-uppercase fw-bold mb-1">Status</small>
                                    <span class="badge {{ $ticket->status === 'open' ? 'bg-success' : 'bg-danger' }}">{{ ucfirst($ticket->status) }}</span>
                                </div>
                                <div class="info-item">
                                    <small class="text-muted d-block text-uppercase fw-bold mb-1">Created At</small>
                                    <span class="text-dark small">{{ $ticket->created_at->format('M d, Y h:i A') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Chat Component -->
                    <div class="col-md-8 col-lg-9">
                        <div class="card shadow-sm border-0 h-100 d-flex flex-column">
                            <div class="card-header border-bottom bg-white py-3">
                                <h5 class="mb-0 fw-bold"><i class="ri-message-3-line text-primary me-2"></i> Messages</h5>
                            </div>
                            
                            <div class="card-body p-0 flex-grow-1">
                                <div class="chat-container h-100" id="chatArea" data-ticket-id="{{ $ticket->id }}" data-last-id="{{ $ticket->messages->last() ? $ticket->messages->last()->id : 0 }}">
                                    @foreach($ticket->messages as $msg)
                                        <div class="chat-msg {{ $msg->is_admin_reply ? 'chat-admin' : 'chat-doctor' }}" data-message-id="{{ $msg->id }}">
                                            <strong class="d-block mb-1" style="font-size: 11px; {{ !$msg->is_admin_reply ? 'color:rgba(255,255,255,0.8);' : 'color:#0e606e;' }}">
                                                {{ $msg->is_admin_reply ? 'Admin Support' : 'You' }}
                                            </strong>
                                            
                                            @if($msg->message)
                                                <p class="mb-2">{{ $msg->message }}</p>
                                            @endif

                                            @if($msg->attachment_path)
                                                <div class="attachment-box mt-2 p-2 rounded {{ $msg->is_admin_reply ? 'bg-white bg-opacity-50' : 'bg-white bg-opacity-10' }} shadow-sm border border-opacity-20">
                                                    @if($msg->attachment_type === 'image')
                                                        <a href="{{ asset($msg->attachment_path) }}" target="_blank">
                                                            <img src="{{ asset($msg->attachment_path) }}" class="img-fluid rounded mb-1" style="max-height: 200px; object-fit: cover; width: 100%;">
                                                        </a>
                                                    @else
                                                        <div class="d-flex align-items-center">
                                                            <i class="ri-file-pdf-2-line ri-2x me-2 text-danger"></i>
                                                            <div class="overflow-hidden">
                                                                <small class="d-block text-truncate {{ $msg->is_admin_reply ? 'text-dark' : 'text-white' }}">PDF Document</small>
                                                                <a href="{{ asset($msg->attachment_path) }}" target="_blank" class="btn btn-sm {{ $msg->is_admin_reply ? 'btn-outline-primary' : 'btn-light' }} py-0 px-2 mt-1">Download</a>
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
                                    <form action="{{ route('doctor.supports.reply', $ticket->id) }}" method="POST" enctype="multipart/form-data" id="replyForm" data-ticket-id="{{ $ticket->id }}">
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
                                                <button class="btn btn-theme btn-icon rounded-circle shadow-sm" type="submit" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                                    <i class="ri-send-plane-2-fill ri-lg"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            @else
                                <div class="card-footer bg-light text-center text-muted border-top py-3">
                                    <i class="ri-lock-line me-1"></i> This ticket has been closed.
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
            @include('doctor.inc.footer')
        </div>
    </div>

    @include('doctor.inc.footer-links')

    <script>
        let pollingIntervalId = null;
        const ticketId = {{ $ticket->id }};

        function scrollToBottom() {
            const chatArea = document.getElementById('chatArea');
            if(chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            scrollToBottom();
            startPolling();

            // File selection feedback
            const attachmentInput = document.getElementById('attachmentInput');
            const fileInfo = document.getElementById('fileInfo');
            const fileName = document.getElementById('fileName');
            const removeFile = document.querySelector('.remove-file');

            if(attachmentInput) {
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

                if(removeFile) {
                    removeFile.addEventListener('click', function() {
                        attachmentInput.value = '';
                        fileInfo.classList.add('d-none');
                        fileInfo.classList.remove('d-flex');
                    });
                }
            }

            // AJAX Form Submission
            if (replyForm) {
                const textarea = document.getElementById('chatTextarea');

                // Enter to Send
                textarea.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        replyForm.dispatchEvent(new Event('submit'));
                    }
                });

                replyForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const submitBtn = this.querySelector('button[type="submit"]');
                    const textarea = document.getElementById('chatTextarea');

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
            if (pollingIntervalId) return;
            fetchNewMessages();
        }

        async function fetchNewMessages() {
            const chatArea = document.getElementById('chatArea');
            if(!chatArea) return;
            
            const lastId = chatArea.dataset.lastId;
            const url = `{{ url('/support') }}/${ticketId}/messages?last_id=${lastId}`;

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
            } finally {
                pollingIntervalId = setTimeout(fetchNewMessages, 3000);
            }
        }

        function appendMessage(msg) {
            const chatArea = document.getElementById('chatArea');
            if (!chatArea || chatArea.querySelector(`[data-message-id="${msg.id}"]`)) return;

            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-msg ${msg.is_admin_reply ? 'chat-admin' : 'chat-doctor'}`;
            msgDiv.dataset.messageId = msg.id;

            let attachmentHtml = '';
            if (msg.attachment_path) {
                attachmentHtml = `
                    <div class="attachment-box mt-2 p-2 rounded ${msg.is_admin_reply ? 'bg-white bg-opacity-50' : 'bg-white bg-opacity-10'} shadow-sm border border-opacity-20">
                        ${msg.attachment_type === 'image' ? `
                            <a href="${msg.attachment_path}" target="_blank">
                                <img src="${msg.attachment_path}" class="img-fluid rounded mb-1" style="max-height: 200px; object-fit: cover; width: 100%;">
                            </a>
                        ` : `
                            <div class="d-flex align-items-center">
                                <i class="ri-file-pdf-2-line ri-2x me-2 text-danger"></i>
                                <div class="overflow-hidden">
                                    <small class="d-block text-truncate ${msg.is_admin_reply ? 'text-dark' : 'text-white'}">PDF Document</small>
                                    <a href="${msg.attachment_path}" target="_blank" class="btn btn-sm ${msg.is_admin_reply ? 'btn-outline-primary' : 'btn-light'} py-0 px-2 mt-1">Download</a>
                                </div>
                            </div>
                        `}
                    </div>
                `;
            }

            msgDiv.innerHTML = `
                <strong class="d-block mb-1" style="font-size: 11px; ${!msg.is_admin_reply ? 'color:rgba(255,255,255,0.8);' : 'color:#0e606e;'}">
                    ${msg.is_admin_reply ? 'Admin Support' : 'You'}
                </strong>
                ${msg.message ? `<p class="mb-2">${msg.message}</p>` : ''}
                ${attachmentHtml}
                <span class="chat-time">${msg.created_at}</span>
            `;

            chatArea.appendChild(msgDiv);
        }
    </script>
</body>
</html>
