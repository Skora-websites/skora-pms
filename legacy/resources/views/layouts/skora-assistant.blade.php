<style>
    .help-panel {
        position: fixed;
        bottom: 0;
        right: -420px;
        width: min(100%, 400px);
        height: calc(100vh - 60px);
        background-color: #f7f9fa;
        border-radius: 16px 16px 0 0;
        box-shadow: -5px 0 25px rgba(14, 96, 110, 0.15);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        border-left: 1px solid rgba(14, 96, 110, 0.1);
    }

    .help-panel.active {
        right: 0;
    }

    .help-header {
        background: linear-gradient(135deg, #0c4843 0%, #0e606e 100%);
        color: #fff;
        padding: 16px 20px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        box-shadow: 0 4px 12px rgba(12, 72, 67, 0.15);
    }

    .help-header h6 {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .help-header button {
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: #fff;
        cursor: pointer;
        font-size: 14px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, transform 0.2s;
    }

    .help-header button:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
    }

    .help-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        background-color: #f8fafc;
    }

    .chat-container {
        height: 100%;
        display: flex;
        font-size: 13px;
        flex-direction: column;
    }

    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px 5px;
        scroll-behavior: smooth;
    }

    .message {
        margin-bottom: 14px;
        padding: 10px 14px;
        border-radius: 12px;
        max-width: 85%;
        line-height: 1.5;
        position: relative;
        font-size: 13px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        animation: assistantFadeIn 0.3s ease-out;
    }

    @keyframes assistantFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .user-message {
        background-color: #0e606e;
        color: #fff;
        margin-left: auto;
        border-bottom-right-radius: 2px;
    }

    .bot-message {
        background-color: #fff;
        color: #334155;
        margin-right: auto;
        border-bottom-left-radius: 2px;
        border: 1px solid rgba(14, 96, 110, 0.08);
    }

    .timestamp {
        font-size: 10px;
        color: rgba(0, 0, 0, 0.4);
        margin-top: 4px;
        display: block;
        text-align: right;
    }
    
    .user-message .timestamp {
        color: rgba(255, 255, 255, 0.7);
    }

    /* Quick Actions / Suggestion Chips */
    .quick-actions-title {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 8px;
        margin-top: 10px;
    }

    .quick-actions-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 15px;
    }

    .suggestion-chip {
        background-color: #fff;
        color: #0e606e;
        border: 1px solid rgba(14, 96, 110, 0.2);
        padding: 6px 12px;
        border-radius: 50px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    .suggestion-chip:hover {
        background-color: #0e606e;
        color: #fff;
        border-color: #0e606e;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(14, 96, 110, 0.15);
    }

    .chat-input-area {
        display: flex;
        padding: 8px;
        background: #fff;
        border-radius: 30px;
        border: 1px solid rgba(14, 96, 110, 0.15);
        align-items: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-top: auto;
    }

    .chat-input-area input {
        flex: 1;
        border: none;
        padding: 8px 12px;
        border-radius: 20px;
        background: transparent;
        outline: none;
        font-size: 13px;
        color: #334155;
    }

    .chat-input-area button {
        background: #0e606e;
        border: none;
        color: #fff;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s, transform 0.2s;
    }

    .chat-input-area button:hover {
        background: #0c4843;
        transform: scale(1.05);
    }

    /* Typing Indicator Animation */
    .typing-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
    }

    .typing-dot {
        width: 6px;
        height: 6px;
        background-color: #0e606e;
        border-radius: 50%;
        opacity: 0.4;
        animation: typingBounce 1.4s infinite both;
    }

    .typing-dot:nth-child(2) { animation-delay: .2s; }
    .typing-dot:nth-child(3) { animation-delay: .4s; }

    @keyframes typingBounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
    }
</style>

<!-- Skora Assistance Sliding Panel -->
<div id="skoraHelpPanel" class="help-panel" role="region" aria-label="Skora Clinic Assistance Panel">
    <div class="help-header">
        <h6><i class="ti ti-robot fs-18"></i> Skora Assistance</h6>
        <button id="closeSkoraHelp" aria-label="Close Assistant"><i class="ti ti-x"></i></button>
    </div>
    <div class="help-body">
        <div class="chat-container">
            <div id="skoraChatMessages" class="chat-messages" role="log" aria-live="polite">
                <!-- Welcome Message -->
                <div class="message bot-message">
                    <strong>Hello! I am Skora Assistant.</strong> 👋<br>
                    I can guide you through managing your clinic's digital dashboard smoothly. How can I assist you today?
                    <span class="timestamp" style="margin-top:8px;">Just now</span>
                </div>

                <div class="quick-actions-title"><i class="ti ti-hand-finger"></i> Quick Help Topics:</div>
                <div class="quick-actions-container">
                    <div class="suggestion-chip" onclick="sendQuickTopic('📅 How to book an appointment?')">Book Appointment</div>
                    <div class="suggestion-chip" onclick="sendQuickTopic('👥 How to register a patient?')">Register Patient</div>
                    <div class="suggestion-chip" onclick="sendQuickTopic('💳 How to create a bill?')">Create Bill</div>
                    <div class="suggestion-chip" onclick="sendQuickTopic('🏠 How do home visits work?')">Home Visit</div>
                    <div class="suggestion-chip" onclick="sendQuickTopic('📈 View income and financial reports')">Check Earnings</div>
                </div>
            </div>

            <div class="chat-input-area">
                <input type="text" id="skoraChatInput" placeholder="Ask me anything..." autocomplete="off">
                <button id="sendSkoraMessage" aria-label="Send message">
                    <i class="ti ti-send"></i>
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener("DOMContentLoaded", function () {
        const helpPanel = document.getElementById("skoraHelpPanel");
        const chatInput = document.getElementById("skoraChatInput");
        const sendBtn = document.getElementById("sendSkoraMessage");
        const chatMessages = document.getElementById("skoraChatMessages");
        const closeBtn = document.getElementById("closeSkoraHelp");

        // Comprehensive AI Database / Response Mappings
        const chatbotDatabase = [
            {
                keywords: ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "namaste", "assistant"],
                response: "Hello! I am your clinical system guide. I can help you with appointments, patient registrations, billing, home visits, staff management, or navigating the platform. What can I do for you?"
            },
            {
                keywords: ["book", "appointment", "appointments", "schedule", "timing", "visit", "slot", "date", "time"],
                response: "To manage and book appointments:\n1. Click on the 📅 **Appointments** tab in the sidebar or Registrations in the footer.\n2. Click the **Book Appointment** button.\n3. Search and select the patient, enter date, time slot, consulting doctor, and case type.\n4. Click **Submit** to confirm the schedule."
            },
            {
                keywords: ["patient", "patients", "register", "registration", "add patient", "new patient", "enroll"],
                response: "To register a new patient:\n1. Navigate to 👥 **Registrations** from the footer menu or sidebar.\n2. Complete the form with the patient's full name, mobile number, age, gender, date of birth, and email.\n3. Click **Register** to generate a unique Patient Registration ID automatically."
            },
            {
                keywords: ["billing", "bill", "invoice", "payment", "pending", "received", "amount", "rupee", "upi", "cash", "card", "netbanking", "finance"],
                response: "To manage billing and payments:\n1. Click 💳 **Billing** in the sidebar.\n2. Search for the patient using their unique Registration ID or mobile number.\n3. Select the billing type and enter the total and received amounts.\n4. Choose a payment mode: **UPI**, **Cash**, **Card**, or **Net Banking**, and fill in the transaction details before submitting."
            },
            {
                keywords: ["home visit", "home visits", "home visit schedule", "home visit timing", "visit home"],
                response: "To manage home visits:\n1. Go to 🏠 **Home Visit** in the sidebar.\n2. Here you can track all requested clinical home visits, view patient medical requirements, set doctor schedules, and update booking status."
            },
            {
                keywords: ["test", "lab test", "booking test", "lab report", "pathology", "test booking"],
                response: "To schedule clinical tests:\n1. Open the 🔬 **Test Booking** tab.\n2. Create a test record, select the test type, and link it to the patient. You can monitor and update the results status once the pathology reports are ready."
            },
            {
                keywords: ["staff", "permissions", "roles", "helper", "receptionist", "add staff"],
                response: "To manage staff permissions:\n1. Click on **My Staff** or **Staff Permissions** under settings.\n2. Here, you can add assistants, assign roles, and grant/restrict specific feature accesses."
            },
            {
                keywords: ["profile", "signature", "photo", "password", "settings", "profile settings"],
                response: "To update your profile:\n1. Click on your profile photo on the top right, then select **Profile Settings**.\n2. You can update your name, clinic logo, professional details, upload signature image, or change password."
            },
            {
                keywords: ["income", "expense", "profit", "finance", "report", "earning", "earnings", "hide", "show", "eye"],
                response: "To view earnings:\n1. Check the **Income & Expense** summary widget on your main Dashboard.\n2. To hide or show financial values, click the 👁️ **Eye Icon** next to the amounts."
            },
            {
                keywords: ["support", "admin", "contact", "help", "ticket", "email", "issue", "technical"],
                response: "For administrative or technical assistance:\n1. Go to **Support** in the sidebar to open a support ticket.\n2. Alternatively, you can email us directly at support@skoracare.com. Our clinical software specialists will assist you within 24 hours."
            },
            {
                keywords: ["thank you", "thanks", "ok", "okay", "great", "awesome", "perfect"],
                response: "You're most welcome! I'm happy to help. Let me know if you need anything else to manage your clinic smoothly."
            }
        ];

        // Intelligent Keyword-Scoring Matcher
        function matchQuery(query) {
            const cleanQuery = query.toLowerCase().trim();
            let bestMatch = null;
            let highestScore = 0;

            for (const entry of chatbotDatabase) {
                let score = 0;
                for (const keyword of entry.keywords) {
                    if (cleanQuery.includes(keyword)) {
                        score += keyword.length; // Priority to longer keyword matches
                    }
                }
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = entry;
                }
            }

            if (highestScore > 0 && bestMatch) {
                return bestMatch.response;
            }

            return "I couldn't find a direct instruction match. Try asking about 'how to book appointment', 'register patient', 'create bill', 'home visit', or 'update profile settings'.";
        }

        // Core Functions
        window.toggleSkoraHelp = function() {
            helpPanel.classList.toggle("active");
            if (helpPanel.classList.contains("active")) {
                chatInput.focus();
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        };

        window.sendQuickTopic = function(topicText) {
            // Remove emojis from query for better logic matching
            const cleanText = topicText.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
            handleUserMessage(cleanText);
        };

        function addMessageElement(content, isUser = false) {
            const msgDiv = document.createElement("div");
            msgDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
            
            // Format linebreaks beautifully
            msgDiv.innerHTML = content.replace(/\n/g, "<br>");

            const timeSpan = document.createElement("span");
            timeSpan.className = "timestamp";
            const now = new Date();
            timeSpan.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            msgDiv.appendChild(timeSpan);
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function addTypingIndicator() {
            const indicator = document.createElement("div");
            indicator.id = "skoraTyping";
            indicator.className = "message bot-message";
            indicator.innerHTML = `
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            chatMessages.appendChild(indicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return indicator;
        }

        function handleUserMessage(messageText) {
            if (!messageText.trim()) return;

            // 1. Add user message
            addMessageElement(messageText, true);

            // 2. Clear input
            chatInput.value = "";

            // 3. Add typing indicator
            const typingIndicator = addTypingIndicator();

            // 4. Simulate thinking time and respond
            setTimeout(() => {
                typingIndicator.remove();
                const reply = matchQuery(messageText);
                addMessageElement(reply, false);
            }, 800);
        }

        // Listeners
        sendBtn.addEventListener("click", () => handleUserMessage(chatInput.value));
        
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleUserMessage(chatInput.value);
            }
        });

        closeBtn.addEventListener("click", window.toggleSkoraHelp);

        // Global Event Delegation to bind the click event to any .toggle-help-panel element
        document.addEventListener('click', function(e) {
            const target = e.target.closest('.toggle-help-panel, #toggleButton');
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                window.toggleSkoraHelp();
            }
        });
    });
</script>
