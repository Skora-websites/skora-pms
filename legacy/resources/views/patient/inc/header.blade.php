@include('super-admin.inc.custom-css')

</head>
<body>
<nav class="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme" id="layout-navbar">
    <div class="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
        <a class="nav-item nav-link px-0 me-xl-6" href="javascript:void(0)">
            <i class="ri-menu-fill ri-24px"></i>
        </a>
    </div>
    <div class="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
        <div class="navbar-nav align-items-center">
            <div class="nav-item navbar-search-wrapper mb-0 position-relative">
                <input type="text" class="form-control border-0 search-input" placeholder="Search..." aria-label="Search..." id="searchInput" style="width: 50rem !important;">
                <i class="ri-close-fill search-close cursor-pointer" style="display: none;"></i>
                <div class="search-suggestions dropdown-menu dropdown-menu-end mt-2 py-2" id="searchSuggestions" style="display: none;">
                    <ul class="list-group list-group-flush"></ul>
                </div>
            </div>
        </div>
        <ul class="navbar-nav flex-row align-items-center ms-auto">
            <li class="nav-item dropdown-language dropdown">
                <a class="nav-link btn btn-text-secondary rounded-pill btn-icon dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown">
                    <i class='ri-translate-2 ri-17px'></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end py-2">
                    <li><a class="dropdown-item" href="javascript:void(0);" data-language="en" data-text-direction="ltr"><span class="align-middle">English</span></a></li>
                    <li><a class="dropdown-item" href="javascript:void(0);" data-language="fr" data-text-direction="ltr"><span class="align-middle">Hindi</span></a></li>
                </ul>
            </li>
            <li class="nav-item dropdown-shortcuts navbar-dropdown dropdown">
                <a class="nav-link btn btn-text-secondary rounded-pill btn-icon dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                    <i class='ri-star-smile-line ri-17px'></i>
                </a>
                <div class="dropdown-menu dropdown-menu-end py-0">
                    <div class="dropdown-menu-header border-bottom py-50">
                        <div class="dropdown-header d-flex align-items-center py-2">
                            <h6 class="mb-0 me-auto">Shortcuts</h6>
                            <a href="javascript:void(0)" class="btn btn-text-secondary rounded-pill btn-icon dropdown-shortcuts-add" data-bs-toggle="tooltip" data-bs-placement="top" title="Add shortcuts"><i class="ri-layout-grid-line ri-24px text-heading"></i></a>
                        </div>
                    </div>
                    <div class="dropdown-shortcuts-list scrollable-container">
                        <div class="row row-bordered overflow-visible g-0">
                            <div class="dropdown-shortcuts-item col">
                                <span class="dropdown-shortcuts-icon rounded-circle mb-2"><i class="ri-calendar-line ri-26px text-heading"></i></span>
                                <a href="app-calendar.html" class="stretched-link">Calendar</a>
                                <small>Appointments</small>
                            </div>
                            <div class="dropdown-shortcuts-item col">
                                <span class="dropdown-shortcuts-icon rounded-circle mb-2"><i class="ri-file-text-line ri-26px text-heading"></i></span>
                                <a href="app-invoice-list.html" class="stretched-link">Invoice App</a>
                                <small>Manage Accounts</small>
                            </div>
                        </div>
                        <div class="row row-bordered overflow-visible g-0">
                            <div class="dropdown-shortcuts-item col">
                                <span class="dropdown-shortcuts-icon rounded-circle mb-2"><i class="ri-user-line ri-26px text-heading"></i></span>
                                <a href="app-user-list.html" class="stretched-link">User App</a>
                                <small>Manage Users</small>
                            </div>
                            <div class="dropdown-shortcuts-item col">
                                <span class="dropdown-shortcuts-icon rounded-circle mb-2"><i class="ri-computer-line ri-26px text-heading"></i></span>
                                <a href="app-access-roles.html" class="stretched-link">Role Management</a>
                                <small>Permission</small>
                            </div>
                        </div>
                        <div class="row row-bordered overflow-visible g-0">
                            <div class="dropdown-shortcuts-item col">
                                <span class="dropdown-shortcuts-icon rounded-circle mb-2"><i class="ri-pie-chart-2-line ri-26px text-heading"></i></span>
                                <a href="index.html" class="stretched-link">Dashboard</a>
                                <small>Analytics</small>
                            </div>
                            <div class="dropdown-shortcuts-item col">
                                <span class="dropdown-shortcuts-icon rounded-circle mb-2"><i class="ri-settings-4-line ri-26px text-heading"></i></span>
                                <a href="pages-account-settings-account.html" class="stretched-link">Setting</a>
                                <small>Account Settings</small>
                            </div>
                        </div>
                        <div class="row row-bordered overflow-visible g-0">
                            <div class="dropdown-shortcuts-item col">
                                <span class="dropdown-shortcuts-icon rounded-circle mb-2"><i class="ri-question-line ri-26px text-heading"></i></span>
                                <a href="pages-faq.html" class="stretched-link">FAQs</a>
                                <small class="text-muted mb-0">FAQs & Articles</small>
                            </div>
                            <div class="dropdown-shortcuts-item col">
                                <span class="dropdown-shortcuts-icon rounded-circle mb-2"><i class="ri-tv-2-line ri-26px text-heading"></i></span>
                                <a href="modal-examples.html" class="stretched-link">Modals</a>
                                <small>Useful Popups</small>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
            <li class="nav-item dropdown-notifications navbar-dropdown dropdown me-4 me-xl-1">
                <a class="nav-link btn btn-text-secondary rounded-pill btn-icon dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                    <i class="ri-notification-2-line ri-17px"></i>
                    <span class="position-absolute top-0 start-50 translate-middle-y badge badge-dot bg-danger mt-2 border"></span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end py-0">
                    <li class="dropdown-menu-header border-bottom">
                        <div class="dropdown-header d-flex align-items-center py-3">
                            <h6 class="mb-0 me-auto">Patient Notification</h6>
                            <div class="d-flex align-items-center">
                                <span class="badge rounded-pill bg-label-primary me-2">8 New</span>
                                <a href="javascript:void(0)" class="btn btn-text-secondary rounded-pill btn-icon dropdown-notifications-all" data-bs-toggle="tooltip" data-bs-placement="top" title="Mark all as read"><i class="ri-mail-open-line ri-20px text-body"></i></a>
                            </div>
                        </div>
                    </li>
                    <li class="dropdown-notifications-list scrollable-container">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item list-group-item-action dropdown-notifications-item">
                                <div class="d-flex">
                                    <div class="flex-shrink-0 me-3">
                                        <div class="avatar">
                                            <img src="../../assets/img/avatars/1.png" alt class="w-px-40 h-auto rounded-circle">
                                        </div>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="small mb-1">Congratulation Lettie 🎉</h6>
                                        <small class="mb-1 d-block text-body">Won the monthly best seller gold badge</small>
                                        <small class="text-muted">1h ago</small>
                                    </div>
                                    <div class="flex-shrink-0 dropdown-notifications-actions">
                                        <a href="javascript:void(0)" class="dropdown-notifications-read"><span class="badge badge-dot"></span></a>
                                        <a href="javascript:void(0)" class="dropdown-notifications-archive"><span class="ri-close-line"></span></a>
                                    </div>
                                </div>
                            </li>
                            <!-- Other notification items remain unchanged -->
                        </ul>
                    </li>
                    <li class="border-top">
                        <div class="d-grid p-4">
                            <a class="btn btn-primary btn-sm d-flex" href="javascript:void(0);">
                                <small class="align-middle">View all notifications</small>
                            </a>
                        </div>
                    </li>
                </ul>
            </li>
            <li class="nav-item navbar-dropdown dropdown-user dropdown">
                <a class="nav-link dropdown-toggle hide-arrow p-0" href="javascript:void(0);" data-bs-toggle="dropdown">
                    <div class="avatar avatar-online">
                        <img src="assets/img/avatars/1.png" alt class="w-px-40 h-auto rounded-circle">
                    </div>
                </a>
                <ul class="dropdown-menu dropdown-menu-end mt-3 py-2">
                    <li>
                        <a class="dropdown-item" href="pages-account-settings-account.html">
                            <div class="d-flex align-items-center">
                                <div class="flex-shrink-0 me-2">
                                    <div class="avatar avatar-online">
                                        <img src="../../assets/img/avatars/9.png" alt class="w-px-40 h-auto rounded-circle">
                                    </div>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-0 small">John Doe</h6>
                                    <small class="text-muted">Admin</small>
                                </div>
                            </div>
                        </a>
                    </li>
                    <li><div class="dropdown-divider"></div></li>
                    <li><a class="dropdown-item" href="pages-profile-user.html"><i class="ri-user-3-line ri-17px me-2"></i><span class="align-middle">My Profile</span></a></li>
                    <li><a class="dropdown-item" href="pages-account-settings-account.html"><i class="ri-settings-4-line ri-17px me-2"></i><span class="align-middle">Settings</span></a></li>
                    <li>
                      <div class="d-grid px-4 pt-2 pb-1">
                        <form action="{{ route('logout') }}" method="POST" style="margin:0;">
                            @csrf
                            <button type="submit" class="btn bg-Skoracares d-flex align-items-center w-100" style="border:none;">
                                <small class="align-middle text-black">Logout</small>
                                <i class="ri-logout-box-r-line ms-2 ri-16px"></i>
                            </button>
                        </form>
                    </div>

                    </li>
                </ul>
            </li>
        </ul>
    </div>
</nav>

<style>
    .navbar-search-wrapper {
        position: relative;
        z-index: 1000;
    }
    .search-input {
        width: 200px;
        max-width: 100%;
        padding-right: 30px;
        transition: width 0.3s ease;
    }
    .search-input:focus {
        width: 300px;
    }
    .search-close {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        font-size: 1.2rem;
        color: #666;
    }
      .search-suggestions {
        max-height: 300px;
        overflow-y: auto;   /* scroll enable */
        background-color: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 0.25rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        width: 100%;
        z-index: 1001;

        /* 👇 Scrollbar hide karne ke liye */
        scrollbar-width: none;  /* Firefox */
        -ms-overflow-style: none;  /* IE and Edge */
    }

    .search-suggestions::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
    }

    .search-suggestions .list-group-item {
        padding: 10px 15px;
        border: none;
        transition: background-color 0.2s;
    }
    .search-suggestions .list-group-item:hover {
        background-color: #f8f9fa;
    }
    .search-suggestions .list-group-item a {
        color: #333;
        text-decoration: none;
        display: block;
    }
    .search-suggestions .list-group-item a:hover {
        color: #007bff;
    }
    .search-suggestions .not-found {
        color: #dc3545;
        padding: 10px 15px;
        text-align: center;
    }
</style>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const searchInput = document.getElementById('searchInput');
        const searchSuggestions = document.getElementById('searchSuggestions');
        const searchClose = document.querySelector('.search-close');
        const navbar = document.getElementById('layout-navbar');

        // Dummy data for suggestions
        const suggestionsData = [
            { name: 'Dashboard', url: 'index.html' },
            { name: 'Calendar', url: 'app-calendar.html' },
            { name: 'Invoice App', url: 'app-invoice-list.html' },
            { name: 'User App', url: 'app-user-list.html' },
            { name: 'Role Management', url: 'app-access-roles.html' },
            { name: 'Settings', url: 'pages-account-settings-account.html' },
            { name: 'FAQs', url: 'pages-faq.html' },
            { name: 'Modals', url: 'modal-examples.html' },
        ];

        // Function to render suggestions
        function renderSuggestions(filteredSuggestions) {
            try {
                const suggestionsList = searchSuggestions.querySelector('.list-group');
                suggestionsList.innerHTML = '';

                if (filteredSuggestions.length === 0) {
                    suggestionsList.innerHTML = '<li class="list-group-item not-found">Not Found</li>';
                } else {
                    filteredSuggestions.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'list-group-item';
                        li.innerHTML = `<a href="${item.url}">${item.name}</a>`;
                        suggestionsList.appendChild(li);
                    });
                }
            } catch (e) {
                console.error('Error rendering suggestions:', e);
            }
        }

        // Show suggestions and close icon on input focus or click
        searchInput.addEventListener('focus', function () {
            try {
                searchSuggestions.style.display = 'block';
                searchClose.style.display = 'block';
                renderSuggestions(suggestionsData);
            } catch (e) {
                console.error('Error on search input focus:', e);
            }
        });

        // Filter suggestions on input
        searchInput.addEventListener('input', function () {
            try {
                const query = this.value.toLowerCase();
                const filteredSuggestions = suggestionsData.filter(item =>
                    item.name.toLowerCase().includes(query)
                );
                searchSuggestions.style.display = 'block';
                searchClose.style.display = 'block';
                renderSuggestions(filteredSuggestions);
            } catch (e) {
                console.error('Error filtering suggestions:', e);
            }
        });

        // Hide suggestions and clear input on close icon click
        searchClose.addEventListener('click', function () {
            try {
                searchInput.value = '';
                searchSuggestions.style.display = 'none';
                searchClose.style.display = 'none';
                searchInput.blur();
            } catch (e) {
                console.error('Error closing search:', e);
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', function (event) {
            try {
                const isClickInside = searchInput.contains(event.target) || searchSuggestions.contains(event.target) || searchClose.contains(event.target);
                if (!isClickInside) {
                    searchSuggestions.style.display = 'none';
                    searchClose.style.display = 'none';
                }
            } catch (e) {
                console.error('Error handling outside click:', e);
            }
        });

        // Ensure navbar stays visible
        navbar.style.display = 'flex';
    });
</script>

<!-- Help Panel -->
<div id="helpPanel" class="help-panel" role="region" aria-label="Chat Panel">
    <div class="help-header">
        <div class="header-left">
            <button id="backButton" class="back-btn" aria-label="Close chat"><i class="fas fa-arrow-left"></i></button>
            <h6 class="fw-bold text-white">AI Doctor-X</h6>
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
<button id="toggleButton" class="floating-btn" aria-label="Toggle Chat Panel">
    <i id="toggleIcon" class="ri-chat-3-line"></i>
</button>

<script>
    // State Management
    const state = {
        messageHistory: [],
        maxHistory: 200,
        isExpanded: false,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        stream: null
    };

    // DOM Elements
    const elements = {
        toggleButton: document.getElementById("toggleButton"),
        helpPanel: document.getElementById("helpPanel"),
        chatInput: document.getElementById("chatInput"),
        sendMessage: document.getElementById("sendMessage"),
        chatMessages: document.getElementById("chatMessages"),
        messageSearch: document.getElementById("messageSearch"),
        searchToggle: document.getElementById("searchToggle"),
        imageUpload: document.getElementById("imageUpload"),
        attachImage: document.getElementById("attachImage"),
        capturePhoto: document.getElementById("capturePhoto"),
        cameraPreview: document.getElementById("cameraPreview"),
        cameraCanvas: document.getElementById("cameraCanvas"),
        expandChat: document.getElementById("expandChat"),
        messageMenu: document.getElementById("messageMenu"),
        editMessageBtn: document.getElementById("editMessageBtn"),
        deleteMessageBtn: document.getElementById("deleteMessageBtn"),
        emojiButton: document.getElementById("emojiButton"),
        clearChat: document.getElementById("clearChat"),
        backButton: document.getElementById("backButton")
    };

    // Response Mappings
    const responses = [
        { keywords: ["hello", "hi", "hey", "greetings"], response: "Hi there! How can I assist you today?" },
        { keywords: ["help", "assist", "support", "how to"], response: "I'm here to help! Try asking about anything." },
        { keywords: ["password", "reset password", "change password", "forgot password"], regex: /password/i, response: "To reset your password, go to Settings > Change Password and follow the instructions." },
        { keywords: ["support", "contact", "helpdesk", "customer service"], regex: /support|contact/i, response: "You can contact support via email at support@x.ai." },
        { keywords: ["theme", "dark mode", "light mode", "style", "appearance"], regex: /theme|mode|style/i, response: "Use the theme switcher in the navbar to toggle between light, dark, and system themes." },
        { keywords: ["account", "profile", "user", "settings"], regex: /account|profile|settings/i, response: "You can manage your account in the Settings section." },
        { keywords: [], response: "Hmm, I'm not sure about that one. Could you clarify?" }
    ];

    // Utility Functions
    const utils = {
        sanitizeInput(input) {
            const div = document.createElement("div");
            div.textContent = input;
            return div.innerHTML;
        },
        getDateKey(date) {
            return date.toDateString();
        },
        formatDate(date) {
            const today = new Date();
            if (utils.getDateKey(date) === utils.getDateKey(today)) return "Today";
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (utils.getDateKey(date) === utils.getDateKey(yesterday)) return "Yesterday";
            return date.toLocaleDateString([], { month: "short", day: "numeric" });
        },
        formatTime(date) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        },
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    // Core Functions
    function toggleHelpPanel() {
        elements.helpPanel.classList.toggle("active");
        elements.toggleButton.style.display = elements.helpPanel.classList.contains("active") ? "none" : "flex";
        if (elements.helpPanel.classList.contains("active")) {
            elements.chatInput.focus();
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    }

    function addDateSeparator(dateKey) {
        const separator = document.createElement("div");
        separator.classList.add("date-separator");
        separator.textContent = utils.formatDate(new Date(dateKey));
        separator.dataset.dateKey = dateKey;
        elements.chatMessages.appendChild(separator);
    }

    function addMessage(content, isUser = false, isImage = false, timestamp = new Date(), noSeparator = false) {
        const dateKey = utils.getDateKey(timestamp);
        const lastChild = elements.chatMessages.lastChild;
        const lastDateKey = lastChild && lastChild.dataset.dateKey ? lastChild.dataset.dateKey : null;

        if (!noSeparator && dateKey !== lastDateKey) {
            addDateSeparator(dateKey);
        }

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", isUser ? "user-message" : "bot-message");
        messageDiv.dataset.timestamp = timestamp.toISOString();
        messageDiv.dataset.dateKey = dateKey;
        messageDiv.setAttribute("role", "article");

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("content");
        if (isImage) {
            const img = document.createElement("img");
            img.src = content;
            img.style.maxWidth = "100%";
            img.alt = "User uploaded image";
            contentDiv.appendChild(img);
        } else {
            contentDiv.textContent = content;
        }

        const timeSpan = document.createElement("span");
        timeSpan.classList.add("timestamp");
        timeSpan.textContent = utils.formatTime(timestamp);

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeSpan);

        if (isUser) {
            setupLongPress(messageDiv, contentDiv);
        }

        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    function setupLongPress(messageDiv, contentDiv) {
        let timer;
        const longPressDuration = 500;

        const startLongPress = (e) => {
            e.preventDefault();
            timer = setTimeout(() => showMenu(messageDiv, contentDiv, e), longPressDuration);
        };

        const cancelLongPress = () => {
            clearTimeout(timer);
        };

        messageDiv.addEventListener("touchstart", startLongPress, { passive: false });
        messageDiv.addEventListener("mousedown", startLongPress);
        messageDiv.addEventListener("touchend", cancelLongPress);
        messageDiv.addEventListener("touchmove", cancelLongPress);
        messageDiv.addEventListener("mouseup", cancelLongPress);
        messageDiv.addEventListener("mousemove", cancelLongPress);
        messageDiv.addEventListener("contextmenu", (e) => e.preventDefault());
        messageDiv.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                showMenu(messageDiv, contentDiv, e);
            }
        });
    }

    let currentMessageDiv, currentContentDiv;
    function showMenu(msgDiv, contDiv, event) {
        currentMessageDiv = msgDiv;
        currentContentDiv = contDiv;
        const rect = msgDiv.getBoundingClientRect();
        elements.messageMenu.style.top = `${rect.top + window.scrollY}px`;
        elements.messageMenu.style.left = `${rect.left + rect.width - elements.messageMenu.offsetWidth}px`;
        elements.messageMenu.style.display = "block";

        const hideMenu = (e) => {
            if (!elements.messageMenu.contains(e.target)) {
                elements.messageMenu.style.display = "none";
                document.removeEventListener("click", hideMenu);
            }
        };
        document.addEventListener("click", hideMenu);
    }

    function loadChatHistory() {
        try {
            state.messageHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
            if (state.messageHistory.length > state.maxHistory) {
                state.messageHistory = state.messageHistory.slice(-state.maxHistory);
                saveChatHistory();
            }
            let lastDateKey = null;
            state.messageHistory.forEach(({ content, isUser, isImage, timestamp }) => {
                const date = new Date(timestamp);
                const dateKey = utils.getDateKey(date);
                const noSeparator = dateKey === lastDateKey;
                addMessage(content, isUser, isImage, date, noSeparator);
                lastDateKey = dateKey;
            });
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    }

    function saveChatHistory() {
        try {
            localStorage.setItem("chatHistory", JSON.stringify(state.messageHistory));
        } catch (error) {
            console.error("Error saving chat history:", error);
        }
    }

    function getBotResponse(message) {
        const lowerMessage = message.toLowerCase().trim();
        for (const entry of responses) {
            if (entry.keywords.some(keyword => lowerMessage.includes(keyword)) || (entry.regex && entry.regex.test(lowerMessage))) {
                return entry.response;
            }
        }
        return responses[responses.length - 1].response;
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement("div");
        typingDiv.id = "typingIndicator";
        typingDiv.classList.add("bot-message", "typing");
        typingDiv.innerHTML = '<div class="content">Typing...</div>';
        elements.chatMessages.appendChild(typingDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        return typingDiv;
    }

    function removeTypingIndicator(typingDiv) {
        typingDiv.remove();
    }

    function sendUserMessage(message, isImage = false) {
        const sanitizedMessage = isImage ? message : utils.sanitizeInput(message);
        const timestamp = new Date();
        addMessage(sanitizedMessage, true, isImage, timestamp);
        state.messageHistory.push({ content: sanitizedMessage, isUser: true, isImage, timestamp: timestamp.toISOString() });
        saveChatHistory();

        const typingDiv = addTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator(typingDiv);
            const response = getBotResponse(message);
            const botTimestamp = new Date();
            addMessage(response, false, false, botTimestamp);
            state.messageHistory.push({ content: response, isUser: false, isImage: false, timestamp: botTimestamp.toISOString() });
            saveChatHistory();
        }, 1000);
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
                setTimeout(() => capturePhoto(), 1000);
            })
            .catch((err) => {
                console.error("Error accessing camera:", err);
                alert("Unable to access camera. Please check permissions.");
            });
    }

    function capturePhoto() {
        const context = elements.cameraCanvas.getContext("2d");
        elements.cameraCanvas.width = elements.cameraPreview.videoWidth;
        elements.cameraCanvas.height = elements.cameraPreview.videoHeight;
        context.drawImage(elements.cameraPreview, 0, 0);
        const dataUrl = elements.cameraCanvas.toDataURL("image/jpeg");
        sendUserMessage(dataUrl, true);
        stopCamera();
    }

    function stopCamera() {
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
            state.stream = null;
            elements.cameraPreview.style.display = "none";
        }
    }

    elements.toggleButton.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleHelpPanel();
    });

    document.addEventListener("click", (e) => {
        if (!elements.helpPanel.contains(e.target) && !elements.toggleButton.contains(e.target) && elements.helpPanel.classList.contains("active")) {
            toggleHelpPanel();
        }
    });

    elements.backButton.addEventListener("click", toggleHelpPanel);

    elements.sendMessage.addEventListener("click", () => {
        const message = elements.chatInput.value.trim();
        if (message && message.length <= 2000) {
            sendUserMessage(message);
            elements.chatInput.value = "";
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
        if (file && file.size <= state.maxFileSize && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => sendUserMessage(reader.result, true);
            reader.onerror = () => alert("Error reading the image file.");
            reader.readAsDataURL(file);
        } else {
            alert("Image must be under 5MB and a valid image file.");
        }
        e.target.value = "";
    });

    elements.capturePhoto.addEventListener("click", startCamera);

    elements.searchToggle.addEventListener("click", () => {
        elements.messageSearch.style.display = elements.messageSearch.style.display === "none" ? "block" : "none";
        if (elements.messageSearch.style.display === "block") {
            elements.messageSearch.focus();
        }
    });

    elements.messageSearch.addEventListener("input", utils.debounce(() => {
        const searchTerm = elements.messageSearch.value.toLowerCase().trim();
        Array.from(elements.chatMessages.children).forEach((el) => {
            if (el.classList.contains("date-separator")) {
                el.style.display = "block";
                return;
            }
            const text = el.querySelector(".content").textContent.toLowerCase();
            el.style.display = text.includes(searchTerm) ? "flex" : "none";
        });
    }, 300));

    elements.expandChat.addEventListener("click", () => {
        state.isExpanded = !state.isExpanded;
        elements.helpPanel.style.width = state.isExpanded ? "min(100%, 600px)" : "min(100%, 400px)";
        elements.helpPanel.style.height = state.isExpanded ? "calc(100vh - 40px)" : "calc(100vh - 60px)";
    });

    elements.emojiButton.addEventListener("click", () => {
        const emoji = prompt("Enter emoji (e.g., 😊):");
        if (emoji) elements.chatInput.value += emoji;
    });

    elements.editMessageBtn.addEventListener("click", () => {
        const newContent = prompt("Edit message:", currentContentDiv.textContent);
        if (newContent) {
            const sanitizedContent = utils.sanitizeInput(newContent);
            currentContentDiv.textContent = sanitizedContent;
            const index = state.messageHistory.findIndex(m => m.timestamp === currentMessageDiv.dataset.timestamp);
            if (index !== -1) {
                state.messageHistory[index].content = sanitizedContent;
                saveChatHistory();
            }
        }
        elements.messageMenu.style.display = "none";
    });

    elements.deleteMessageBtn.addEventListener("click", () => {
        if (confirm("Delete this message?")) {
            const index = state.messageHistory.findIndex(m => m.timestamp === currentMessageDiv.dataset.timestamp);
            if (index !== -1) {
                state.messageHistory.splice(index, 1);
                saveChatHistory();
                currentMessageDiv.remove();
            }
        }
        elements.messageMenu.style.display = "none";
    });

    elements.clearChat.addEventListener("click", () => {
        if (confirm("Clear all chat history?")) {
            localStorage.removeItem("chatHistory");
            elements.chatMessages.innerHTML = "";
            state.messageHistory = [];
        }
    });

    // Initialize
    loadChatHistory();
</script>