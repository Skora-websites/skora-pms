<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctor | Chat</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Dreams Technologies">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @include('doctor.inc.header-links')
    <link rel="stylesheet" href="{{ asset('assets-doctor/css/all-chat-style.css') }}">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>
<body>
    <div class="main-wrapper">
        @include('doctor.inc.header')
        
        @include('doctor.inc.sidebar')
        <div class="page-wrapper">
            <div class="content">
                <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3">
                    <div class="flex-grow-1">
                        <h4 class="fs-18 fw-semibold mb-0 text-primary">Doctor Group Communication Chat</h4>
                    </div>
                    <div class="text-end">
                        <ol class="breadcrumb m-0 py-0">
                            <li class="breadcrumb-item"><a href="index.php">Home</a></li>
                            <li class="breadcrumb-item active" aria-current="page">Chat</li>
                        </ol>
                    </div>
                </div>

                <div class="chat-wrapper">
                    <div class="chat chat-messages show" id="middle">
                        <div>
                            <div class="chat-header">
                                <div class="user-details">
                                    <div class="d-xl-none">
                                        <a class="text-muted chat-close me-1" href="#">
                                            <i class="ti ti-circle-arrow-left"></i>
                                        </a>
                                    </div>
                                    <div class="avatar online flex-shrink-0">
                                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">D</div>
                                    </div>
                                    <div class="ms-2 overflow-hidden">
                                        <h6 class="fw-medium mb-1"><a href="" >Doctors Group <span class="member-count text-muted" id="member-count" style="font-size: 12px !important">({{ $memberCount ?? 0 }} members)</span></a></h6>
                                        <p class="fs-13 mb-0">Online</p>
                                    </div>
                                </div>

                                <div class="search-wrap w-50">
                                    <form id="search-form">
                                        <div class="input-group">
                                            <input type="text" class="form-control" placeholder="Search Messages...." id="search-messages">
                                            <span class="input-group-text"><i class="ti ti-search"></i></span>
                                        </div>
                                    </form>
                                </div>

                                <div class="chat-options">
                                    <ul class="list-unstyled">
                                        <li>
                                            <a href="javascript:void(0)" class="btn chat-search-btn" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Search">
                                                <i class="ti ti-search text-muted"></i>
                                            </a>
                                        </li>
                                        <li>
                                            <a class="btn no-bg" href="#" data-bs-toggle="dropdown">
                                                <i class="ti ti-dots-vertical text-muted"></i>
                                            </a>
                                            <ul class="dropdown-menu dropdown-menu-end">
                                                <li><a href="#" class="dropdown-item mute-chat"><i class="ti ti-volume-off me-2"></i>Mute Notification</a></li>
                                                <li><a href="#" class="dropdown-item clear-chat"><i class="ti ti-clear-all me-2"></i>Clear Message</a></li>
                                                <li><a href="#" class="dropdown-item delete-chat"><i class="ti ti-trash me-2"></i>Delete Chat</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>

                                
                            </div>

                            <div class="chat-body chat-page-group" data-simplebar>
                                <div class="messages" id="messages-container">
                                    @php
                                        $currentDate = null;
                                    @endphp
                                    @foreach ($messages as $msg)
                                        @php
                                            $messageDate = $msg->timestamp->format('Y-m-d');
                                            $today = \Carbon\Carbon::today()->format('Y-m-d');
                                            $yesterday = \Carbon\Carbon::yesterday()->format('Y-m-d');
                                            
                                            if ($messageDate === $today) {
                                                $displayDate = 'Today';
                                            } elseif ($messageDate === $yesterday) {
                                                $displayDate = 'Yesterday';
                                            } else {
                                                $displayDate = $msg->timestamp->format('M j, Y');
                                            }
                                        @endphp
                                        
                                        @if ($currentDate !== $messageDate)
                                            <div class="date-divider">
                                                <span>{{ $displayDate }}</span>
                                            </div>
                                            @php $currentDate = $messageDate; @endphp
                                        @endif
                                        
                                        <div class="chats {{ $msg->sender_id === auth()->id() ? 'chats-right' : '' }}" data-message-id="{{ $msg->id }}">
                                            <div class="chat-avatar">
                                                <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">
                                                    {{ substr($msg->sender->name, 0, 1) }}
                                                </div>
                                            </div>
                                            <div class="chat-content" data-id="{{ $msg->id }}">
                                                <div class="chat-info">
                                                    <div class="message-content" id="message-content-{{ $msg->id }}">
                                                        {!! nl2br(e($msg->content)) !!}
                                                    </div>
                                                    <div class="chat-actions">
                                                        <a href="#" data-bs-toggle="dropdown">
                                                            <i class="ti ti-dots-vertical" style="font-size: 12px;"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item copy-msg" href="#" data-message-id="{{ $msg->id }}"><i class="ti ti-copy me-2"></i>Copy</a></li>
                                                            @if ($msg->sender_id === auth()->id())
                                                                <li><a class="dropdown-item edit-msg" href="#" data-message-id="{{ $msg->id }}"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                                            @endif
                                                            <li><a class="dropdown-item delete-msg" href="#" data-message-id="{{ $msg->id }}"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div class="chat-profile-name {{ $msg->sender_id === auth()->id() ? 'text-end' : '' }}">
                                                    <h6>
                                                        <span class="doctor-name">{{ $msg->sender->name }}</span>
                                                        <span class="chat-time">{{ $msg->timestamp->format('h:i A') }}</span>
                                                        @if($msg->edited_at)
                                                            <small class="text-muted">(edited)</small>
                                                        @endif
                                                    </h6>
                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        </div>

                        <div class="chat-footer">
                            <form class="footer-form" id="chat-form">
                                <div class="chat-footer-wrap">
                                    <div class="form-item">
                                        <a href="#" id="mic-btn" class="action-circle"><i class="ti ti-microphone"></i></a>
                                    </div>
                                    <div class="form-wrap">
                                        <textarea class="form-controls" placeholder="Type a message" id="message-input" rows="1"></textarea>
                                    </div>
                                    <div class="form-btn">
                                        <button class="btn btn-primary" type="submit" id="send-btn">
                                            <i class="ti ti-send"></i>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            @include('doctor.inc.footer')
        </div>
    </div>
    @include('doctor.inc.footer-links')

    <!-- Voice Modal -->
    <div id="voiceModal" class="modal fade" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Voice Input <i class="ti ti-microphone text-danger"></i></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                    <div class="voice-animation mb-3">
                        <div class="voice-wave"></div>
                        <div class="voice-wave"></div>
                        <div class="voice-wave"></div>
                        <div class="voice-wave"></div>
                        <div class="voice-wave"></div>
                    </div>
                    <p id="transcriptPreview" class="mb-3">Listening... Speak now.</p>
                    <div class="d-flex gap-2 justify-content-center">
                        <button id="stopVoiceBtn" class="btn btn-danger btn-sm">
                            <i class="ti ti-square"></i> Stop
                        </button>
                        <button id="closeModalBtn" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
                            <i class="ti ti-x"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    $(document).ready(function() {
        let lastTimestamp = '{{ $messages->isEmpty() ? "1900-01-01" : $messages->last()->timestamp }}';
        let recognition = null;
        let isRecording = false;
        let finalTranscript = '';
        let isSending = false;
        let currentEditMessageId = null;
        let originalEditText = '';

        // Custom Notification Function
        function showNotification(msg, type = 'success') {
            // Remove existing notifications
            $('.custom-alert-box').remove();
            
            let alertClass = 'alert-' + type;
            let iconClass = '';
            let textClass = '';

            switch (type) {
                case 'success':
                    iconClass = 'fas fa-check-circle text-success';
                    textClass = 'text-success';
                    break;
                case 'error':
                    iconClass = 'fas fa-exclamation-circle text-danger';
                    textClass = 'text-danger';
                    break;
                case 'info':
                    iconClass = 'fas fa-info-circle text-info';
                    textClass = 'text-info';
                    break;
                case 'warning':
                    iconClass = 'fas fa-exclamation-triangle text-warning';
                    textClass = 'text-warning';
                    break;
                default:
                    iconClass = 'fas fa-check-circle text-success';
                    textClass = 'text-success';
            }

            var alertBox = document.createElement("div");
            alertBox.className = `custom-alert-box ${alertClass} notification-sidebar position-fixed top-2 show-notification mt-3 shadow-lg rounded`;
            alertBox.innerHTML = `
                <div class="${textClass} p-custom">
                    <i class="${iconClass} icon"></i>
                    ${msg}
                    <button type="button" class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
            `;
            document.body.appendChild(alertBox);
            
            // Auto remove after 4 seconds
            setTimeout(() => {
                if (alertBox.parentElement) {
                    alertBox.style.transition = "right 0.5s ease-in-out, opacity 0.5s ease";
                    alertBox.style.opacity = "0";
                    setTimeout(() => {
                        if (alertBox.parentElement) {
                            alertBox.remove();
                        }
                    }, 500);
                }
            }, 4000);
        }

        // Voice Recognition Functions
        function initializeVoiceRecognition() {
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onstart = function() {
                    isRecording = true;
                    $('#mic-btn').addClass('recording');
                    $('#voiceModal').modal('show');
                };

                recognition.onresult = function(event) {
                    let interimTranscript = '';
                    finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    const previewText = finalTranscript || interimTranscript;
                    $('#transcriptPreview').text(previewText || 'Listening... Speak now.');
                };

                recognition.onerror = function(event) {
                    console.error('Speech recognition error:', event.error);
                    stopVoiceRecognition();
                    if (event.error === 'not-allowed') {
                        showNotification('Microphone access denied. Please allow microphone permissions.', 'error');
                    }
                };

                recognition.onend = function() {
                    stopVoiceRecognition();
                };

            } else {
                $('#mic-btn').hide();
                showNotification('Voice recognition not supported in this browser', 'warning');
            }
        }

        function startVoiceRecognition() {
            if (!recognition) {
                initializeVoiceRecognition();
            }
            
            if (recognition && !isRecording) {
                finalTranscript = '';
                $('#transcriptPreview').text('Listening... Speak now.');
                try {
                    recognition.start();
                } catch (error) {
                    console.error('Error starting recognition:', error);
                    initializeVoiceRecognition();
                    recognition.start();
                }
            }
        }

        function stopVoiceRecognition() {
            if (recognition && isRecording) {
                recognition.stop();
                isRecording = false;
                $('#mic-btn').removeClass('recording');
                $('#voiceModal').modal('hide');

                if (finalTranscript.trim()) {
                    const currentText = $('#message-input').val();
                    $('#message-input').val(currentText + (currentText ? ' ' : '') + finalTranscript.trim());
                    autoResizeTextarea();
                    showNotification('Voice input added to message', 'success');
                }
            }
        }

        // Auto-resize textarea
        function autoResizeTextarea() {
            const textarea = $('#message-input');
            textarea.css('height', 'auto');
            textarea.css('height', Math.min(textarea[0].scrollHeight, 100) + 'px');
        }

        // Send message function
        function sendMessage() {
            if (isSending) return;
            
            const message = $('#message-input').val().trim();
            if (message) {
                isSending = true;
                const data = { content: message };
                
                $.ajax({
                    url: '/chat/send',
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                    success: function (msg) {
                        addMessageToDOM(msg);
                        $('#message-input').val('');
                        $('#message-input').css('height', 'auto');
                        scrollToBottom();
                        showNotification('Message sent successfully!', 'success');
                        isSending = false;
                    },
                    error: function(err) {
                        console.error('Send error:', err);
                        showNotification('Error sending message. Please try again.', 'error');
                        isSending = false;
                    }
                });
            }
        }

        // Add message to DOM
        function addMessageToDOM(msg) {
            const isSent = msg.sender_id === {{ auth()->id() }};
            const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const messageDate = new Date(msg.timestamp).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            let displayDate = '';
            if (messageDate === today) {
                displayDate = 'Today';
            } else if (messageDate === yesterday) {
                displayDate = 'Yesterday';
            } else {
                displayDate = new Date(msg.timestamp).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
            }
            
            const lastDateDivider = $('.date-divider').last();
            const lastDate = lastDateDivider.length ? lastDateDivider.find('span').text() : null;
            
            if (lastDate !== displayDate) {
                const dateHtml = `
                    <div class="date-divider">
                        <span>${displayDate}</span>
                    </div>
                `;
                $('#messages-container').append(dateHtml);
            }
            
            const html = `
                <div class="chats ${isSent ? 'chats-right' : ''}" data-message-id="${msg.id}">
                    <div class="chat-avatar">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">
                            ${msg.sender.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div class="chat-content" data-id="${msg.id}">
                        <div class="chat-info">
                            <div class="message-content" id="message-content-${msg.id}">
                                ${msg.content.replace(/\n/g, '<br>')}
                            </div>
                            <div class="chat-actions">
                                <a href="#" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical" style="font-size: 12px;"></i>
                                </a>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item copy-msg" href="#" data-message-id="${msg.id}"><i class="ti ti-copy me-2"></i>Copy</a></li>
                                    ${isSent ? `
                                    <li><a class="dropdown-item edit-msg" href="#" data-message-id="${msg.id}"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                    ` : ''}
                                    <li><a class="dropdown-item delete-msg" href="#" data-message-id="${msg.id}"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="chat-profile-name ${isSent ? 'text-end' : ''}">
                            <h6>
                                <span class="doctor-name">${msg.sender.name}</span>
                                <span class="chat-time">${time}</span>
                                ${msg.edited_at ? '<small class="text-muted">(edited)</small>' : ''}
                            </h6>
                        </div>
                    </div>
                </div>
            `;
            $('#messages-container').append(html);
            scrollToBottom();
        }

        // Scroll to bottom
        function scrollToBottom() {
            const container = $('.chat-body');
            const scrollHeight = container[0].scrollHeight;
            container.stop().animate({ scrollTop: scrollHeight }, 100);
        }

        // Event Handlers
        $('#chat-form').on('submit', function(e) {
            e.preventDefault();
            sendMessage();
        });

        // Enter key handler
        $('#message-input').on('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
                return false;
            }
        });

        // Auto-resize on input
        $('#message-input').on('input', autoResizeTextarea);

        // Voice Recognition Events
        $('#mic-btn').click(function(e) {
            e.preventDefault();
            if (isRecording) {
                stopVoiceRecognition();
            } else {
                startVoiceRecognition();
            }
        });

        $('#stopVoiceBtn').click(function() {
            stopVoiceRecognition();
        });

        $('#closeModalBtn').click(function() {
            stopVoiceRecognition();
        });

        $('#voiceModal').on('hidden.bs.modal', function() {
            stopVoiceRecognition();
        });

        // Copy message
        $(document).on('click', '.copy-msg', function(e) {
            e.preventDefault();
            const messageId = $(this).data('message-id');
            const content = $(`#message-content-${messageId}`).text();
            navigator.clipboard.writeText(content).then(() => {
                showNotification('Message copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Failed to copy message', 'error');
            });
        });

        // Edit message - COMPLETELY FIXED
        $(document).on('click', '.edit-msg', function(e) {
            e.preventDefault();
            const messageId = $(this).data('message-id');
            startEditMode(messageId);
        });

        function startEditMode(messageId) {
            // Close any other open edits first
            if (currentEditMessageId && currentEditMessageId !== messageId) {
                cancelEditMode(currentEditMessageId);
            }

            const messageElement = $(`#message-content-${messageId}`);
            originalEditText = messageElement.text().trim(); // Store original text
            
            currentEditMessageId = messageId;
            
            // Replace with textarea for editing - preserve exact formatting
            messageElement.html(`<textarea class="edit-input">${originalEditText}</textarea>`);
            
            const textarea = messageElement.find('.edit-input');
            
            // Set focus and select all text
            textarea.focus();
            textarea[0].setSelectionRange(0, textarea.val().length);
            
            // Auto-resize
            autoResizeEditTextarea(textarea[0]);
            
            // Event handlers for the edit textarea
            textarea.off('keydown.edit').on('keydown.edit', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit(messageId);
                } else if (e.key === 'Escape') {
                    cancelEditMode(messageId);
                }
                // Shift+Enter will create new line automatically
            });
            
            textarea.off('input.edit').on('input.edit', function() {
                autoResizeEditTextarea(this);
            });
            
            // Remove blur handler completely - edit box stays open until manually saved
            textarea.off('blur.edit');
            
            // Add save button to the edit interface
            messageElement.append(`
                <div class="edit-actions mt-2">
                    <button class="btn btn-success btn-sm save-edit" data-message-id="${messageId}">
                        <i class="ti ti-check me-1"></i>Save
                    </button>
                    <button class="btn btn-secondary btn-sm cancel-edit ms-1" data-message-id="${messageId}">
                        <i class="ti ti-x me-1"></i>Cancel
                    </button>
                </div>
            `);
            
            // Save button handler
            $(document).off('click.saveEdit').on('click.saveEdit', '.save-edit', function(e) {
                e.preventDefault();
                const msgId = $(this).data('message-id');
                saveEdit(msgId);
            });
            
            // Cancel button handler
            $(document).off('click.cancelEdit').on('click.cancelEdit', '.cancel-edit', function(e) {
                e.preventDefault();
                const msgId = $(this).data('message-id');
                cancelEditMode(msgId);
            });
        }

        function saveEdit(messageId) {
            const messageElement = $(`#message-content-${messageId}`);
            const textarea = messageElement.find('.edit-input');
            const newText = textarea.val().trim();
            
            if (newText && newText !== originalEditText) {
                $.ajax({
                    url: `/chat/update/${messageId}`,
                    type: 'PUT',
                    data: { 
                        content: newText,
                        _token: $('meta[name="csrf-token"]').attr('content')
                    },
                    success: function(response) {
                        // Update with exact formatting including line breaks
                        messageElement.html(newText.replace(/\n/g, '<br>'));
                        showNotification('Message updated successfully!', 'success');
                        currentEditMessageId = null;
                        originalEditText = '';
                    },
                    error: function(err) {
                        console.error('Update error:', err);
                        messageElement.html(originalEditText.replace(/\n/g, '<br>'));
                        showNotification('Error updating message!', 'error');
                        currentEditMessageId = null;
                        originalEditText = '';
                    }
                });
            } else if (newText === originalEditText) {
                // No changes made, just cancel
                cancelEditMode(messageId);
            } else {
                // Empty text, show error
                showNotification('Message cannot be empty!', 'error');
                textarea.focus();
            }
        }

        function cancelEditMode(messageId) {
            const messageElement = $(`#message-content-${messageId}`);
            // Restore original text with proper formatting
            messageElement.html(originalEditText.replace(/\n/g, '<br>'));
            currentEditMessageId = null;
            originalEditText = '';
        }

        function autoResizeEditTextarea(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }

        // Delete message
        $(document).on('click', '.delete-msg', function(e) {
            e.preventDefault();
            const messageId = $(this).data('message-id');
            
            Swal.fire({
                title: 'Are you sure?',
                text: "You want to delete this message!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6e7d88',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: `/chat/delete/${messageId}`,
                        type: 'DELETE',
                        headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
                        success: () => {
                            $(`.chats[data-message-id="${messageId}"]`).remove();
                            Swal.fire({
                                title: 'Deleted!',
                                text: 'Your message has been deleted.',
                                icon: 'success',
                                timer: 2000,
                                confirmButtonColor: '#0c4843'
                            });
                        },
                        error: (err) => {
                            Swal.fire('Error!', 'Something went wrong.', 'error');
                        }
                    });
                }
            });
        });

        // Search functionality
        $('#search-form').on('submit', function(e) {
            e.preventDefault();
        });

        $('#search-messages').on('input', function() {
            const query = $(this).val().trim();
            if (query.length >= 2) {
                $.get('/chat/search', { query: query })
                    .done(function(results) {
                        $('#messages-container').empty();
                        results.forEach(addMessageToDOM);
                        showNotification(`Found ${results.length} messages`, 'info');
                    })
                    .fail(function() {
                        showNotification('Error searching messages', 'error');
                    });
            } else if (query.length === 0) {
                location.reload();
            }
        });

        // Toggle search
        $('.chat-search-btn').click(function() {
            $('.search-wrap').toggleClass('active');
            $('#search-messages').focus();
        });

        // Hide search when clicking outside
        $(document).click(function(e) {
            if (!$(e.target).closest('.search-wrap, .chat-search-btn').length) {
                $('.search-wrap').removeClass('active');
            }
        });

        // Clear chat
        $('.clear-chat').click(function(e) {
            e.preventDefault();
            Swal.fire({
                title: 'Clear Chat?',
                text: "This will remove all messages from the group!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6e7d88',
                confirmButtonText: 'Yes, clear it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    $.post('/chat/clear', { 
                        _token: $('meta[name="csrf-token"]').attr('content') 
                    }).done(function() {
                        $('#messages-container').empty();
                        Swal.fire({
                            title: 'Cleared!',
                            text: 'All messages have been cleared.',
                            icon: 'success',
                            timer: 2000,
                            confirmButtonColor: '#0c4843'
                        });
                    }).fail(function() {
                        Swal.fire('Error!', 'Could not clear chat.', 'error');
                    });
                }
            });
        });

        // Poll for new messages
        setInterval(function() {
            $.ajax({
                url: '/chat/new-messages',
                type: 'GET',
                data: { last_timestamp: lastTimestamp },
                success: function(messages) {
                    if (messages.length > 0) {
                        messages.forEach(addMessageToDOM);
                        lastTimestamp = messages[messages.length - 1].timestamp;
                        scrollToBottom();
                        
                        if (messages.length > 0 && document.hidden) {
                            showNotification('New message in Doctors Group', 'info');
                        }
                    }
                },
                error: function(err) {
                    console.error('Polling error:', err);
                }
            });
        }, 3000);

        // Initialize tooltips
        $('[data-bs-toggle="tooltip"]').tooltip();

        // Scroll to bottom on page load
        setTimeout(scrollToBottom, 100);
    });
    </script>
</body>
</html>