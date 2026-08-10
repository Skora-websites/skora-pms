<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact " dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Mail-Setup</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">
    <!-- links  -->
      @include('super-admin.inc.header-links')
</head>
<body>
    <!-- Layout wrapper -->
    <div class="layout-wrapper layout-content-navbar">
        <div class="layout-container">
            <!-- Menu -->
          @include('super-admin.inc.sidebar')
            <!-- Layout container -->
            <div class="layout-page">
              @include('super-admin.inc.header')
                
                <!-- / Navbar -->

                <!-- Content wrapper -->
                <div class="content-wrapper">
                    <!-- Content -->
                    <div class="container-xxl flex-grow-1 container-p-y">
                        <!-- <div class="container-xxl"> -->
                        <div class="card mb-6">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0 text-white fw-bold">SMTP Mail Setup (Forgate Password/Get Message on this mail)</h5>
                            </div>
                                <div class="card-body">
                                <form id="smtpForm" method="POST" action="{{ route('mail.settings.update') }}">
                                    @csrf
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label for="mail_host" class="form-label">Mail Host</label>
                                            <input type="text" class="form-control" id="mail_host" name="mail_host" placeholder="smtp.gmail.com" required>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="mail_port" class="form-label">Mail Port</label>
                                            <input type="number" class="form-control" id="mail_port" name="mail_port" placeholder="587" required>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="mail_username" class="form-label">Mail Username (Email)</label>
                                            <input type="text" class="form-control" id="mail_username" name="mail_username" placeholder="example@gmail.com" required>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="mail_password" class="form-label">Mail Password (App Password)</label>
                                            <div class="input-group">
                                                <input type="password" class="form-control" id="mail_password" name="mail_password" minlength="8" required>
                                                <button class="btn btn-outline-secondary" type="button" id="togglePassword">Show</button>
                                            </div>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="mail_encryption" class="form-label">Encryption</label>
                                            <select class="form-select" id="mail_encryption" name="mail_encryption" required>
                                                <option value="tls">TLS</option>
                                                <option value="ssl">SSL</option>
                                                <option value="none">None</option>
                                            </select>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="from_name" class="form-label">From Name</label>
                                            <input type="text" class="form-control" id="from_name" name="from_name" placeholder="Your Website" required>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="from_email" class="form-label">From Email</label>
                                            <input type="email" class="form-control" id="from_email" name="from_email" placeholder="no-reply@yourdomain.com" required>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary mt-5 mb-5" id="submit-btn">Submit SMTP Mail</button>
                                </form>
                                <div id="add-resp"></div>
     

                            </div>
                        </div>
                        <!-- </div> -->
                    </div>
                    <!-- / Content -->
                    <!-- Footer -->
              @include('super-admin.inc.footer')

                    <div class="content-backdrop fade"></div>
                </div>
            </div>
        </div>
        <div class="layout-overlay layout-menu-toggle"></div>
        <div class="drag-target"></div>
    </div>

    @include('super-admin.inc.footer-links')

</body>

<script>
  $(document).ready(function() {
    $('#togglePassword').click(function() {
        const passwordField = $('#mail_password');
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
        $(this).text(type === 'password' ? 'Show' : 'Hide');
    });

    $('#smtpForm').submit(function(e) {
        e.preventDefault();

        if (!$('#mail_host').val() || !$('#mail_username').val()) {
            $('#add-resp').html('<div class="alert alert-danger">Please fill all required fields.</div>');
            return false;
        }

        var formData = new FormData(this);
        $.ajax({
            url: "{{ route('mail.settings.update') }}",
            method: "POST",
            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
            data: formData,
            contentType: false,
            processData: false,
            beforeSend: function() {
                $('#submit-btn').prop('disabled', true).text('Submitting...');
                $('#add-resp').html('<div class="alert alert-info">Submitting...</div>');
            },
            success: function(res) {
                $('#add-resp').html('<div class="alert alert-success">' + (res.message || 'SMTP details saved successfully!') + '</div>');
                $('#smtpForm')[0].reset();
                $('#submit-btn').prop('disabled', false).text('Submit SMTP Mail');
            },
            error: function(xhr) {
                $('#submit-btn').prop('disabled', false).text('Submit SMTP Mail');
                let html = '<div class="alert alert-danger"><ul class="mb-0">';
                if (xhr.status === 422) {
                    const errs = xhr.responseJSON.errors;
                    Object.keys(errs).forEach(k => html += '<li>' + errs[k][0] + '</li>');
                } else {
                    html += '<li>Something went wrong. Please try again later.</li>';
                }
                html += '</ul></div>';
                $('#add-resp').html(html);
            }
        });
    });
});


</script>

</html>