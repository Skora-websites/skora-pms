{{-- <div class="footer text-center bg-white p-2 border-top">
  <p class="text-dark mb-0">
    2025 &copy;
    <a href="https://www.skorasoft.com/" target="_blank" class="link-primary">SkoraSoft</a>,
    All Rights Reserved
  </p>
</div> --}}

 <nav class="mobile-footer-nav">
              <div class="footer-nav-container">
                  <!-- Dashboard -->
                  <a href="{{ route('doctor.dashboard') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.dashboard') ? 'active' : '' }}">
                      <i class="ti ti-layout-dashboard footer-nav-icon"></i>
                      <span class="footer-nav-text">Dashboard</span>
                  </a>

                  <!-- Schedule -->
                  <a href="{{ route('doctor.doctor-schedule') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.doctor-schedule') ? 'active' : '' }}">
                      <i class="ti ti-calendar-time footer-nav-icon"></i>
                      <span class="footer-nav-text">Schedule</span>
                  </a>

                  <!-- Patients -->
                  <a href="{{ route('doctor.patient-registration') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.patient-registration') ? 'active' : '' }}">
                      <i class="ti ti-user-plus footer-nav-icon"></i>
                      <span class="footer-nav-text">Patients</span>
                  </a>

                  <!-- Appointments -->
                  <a href="{{ route('doctors.appointment') }}"
                      class="footer-nav-item {{ request()->routeIs('doctors.appointment') ? 'active' : '' }}">
                      <i class="ti ti-calendar-event footer-nav-icon"></i>
                      <span class="footer-nav-text">Appointments</span>
                  </a>

                  <!-- Finance -->
                  <a href="{{ route('doctor.income-expence') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.income-expence') ? 'active' : '' }}">
                      <i class="ti ti-cash footer-nav-icon"></i>
                      <span class="footer-nav-text">Finance</span>
                  </a>

                  <!-- Home Visit -->
                  <a href="{{ route('doctor-home-visit') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor-home-visit') ? 'active' : '' }}">
                      <i class="ti ti-home-heart footer-nav-icon"></i>
                      <span class="footer-nav-text">Home Visit</span>
                  </a>

                  <!-- Test Booking -->
                  <a href="{{ route('doctor-test-booking') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor-test-booking') ? 'active' : '' }}">
                      <i class="ti ti-test-pipe footer-nav-icon"></i>
                      <span class="footer-nav-text">Test Booking</span>
                  </a>

                  <!-- Billing -->
                  <a href="{{ route('doctor-billing') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor-billing') ? 'active' : '' }}">
                      <i class="ti ti-calculator footer-nav-icon"></i>
                      <span class="footer-nav-text">Billing</span>
                  </a>

                  <!-- Shop -->
                  <a href="{{ route('doctors.shoping') }}"
                      class="footer-nav-item {{ request()->routeIs('doctors.shoping') ? 'active' : '' }}">
                      <i class="ti ti-shopping-cart footer-nav-icon"></i>
                      <span class="footer-nav-text">Shop</span>
                  </a>

                  <!-- Chat -->
                  <a href="{{ route('doctor.chat') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.chat') ? 'active' : '' }}">
                      <i class="ti ti-message-circle footer-nav-icon"></i>
                      <span class="footer-nav-text">Chat</span>
                  </a>

                  <!-- Support -->
                  <a href="{{ route('doctor.supports') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.supports') ? 'active' : '' }}">
                      <i class="ti ti-headset footer-nav-icon"></i>
                      <span class="footer-nav-text">Support</span>
                  </a>

                  <!-- Logout -->
                  <a href="{{ route('doctor.logout') }}"
                      class="footer-nav-item {{ request()->routeIs('doctor.logout') ? 'active' : '' }}">
                      <i class="ti ti-logout footer-nav-icon"></i>
                      <span class="footer-nav-text">Logout</span>
                  </a>
              </div>
              <div class="scroll-indicator">
                  <i class="ti ti-chevron-right"></i>
              </div>
          </nav>
          
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
</style>



<!-- Modal -->
<div class="modal fade" id="wallet" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
</div>



<script>
    window.addEventListener('load', function () {
        const loader = document.getElementById('pageLoader');
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.4s ease';

        setTimeout(() => {
            loader.style.display = 'none';
        }, 400);
    });
</script>


