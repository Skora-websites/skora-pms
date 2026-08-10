

<style>
      .dashboard-card-bg{
          background-color: rgb(135 76 245 / 33%) !important;
          color: #0e606e6e !important;
          cursor: pointer !important;
    }

    .dashboard-card-bg:hover{
          background-color: rgb(135 76 245 / 33%) !important;
          color: #0e606e !important;
          cursor: pointer !important;
    }

    .card-text{
      color: #5f19da;
    font-weight: 800 !important;
    }

    .card-header h5{
        color: #0e606e !important;
        font-weight: 700 !important;
        font-size:1rem !important;
    }


     .card-header h6{
        color: #d8d7da !important;
        font-weight: 700 !important;
    }

    .card-header .card-subtitle{
    color: #0e606ea8 !important;
    }

    .floating-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background-color: #0e606e;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      transition: background-color 0.3s ease, transform 0.2s;
    }

    .floating-btn:hover {
      background-color: #6b3cc9;
      transform: scale(1.1);
    }

    .help-panel {
      position: fixed;
      bottom: 0;
      right: 0;
      width: min(100%, 400px);
      height: calc(100vh - 60px);
      background-color: #f3e9ff;
      border-radius: 10px 10px 0 0;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9000;
      display: none;
      flex-direction: column;
      transition: all 0.3s ease;
    }

    .help-panel.active {
      display: flex;
    }

    .help-header {
      background-color: #0e606e;
      color: #fff;
      padding: 10px 15px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }

    .help-header h6 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .help-header .header-buttons {
      display: flex;
      gap: 10px;
    }

    .help-header button {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      font-size: 16px;
    }

    .help-body {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      background-color: #f5f4f6;
    }

    .chat-container {
      height: 100%;
      display: flex;
      font-size: 11px;
      flex-direction: column;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      scroll-behavior: smooth;
    }

    .date-separator {
      text-align: center;
      margin: 10px 0;
      color: #555;
      }

    .message {
      margin-bottom: 10px;
      padding: 8px 12px;
      border-radius: 7px;
      position: relative;
      display: table;
      /* flex-direction: column; */
      animation: fadeIn 0.3s ease;
    }

    .user-message {
      background-color: #b8fcac;
      color: #000;
      margin-left: auto;
      border-bottom-right-radius: 2px;
    }

    .user-message::after {
      content: "";
    transform: rotate(31deg);
    position: absolute;
    top: -9px;
    right: 0px;
    border: 8px solid #c53f3f00;
    border-bottom-color: #b8fcac;
    border-right-color: #b8fcac;
    }

    .bot-message {
      background-color: #fff;
      color: #000;
      margin-right: auto;
      border-bottom-left-radius: 2px;
    }

    .bot-message::after {
          content: "";
        position: absolute;
        top: -10px;
        transform: rotate(-23deg);
        left: 0px;
        border: 8px solid transparent;
        border-bottom-color: #fff;
        border-left-color: #fff;
    }

    .timestamp {
      font-size: 10px;
      color: #666;
      margin-top: 4px;
      align-self: flex-end;
    }

 

    .message-menu {
      position: absolute;
      background: #fff;
      border: 1px solid #ddd;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 10;
      padding: 5px;
      border-radius: 5px;
    }

    .message-menu button {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      background: none;
      padding: 6px 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .message-menu button:hover {
      background: #f0f0f0;
    }

    .chat-input {
      display: flex;
      padding: 2px;
      background: #fff;
      border-radius: 70px;
      border-top: 1px solid #ddd;
      align-items: center;
    }

    .chat-input input {
      flex: 1;
      border: none;
      padding: 10px;
      border-radius: 20px;
      background: #f0f0f0;
      margin: 0 8px 0 0;
    }

    .chat-input .input-buttons {
      display: flex;
    }

    .chat-input button {
      background: none;
      border: none;
      color: #0e606e;
      font-size: 16px;
      cursor: pointer;
    }

    .help-body input[type="text"] {
          border-radius: 20px;
          background: #fff;
          border: 1px solid #ddd;
          padding: 8px;
          font-size: 13px;         
         margin-bottom: 3px;

    }
</style>

<!-- Icons of supper Admins for chating and AI chat -->
<link rel="stylesheet" href="{{ asset('assets/vendor/fonts/remixicon/remixicon.css') }}" />
<link rel="stylesheet" href="{{ asset('assets/vendor/fonts/flag-icons.css') }}" />

<!-- Help Panel -->
<div id="helpPanel" class="help-panel" role="region" aria-label="Chat Panel">
    <div class="help-header">
        <div class="header-left">
            <button id="backButton" class="back-btn" aria-label="Close chat"><i class="fas fa-arrow-left"></i></button>
            <h6 class="fw-bold text-white"> Skora Assistance</h6>
        </div>
        <div class="header-buttons">
            <button id="searchToggle" aria-label="Toggle search">
                <i class="ri-search-line"></i>
            </button>
            <button id="expandChat" aria-label="Expand chat">
                <i class="ri-fullscreen-line"></i>
            </button>
            <button id="clearChat" aria-label="Clear chat history">
                <i class="ri-delete-bin-line"></i>
            </button>
        </div>
    </div>
    <div class="help-body">
        <input type="text" id="messageSearch" placeholder="Search messages..." style="display: none; width: 100%; border: none; outline: none; font-size: 14px; padding: 8px; border-radius: 25px; box-shadow: 0 1px 3px rgba(37, 15, 179, 0.68); margin-bottom: 14px;" aria-label="Search chat messages">
        <div id="chatContainer" class="chat-container">
            <div id="chatMessages" class="chat-messages" role="log" aria-live="polite"></div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Type a message..." maxlength="2000" aria-label="Type a message" style="flex: 1; border: none; outline: none; font-size: 14px; padding: 8px; border-radius: 25px;">
                <button id="sendMessage" aria-label="Send message" style="background: none; border: none; cursor: pointer; padding: 5px; ">
                    <i class="ri-send-plane-line" style="font-size: 20px; color: #32549b;"></i>
                </button>
                <div class="input-buttons">
                    <button id="emojiButton" aria-label="Add emoji">
                        <i class="ri-emotion-line"></i>
                    </button>
                    <button id="attachImage" aria-label="Attach image">
                        <i class="ri-attachment-line"></i>
                    </button>
                    <button id="capturePhoto" aria-label="Capture photo">
                        <i class="ri-camera-line"></i>
                    </button>
                </div>
            </div>
        </div>
        <input type="file" id="imageUpload" accept="image/*" style="display: none;" aria-label="Upload image">
        <video id="cameraPreview" style="display: none;"></video>
        <canvas id="cameraCanvas" style="display: none;"></canvas>
    </div>
</div>

<!-- Message Menu -->
<div id="messageMenu" class="message-menu" style="display: none;">
    <button id="editMessageBtn" aria-label="Edit message">Edit</button>
    <button id="deleteMessageBtn" aria-label="Delete message">Delete</button>
</div>

<!-- Floating Button -->
<button id="toggleButton" class="floating-btn" aria-label="Toggle Chat Panel" style="display: flex;">
    <i id="toggleIcon" class="ri-chat-3-line"></i>
</button>

<script>
    // State Management
    const state = {
        ticketId: null,
        lastMessageId: 0,
        isExpanded: false,
        maxFileSize: 10 * 1024 * 1024, // 10MB to match backend
        pollingInterval: null,
        stream: null,
        isTabActive: true,
        pollingFailureCount: 0,
        basePollingInterval: 3000,
        currentPollingInterval: 3000,
        maxPollingInterval: 30000,
        isLoadingHistory: false
    };

    // ... (elements remain same) ...

    // Visibility API Implementation
    document.addEventListener("visibilitychange", () => {
        state.isTabActive = !document.hidden;
        if (state.isTabActive && elements.helpPanel.classList.contains("active")) {
            console.log("Tab active, resuming polling...");
            startPolling();
        } else {
            console.log("Tab hidden, pausing polling...");
            stopPolling();
        }
    });

    // Utility Functions
    const utils = {
        sanitizeInput(input) {
            const div = document.createElement("div");
            div.textContent = input;
            return div.innerHTML;
        },
        formatTime(dateStr) {
            return dateStr; 
        }
    };

    // Core Functions
    function toggleHelpPanel() {
        elements.helpPanel.classList.toggle("active");
        elements.toggleButton.style.display = elements.helpPanel.classList.contains("active") ? "none" : "flex";
        if (elements.helpPanel.classList.contains("active")) {
            elements.chatInput.focus();
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
            if (!state.ticketId && !state.isLoadingHistory) {
                loadChatHistory();
            } else {
                startPolling();
            }
        } else {
            stopPolling();
        }
    }

    async function loadChatHistory() {
        if (state.isLoadingHistory) return;
        state.isLoadingHistory = true;
        
        elements.chatMessages.innerHTML = '<div class="text-center p-3"><span class="spinner-border spinner-border-sm text-primary"></span><br><small class="text-muted">Loading history...</small></div>';

        try {
            const response = await fetch('{{ route("assistant.support.ticket") }}');
            const data = await response.json();
            
            if (data.success) {
                state.ticketId = data.ticket_id;
                elements.chatMessages.innerHTML = '';
                
                if (data.messages && data.messages.length > 0) {
                    data.messages.forEach(msg => {
                        appendBackendMessage(msg);
                    });
                    state.lastMessageId = data.messages[data.messages.length - 1].id;
                }
                elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
                
                // Start polling now that we have a ticketId
                startPolling();
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
            elements.chatMessages.innerHTML = '<div class="text-center p-3 text-danger"><small>Failed to load chat history.</small></div>';
        } finally {
            state.isLoadingHistory = false;
        }
    }

    function appendBackendMessage(msg) {
        if (document.querySelector(`[data-msg-id="${msg.id}"]`)) return;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", msg.is_admin_reply ? "bot-message" : "user-message");
        messageDiv.dataset.msgId = msg.id;
        messageDiv.setAttribute("role", "article");

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("content");
        
        if (msg.attachment_path) {
            if (msg.attachment_type === 'image') {
                const img = document.createElement("img");
                img.src = msg.attachment_path;
                img.style.maxWidth = "100%";
                img.style.borderRadius = "8px";
                img.alt = "Attachment";
                img.onclick = () => window.open(msg.attachment_path, '_blank');
                contentDiv.appendChild(img);
            } else {
                contentDiv.innerHTML = `<div class="d-flex align-items-center p-2 bg-light rounded" style="cursor:pointer;" onclick="window.open('${msg.attachment_path}', '_blank')">
                    <i class="ri-file-pdf-line ri-2x text-danger me-2"></i>
                    <small class="text-dark">View PDF Attachment</small>
                </div>`;
            }
        }

        if (msg.message) {
            const textPara = document.createElement("p");
            textPara.textContent = msg.message;
            textPara.style.margin = "5px 0 0 0";
            contentDiv.appendChild(textPara);
        }

        const timeSpan = document.createElement("span");
        timeSpan.classList.add("timestamp");
        timeSpan.textContent = msg.created_at;

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeSpan);

        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    async function sendUserMessage(message, file = null) {
        if (!state.ticketId) return;

        const formData = new FormData();
        formData.append('ticket_id', state.ticketId);
        formData.append('message', message);
        if (file) {
            formData.append('attachment', file);
        }
        formData.append('_token', '{{ csrf_token() }}');

        const sendBtnIcon = elements.sendMessage.innerHTML;
        elements.sendMessage.disabled = true;
        elements.sendMessage.innerHTML = '<span class="spinner-border spinner-border-sm" style="width:14px; height:14px;"></span>';

        try {
            const response = await fetch('{{ route("assistant.support.sendMessage") }}', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                appendBackendMessage(data.data);
                state.lastMessageId = data.data.id;
                elements.chatInput.value = '';
                // Reset polling interval on activity
                resetPolling();
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            elements.sendMessage.disabled = false;
            elements.sendMessage.innerHTML = sendBtnIcon;
        }
    }

    function startPolling() {
        if (state.pollingInterval) return;
        if (!state.isTabActive) return; // Don't start if hidden
        
        state.pollingInterval = setTimeout(fetchNewMessages, state.currentPollingInterval);
    }

    function stopPolling() {
        if (state.pollingInterval) {
            clearTimeout(state.pollingInterval);
            state.pollingInterval = null;
        }
    }

    function resetPolling() {
        state.currentPollingInterval = state.basePollingInterval;
        state.pollingFailureCount = 0;
        stopPolling();
        startPolling();
    }

    async function fetchNewMessages() {
        if (!state.ticketId || !state.isTabActive || !elements.helpPanel.classList.contains("active")) {
            if (!state.isLoadingHistory) stopPolling();
            return;
        }
        
        try {
            const url = `{{ url('/assistant/support') }}/${state.ticketId}/messages?last_id=${state.lastMessageId}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error("Server error");
            
            const data = await response.json();
            
            if (data.success) {
                // Success - Reset interval
                state.currentPollingInterval = state.basePollingInterval;
                state.pollingFailureCount = 0;

                if (data.messages.length > 0) {
                    data.messages.forEach(msg => {
                        appendBackendMessage(msg);
                    });
                    state.lastMessageId = data.messages[data.messages.length - 1].id;
                }
            }
        } catch (error) {
            console.error("Polling error:", error);
            // Exponential back-off on failure
            state.pollingFailureCount++;
            state.currentPollingInterval = Math.min(
                state.basePollingInterval * Math.pow(1.5, state.pollingFailureCount), 
                state.maxPollingInterval
            );
        } finally {
            // Schedule next check
            if (state.isTabActive && elements.helpPanel.classList.contains("active")) {
                state.pollingInterval = setTimeout(fetchNewMessages, state.currentPollingInterval);
            }
        }
    }

    function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Camera not supported in this browser.");
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                state.stream = stream;
                elements.cameraPreview.srcObject = stream;
                elements.cameraPreview.style.display = "block";
                elements.cameraPreview.play();
                // Custom UI for capture would be better, but for now we follow old logic
                setTimeout(() => {
                    capturePhoto();
                    stopCamera();
                }, 3000);
            })
            .catch((err) => {
                console.error("Error accessing camera:", err);
                alert("Unable to access camera.");
            });
    }

    function capturePhoto() {
        const context = elements.cameraCanvas.getContext("2d");
        elements.cameraCanvas.width = elements.cameraPreview.videoWidth;
        elements.cameraCanvas.height = elements.cameraPreview.videoHeight;
        context.drawImage(elements.cameraPreview, 0, 0);
        elements.cameraCanvas.toBlob((blob) => {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            sendUserMessage("Camera Capture", file);
        }, "image/jpeg");
    }

    function stopCamera() {
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
            state.stream = null;
            elements.cameraPreview.style.display = "none";
        }
    }

    // Event Listeners
    elements.toggleButton.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleHelpPanel();
    });

    elements.backButton.addEventListener("click", toggleHelpPanel);

    elements.sendMessage.addEventListener("click", () => {
        const message = elements.chatInput.value.trim();
        if (message) {
            sendUserMessage(message);
        }
    });

    elements.chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            elements.sendMessage.click();
        }
    });

    elements.attachImage.addEventListener("click", () => elements.imageUpload.click());
    elements.imageUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > state.maxFileSize) {
                alert("File is too large (Max 10MB)");
                return;
            }
            sendUserMessage("Sent an attachment", file);
        }
        e.target.value = "";
    });

    elements.capturePhoto.addEventListener("click", startCamera);

    elements.expandChat.addEventListener("click", () => {
        state.isExpanded = !state.isExpanded;
        elements.helpPanel.style.width = state.isExpanded ? "min(100%, 600px)" : "min(100%, 400px)";
        elements.helpPanel.style.height = state.isExpanded ? "calc(100vh - 40px)" : "calc(100vh - 60px)";
    });

    elements.clearChat.addEventListener("click", () => {
        if (confirm("This will not delete your tickets, only clear the current view. Continue?")) {
            elements.chatMessages.innerHTML = "";
        }
    });

    // Initialize (Optional: Auto-load if panel is already open/needed)
    // Removed loadChatHistory() from here to wait for user to open the panel

</script>