<style>
    .notification-sidebar {
        position: fixed;
        top: 20px;
        right: -350px;
        z-index: 99999999999;
        width: 350px;
        transition: right 0.45s ease-in-out, opacity 0.45s ease;
    }
    .notification-sidebar.show {
        right: 20px;
    }

    .notify-box {
        background: #fff;
        border-radius: 12px;
        border-left: 4px solid;
        padding: 15px 18px;
        display: flex;
        gap: 12px;
        position: relative;
        box-shadow: 0 6px 18px rgba(0,0,0,0.13);
        animation: fadeIn .3s ease-in-out;
    }

    .notify-success { border-color: #28a745; }
    .notify-success .notify-text { color: #28a745; }
    .notify-warning { border-color: #ffc107; }
    .notify-warning .notify-text { color: #ffc107; }
    .notify-error { border-color: #dc3545; }
    .notify-error .notify-text { color: #dc3545; }
    .notify-icon { font-size: 24px; }
    .notify-text { font-size: 15px; font-weight: 600; }
    .close-btn {
        position: absolute;
        right: 10px;
        top: 0px;
        padding: 6px;
        border: none;
        background: #ffffff;
        font-size: 26px;
        cursor: pointer;
        font-weight: bold;
        color: #b3ad5b;
    }
    .timer-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 4px;
        width: 100%;
        background: rgba(0,0,0,0.1);
        transition: width linear 6s;
    }

    @keyframes fadeIn {
        from { transform: translateX(40px); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
    }
</style>

@if(session('success') || session('warning') || session('error') || $errors->any())
<div id="notify" class="notification-sidebar show">
    <div class="notify-box 
        @if(session('success')) notify-success @endif
        @if(session('warning')) notify-warning @endif
        @if(session('error') || $errors->any()) notify-error @endif">

        @if(session('success'))
            <i class="fas fa-check-circle text-success notify-icon"></i>
            <span class="notify-text">{{ session('success') }}</span>
        @endif

        @if(session('warning'))
            <i class="fas fa-exclamation-triangle text-warning notify-icon"></i>
            <span class="notify-text">{{ session('warning') }}</span>
        @endif

        @if(session('error'))
            <i class="fas fa-times-circle text-danger notify-icon"></i>
            <span class="notify-text">{{ session('error') }}</span>
        @endif

        @if($errors->any())
            <i class="fas fa-times-circle text-danger notify-icon"></i>
            <span class="notify-text">{{ $errors->first() }}</span>
        @endif

        <button class="close-btn" onclick="hideNotify()">&times;</button>

        <div class="timer-bar"></div>
    </div>
</div>
@endif

<script>
    document.addEventListener("DOMContentLoaded", () => {
        let notify = document.getElementById("notify");
        if (notify) {
            // Start timer bar
            setTimeout(() => {
                notify.querySelector(".timer-bar").style.width = "0%";
            }, 50);

            // Auto hide after time
            setTimeout(() => hideNotify(), 6000);
        }
    });

    function hideNotify() {
        let notify = document.getElementById("notify");
        if (notify) {
            notify.style.opacity = "0";
            notify.style.right = "-350px";
            setTimeout(() => notify.remove(), 400);
        }
    }
    
    function showAlert(msg, type = "success") {
        let iconClass = "";
        let boxClass = "";
        if (type === "success") {
            iconClass = "text-success fas fa-check-circle";
            boxClass = "notify-success";
        } 
        else if (type === "warning") {
            iconClass = "text-warning fas fa-exclamation-triangle";
            boxClass = "notify-warning";
        }
        else if (type === "error" || type === "delete") {
            iconClass = "text-danger fas fa-times-circle";
            boxClass = "notify-error";
        }

        let box = document.createElement("div");
        box.className = "notification-sidebar show";

        box.innerHTML = `
            <div class="notify-box ${boxClass}">
                <i class="${iconClass} notify-icon"></i>
                <span class="notify-text">${msg}</span>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>

                <div class="timer-bar"></div>
            </div>
        `;

        document.body.appendChild(box);
        setTimeout(() => {
            box.querySelector(".timer-bar").style.width = "0%";
        }, 50);
        setTimeout(() => box.remove(), 6000);
    }
</script>

<style>
    .thank-you-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.75);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100000000000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    
    .thank-you-modal-overlay.show {
        opacity: 1;
        visibility: visible;
        backdrop-filter: blur(4px);
    }
    
    .thank-you-modal {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        width: 90%;
        max-width: 420px;
        border-radius: 20px;
        padding: 35px 25px;
        text-align: center;
        position: relative;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        transform: translateY(50px) scale(0.7) rotateX(-10deg);
        opacity: 0;
        transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        border-top: 1px solid rgba(255, 255, 255, 0.8);
        border-left: 1px solid rgba(255, 255, 255, 0.8);
        overflow: hidden;
    }
    
    .thank-you-modal-overlay.show .thank-you-modal {
        transform: translateY(0) scale(1) rotateX(0);
        opacity: 1;
    }
    
    .thank-you-modal::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #28a745, #20c997, #28a745);
        background-size: 200% 100%;
        animation: shimmer 3s infinite linear;
    }
    
    .thank-you-icon {
        width: 90px;
        height: 90px;
        background: linear-gradient(135deg, #28a745, #20c997);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        position: relative;
        animation: float 3s ease-in-out infinite;
        box-shadow: 
            0 10px 30px rgba(40, 167, 69, 0.3),
            0 0 0 8px rgba(40, 167, 69, 0.1);
        overflow: hidden;
    }
    
    .thank-you-icon::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: iconShine 2s ease-in-out infinite;
    }
    
    .thank-you-icon i {
        font-size: 42px;
        color: white;
        position: relative;
        z-index: 1;
        animation: iconBounce 0.8s ease 0.5s both;
    }
    
    .thank-you-title {
        font-size: 28px;
        font-weight: 800;
        color: #28a745;
        margin-bottom: 15px;
        background: linear-gradient(45deg, #28a745, #20c997);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: textReveal 0.8s ease 0.3s both;
        opacity: 0;
        transform: translateY(20px);
    }
    
    .thank-you-message {
        font-size: 16px;
        color: #495057;
        line-height: 1.6;
        margin-bottom: 25px;
        padding: 0 15px;
        animation: fadeUp 0.8s ease 0.6s both;
        opacity: 0;
        transform: translateY(20px);
    }
    
    .modal-close-btn {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        border: none;
        padding: 12px 30px;
        font-size: 15px;
        font-weight: 600;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        overflow: hidden;
        animation: buttonReveal 0.8s ease 0.9s both;
        opacity: 0;
        transform: translateY(20px);
        box-shadow: 0 5px 20px rgba(40, 167, 69, 0.3);
    }
    
    .modal-close-btn:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 10px 25px rgba(40, 167, 69, 0.4);
        letter-spacing: 1px;
    }
    
    .modal-close-btn:active {
        transform: translateY(-1px);
    }
    
    .modal-close-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: 0.5s;
    }
    
    .modal-close-btn:hover::before {
        left: 100%;
    }
    
    .confetti {
        position: absolute;
        width: 10px;
        height: 10px;
        background: #28a745;
        border-radius: 50%;
        opacity: 0;
    }
    
    /* Keyframe Animations */
    @keyframes float {
        0%, 100% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-10px);
        }
    }
    
    @keyframes iconShine {
        0%, 100% {
            transform: translateX(-100%);
        }
        50% {
            transform: translateX(100%);
        }
    }
    
    @keyframes iconBounce {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        50% {
            transform: scale(1.2);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    @keyframes shimmer {
        0% {
            background-position: -200% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }
    
    @keyframes fadeUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes textReveal {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes buttonReveal {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes confettiFall {
        0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
        }
    }
    
    /* Pulse animation for modal */
    @keyframes pulse {
        0% {
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.3),
                0 0 0 0 rgba(40, 167, 69, 0.7);
        }
        70% {
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.3),
                0 0 0 20px rgba(40, 167, 69, 0);
        }
        100% {
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.3),
                0 0 0 0 rgba(40, 167, 69, 0);
        }
    }
    
    .thank-you-modal {
        animation: pulse 2s ease 1s 3;
    }
</style>

@if(session('thankssuccess'))
<div id="thankYouModal" class="thank-you-modal-overlay">
    <div class="thank-you-modal">
        <div class="thank-you-icon">
            <i class="fas fa-check"></i>
        </div>
        
        <h2 class="thank-you-title">Thank You!</h2>
        <p class="thank-you-message">{{ session('thankssuccess') }}</p>
        
        <button class="modal-close-btn" onclick="hideThankYouModal()">
            Continue
        </button>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        function createConfetti() {
            const modal = document.getElementById('thankYouModal');
            const colors = ['#28a745', '#20c997', '#34ce57', '#4cdf72'];
            
            for(let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.width = Math.random() * 15 + 5 + 'px';
                confetti.style.height = confetti.style.width;
                confetti.style.animation = `confettiFall ${Math.random() * 2 + 2}s ease-in-out ${Math.random() * 1}s forwards`;
                confetti.style.zIndex = '100000000001';
                confetti.style.position = 'fixed';
                modal.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }
        }
        
        // Show modal with animation
        setTimeout(() => {
            const modal = document.getElementById('thankYouModal');
            if(modal) {
                modal.classList.add('show');
                createConfetti();
            }
        }, 100);
        
        // Function to hide thank you modal
        function hideThankYouModal() {
            const modal = document.getElementById('thankYouModal');
            if (modal) {
                modal.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                modal.style.opacity = '0';
                modal.style.transform = 'translateY(-50px) scale(0.9)';
                
                setTimeout(() => {
                    modal.remove();
                }, 500);
            }
        }
        setTimeout(() => {
            hideThankYouModal();
        }, 5000);
        const modal = document.getElementById('thankYouModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    hideThankYouModal();
                }
            });
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideThankYouModal();
            }
        });
        window.hideThankYouModal = hideThankYouModal;
    });
</script>
@endif




{{-- Withdraw Wallet Modal box --}}
    {{-- <button type="button"
            class="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#wallet">
        <i class="ri-wallet-3-line me-1"></i> Withdraw Wallet
    </button> --}}

<!-- Modal -->
    {{-- <div class="modal fade" id="wallet" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
        <div class="modal-header px-3">
            <h4 class="modal-title fw-bold  text-white" id="staticBackdropLabel">Withdraw Money</h4>
            <button type="button" class="btn-close bg-white rounded-circle" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">

            <div class="form-section">
            <!-- Header with Balance -->
            <div class="wallet-header p-3 rounded-2 text-center mb-3">
                <h5 class="fw-bold bg-white wallet-header">My Wallet</h5>
                <div class="balance ">$5,000.00</div>
            </div>

            <!-- Checkbox for Toggle -->
            <input type="checkbox" id="toggle-form">
            <!-- Withdraw Button -->
            <div class="row my-3">
                <div class="col-lg-6 actions">
                <label for="toggle-form" class=" btn btn-primary w-100">Withdraw Money</label>
                </div>
                <div class="col-lg-6"> <a href="wallet.php" class="btn btn-secondary w-100">History</a>
                </div>
            </div>

            <!-- Withdraw Form -->
            <form action="" method="" class="withdraw-form">
                <div class="row">
                <div class="col-12 col-lg-6 mb-3">
                    <label for="accountHolder" class="wallet-label">Account Holder Name</label>
                    <input type="text" class="wallet-input" id="accountHolder" name="accountHolder" placeholder="Enter account holder name" maxlength="50" required>
                </div>
                <div class="col-12 col-lg-6 mb-3">
                    <label for="bankName" class="wallet-label">Bank Name</label>
                    <input type="text" class="wallet-input" id="bankName" name="bankName" placeholder="Enter bank name" maxlength="50" required>
                </div>
                <div class="col-12 col-lg-6 mb-3">
                    <label for="ifscCode" class="wallet-label">IFSC Code</label>
                    <input type="text" class="wallet-input" id="ifscCode" name="ifscCode" placeholder="e.g., SBIN0001234" maxlength="11" pattern="[A-Z]{4}0[A-Z0-9]{6}" required>
                </div>
                <div class="col-12 col-lg-6 mb-3">
                    <label for="accountNo" class="wallet-label">Account Number</label>
                    <input type="text" class="wallet-input" id="accountNo" name="accountNo" placeholder="Enter account number" maxlength="20" pattern="[0-9]+" required>
                </div>
                <div class="col-12 col-lg-6 mb-3">
                    <label for="confirmAccountNo" class="wallet-label">Confirm Account Number</label>
                    <input type="text" class="wallet-input" id="confirmAccountNo" name="confirmAccountNo" placeholder="Confirm account number" maxlength="20" pattern="[0-9]+" required>
                </div>
                <div class="col-lg-6 mb-3">
                    <label for="amount" class="wallet-label">Amount ($)</label>
                    <input type="number" class="wallet-input" id="amount" name="amount" placeholder="Enter amount" min="1" max="5000" required>
                </div>
                </div>
                <div>
                <button type="submit" class="btn btn-primary">Submit Withdrawal</button>
                <!-- <a href="history.php" class="btn btn-secondary">History</a> -->
                </div>
            </form>
            </div>

        </div>
        <!-- <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary">Understood</button>
        </div> -->
        </div>
    </div>
    </div> --}}
    
{{-- 
<style>
  .modal-content {
    border-radius: 12px;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .modal-header {
    background: #0e606e;

  }

  .wallet-header {
    color: #0e606e;
    font-weight: 600;
    background-color: #e7f9ffff;
    border-radius: 5px;
    border-bottom: 2px solid #0e606e;
    padding-bottom: 12px;
    margin-bottom: 20px;
    padding-top: 12px;
  }

  .wallet-header {
    background: #f7f4ffff;
  }

  .balance {
    font-size: 1.5rem;
    font-weight: 600;
    color: #0e606e;
  }

  .wallet-label {
    font-size: 13px;
    color: #333;
    font-weight: 600;
  }

  .wallet-input {
    border: none;
    border-bottom: 2px solid #0e606e;
    border-radius: 5px;
    padding: 10px;
    font-size: 13px;
    background-color: #f7f4ffff;
    width: 100%;
  }

  .wallet-input:focus {
    outline: none;
    border-color: #0e606e;
    background-color: white;
    box-shadow: 0px 1px 5px 0px rgba(135, 76, 245, 0.6);
  }

  .wallet-input::placeholder {
    color: #999;
  }

  /* .action-btn {
    background: #094a99;
    color: white;
    padding: 10px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    cursor: pointer;
    transition: opacity 0.3s ease;
  } */

  .action-btn:hover {
    opacity: 0.9;
  }

  /* Checkbox Hack for Toggle */
  #toggle-form {
    display: none;
  }

  .withdraw-form {
    display: none;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.5s ease;
  }

  #toggle-form:checked~.withdraw-form {
    display: block;
    opacity: 1;
    transform: translateY(0);
  }

  .actions {
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  #toggle-form:checked~.actions {
    display: none;
    opacity: 0;
  }

  @media (max-width: 576px) {
    .modal-dialog {
      margin: 10px;
    }

    .wallet-header {
      padding: 15px;
    }

    .balance {
      font-size: 1.5rem;
    }

    .wallet-input {
      font-size: 0.9rem;
    }
  }
</style> --}}