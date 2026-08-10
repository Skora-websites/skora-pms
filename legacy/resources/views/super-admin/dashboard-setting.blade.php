<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr"
      data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
    <title>SKS || Setting</title>
    <meta name="description" content="" />
    <meta name="keywords" content="">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @include('super-admin.inc.header-links')
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
</head>

<body>
<div class="layout-wrapper layout-content-navbar">
  <div class="layout-container">
    @include('super-admin.inc.sidebar')
    <div class="layout-page">
      @include('super-admin.inc.header')

      <div class="content-wrapper">
        <div class="container-xxl flex-grow-1 container-p-y">
          <div class="card mb-6">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0 text-white fw-bold">Basic Layout</h5>
            </div>
            <div class="card-body">
              <form id="company-settings-form" enctype="multipart/form-data">
                <div class="row">
                  <!-- Company Info -->
                  <h6 class="fw-bold mb-3">Company Info :</h6>

                  <div class="col-md-6 mb-4">
                    <div class="input-group input-group-merge">
                      <div class="form-floating form-floating-outline">
                        <input type="text" name="company_name" id="company-name" class="form-control" placeholder="Full Name" required />
                        <label for="company-name">Full Name</label>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3 mb-4">
                    <div class="input-group input-group-merge">
                      <div class="form-floating form-floating-outline">
                        <input type="text" name="company_short_name" id="company_short_name" class="form-control" placeholder="Short Name" required />
                        <label for="company_short_name">Short Name</label>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3 mb-4">
                    <div class="input-group input-group-merge">
                      <div class="form-floating form-floating-outline">
                        <input type="text" name="company_tagline" id="company-tagline" class="form-control" placeholder="Tagline" />
                        <label for="company-tagline">Website Title</label>
                      </div>
                    </div>
                  </div>


                  <div class="col-md-12 mb-4">
                    <div class="input-group input-group-merge">
                      <span class="input-group-text"><i class="ri-edit-line ri-20px"></i></span>
                      <div class="form-floating form-floating-outline">
                        <textarea name="company_description" id="company-description" class="form-control" placeholder="Description" rows="4"></textarea>
                        <label for="company-description">Description</label>
                      </div>
                    </div>
                  </div>

                  <!-- Logos -->
                  <h6 class="fw-bold mb-3 mt-4">Logos & Favicon :</h6>

                  <div class="col-md-4 mb-4">
                    <label for="light-logo" class="form-label">Full Logo</label>
                    <input type="file" name="light_logo" id="light-logo" class="form-control" />
                    <img id="show-lightlogo" class="mt-2 col-6 d-none w-25" src="" alt="Light Logo" />
                  </div>

                  <div class="col-md-4 mb-4">
                    <label for="dark-logo" class="form-label">Half Logo</label>
                    <input type="file" name="dark_logo" id="dark-logo" class="form-control" />
                    <img id="show-darklogo" class="mt-2 col-6 d-none w-25" src="" alt="Dark Logo" />
                  </div>

                  <div class="col-md-4 mb-4">
                    <label for="favicon" class="form-label">Favicon</label>
                    <input type="file" name="favicon" id="favicon" class="form-control" />
                    <img id="show-favicon" class="mt-2 col-6 d-none w-25" src="" alt="Favicon" />
                  </div>

                  <!-- Emails -->
                  <h6 class="fw-bold mb-3">Company Email :</h6>
                  <div class="col-md-6 mb-4">
                    <div class="input-group input-group-merge">
                      <span class="input-group-text"><i class="ri-mail-line ri-20px"></i></span>
                      <div class="form-floating form-floating-outline">
                        <input type="email" name="company_email1" id="company_email1" class="form-control" placeholder="Email 1" />
                        <label for="company_email1">Email 1</label>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6 mb-4">
                    <div class="input-group input-group-merge">
                      <span class="input-group-text"><i class="ri-mail-send-line ri-20px"></i></span>
                      <div class="form-floating form-floating-outline">
                        <input type="email" name="company_email2" id="company_email2" class="form-control" placeholder="Email 2" />
                        <label for="company_email2">Email 2</label>
                      </div>
                    </div>
                  </div>

                  <!-- Mobile Numbers -->
                  <h6 class="fw-bold mb-3">Company Mobile No. :</h6>
                  <div class="col-md-3 mb-4">
                    <div class="input-group input-group-merge">
                      <span class="input-group-text"><i class="ri-phone-line ri-20px"></i></span>
                      <div class="form-floating form-floating-outline">
                        <input type="text" name="company_mobile1" id="company_mobile1" class="form-control" placeholder="Mobile No. 1" />
                        <label for="company_mobile1">Mobile No. 1</label>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 mb-4">
                    <div class="input-group input-group-merge">
                      <span class="input-group-text"><i class="ri-smartphone-line ri-20px"></i></span>
                      <div class="form-floating form-floating-outline">
                        <input type="text" name="company_mobile2" id="company_mobile2" class="form-control" placeholder="Mobile No. 2" />
                        <label for="company_mobile2">Mobile No. 2</label>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 mb-4">
                    <div class="input-group input-group-merge">
                      <span class="input-group-text"><i class="ri-whatsapp-line ri-20px"></i></span>
                      <div class="form-floating form-floating-outline">
                        <input type="text" name="company_whatsapp1" id="company_whatsapp1" class="form-control" placeholder="Whatsapp No. 1" />
                        <label for="company_whatsapp1">Whatsapp No. 1</label>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 mb-4">
                    <div class="input-group input-group-merge">
                      <span class="input-group-text"><i class="ri-whatsapp-line ri-20px"></i></span>
                      <div class="form-floating form-floating-outline">
                        <input type="text" name="company_whatsapp2" id="company_whatsapp2" class="form-control" placeholder="Whatsapp No. 2" />
                        <label for="company_whatsapp2">Whatsapp No. 2</label>
                      </div>
                    </div>
                  </div>

                  <!-- Social Media -->
                  <h6 class="fw-bold mb-3">Company Social Media Links :</h6>
                  <div class="col-md-4 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="url" name="facebook" id="facebook" class="form-control" placeholder="Facebook" />
                      <label for="facebook">Facebook</label>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="url" name="twitter" id="twitter" class="form-control" placeholder="Twitter" />
                      <label for="twitter">Twitter</label>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="url" name="linkedin" id="linkedin" class="form-control" placeholder="YouTube" />
                      <label for="linkedin">YouTube</label>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="url" name="instagram" id="instagram" class="form-control" placeholder="Instagram" />
                      <label for="instagram">Instagram</label>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="url" name="pintrest" id="pintrest" class="form-control" placeholder="Pinterest" />
                      <label for="pintrest">Pinterest</label>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="url" name="map" id="map" class="form-control" placeholder="Google Map Link" />
                      <label for="map">Google Map</label>
                    </div>
                  </div>

                  <!-- Address -->
                  <h6 class="fw-bold mb-3">Company Addresses :</h6>
                  <div class="col-md-6 mb-4">
                    <div class="form-floating form-floating-outline">
                      <textarea name="company_address1" id="company_address1" class="form-control" placeholder="Address 1" style="height: 80px"></textarea>
                      <label for="company_address1">Address 1</label>
                    </div>
                  </div>
                  <div class="col-md-6 mb-4">
                    <div class="form-floating form-floating-outline">
                      <textarea name="company_address2" id="company_address2" class="form-control" placeholder="Address 2" style="height: 80px"></textarea>
                      <label for="company_address2">Address 2</label>
                    </div>
                  </div>

                  <!-- Currency -->
                  <h6 class="fw-bold mb-3">Company Currency :</h6>
                  <div class="col-md-6 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="text" name="currency_name" id="currency_name" class="form-control" placeholder="Currency Name" />
                      <label for="currency_name">Currency Name</label>
                    </div>
                  </div>
                  <div class="col-md-6 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="text" name="currency_symbol" id="currency_symbol" class="form-control" placeholder="Currency Symbol" />
                      <label for="currency_symbol">Currency Symbol</label>
                    </div>
                  </div>

                  <!-- Subscription & Trial -->
                  <h6 class="fw-bold mb-3">Subscription & Trial Settings :</h6>
                  <div class="col-md-12 mb-4">
                    <div class="form-floating form-floating-outline">
                      <input type="number" name="default_trial_days" id="default_trial_days" class="form-control" placeholder="Default Trial Period (Days)" min="0" required />
                      <label for="default_trial_days">Default Doctor Trial Period (Days)</label>
                    </div>
                  </div>

                  <input type="hidden" name="oldlight_logo" id="oldlight_logo">
                  <input type="hidden" name="olddark_logo" id="olddark_logo">
                  <input type="hidden" name="oldfavicon" id="oldfavicon">
                
                   <div class="text-start">
                        <button type="submit" class="btn btn-primary btn-md mt-3">Setting Update</button>
                    </div>
                </div>

                </div>
              </form>
            </div>
          </div>
        </div>

        @include('super-admin.inc.footer')
        <div class="content-backdrop fade"></div>
      </div>
    </div>
  </div>

  <div class="layout-overlay layout-menu-toggle"></div>
  <div class="drag-target"></div>
</div>

@include('super-admin.inc.footer-links')

<script>
(function () {
  const csrf = $('meta[name="csrf-token"]').attr('content');
  $.get("{{ route('company.settings.fetch') }}", function (res) {
    const d = res.data || {};
    for (const key in d) {
      if (!d.hasOwnProperty(key)) continue;
      const $el = $('[name="'+key+'"]');
      if ($el.length && $el.attr('type') !== 'file') {
        $el.val(d[key]);
      }
    }
    // show images if exist
    const toUrl = (p) => p ? ("{{ asset('storage') }}/" + p) : '';
    if (d.light_logo) { $("#show-lightlogo").attr('src', toUrl(d.light_logo)).removeClass('d-none'); $("#oldlight_logo").val(d.light_logo); }
    if (d.dark_logo)  { $("#show-darklogo").attr('src',  toUrl(d.dark_logo)).removeClass('d-none');  $("#olddark_logo").val(d.dark_logo); }
    if (d.favicon)    { $("#show-favicon").attr('src',    toUrl(d.favicon)).removeClass('d-none');    $("#oldfavicon").val(d.favicon); }
  });

  // Local preview
  const preview = (input, img) => {
    const file = input.files && input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    $(img).attr('src', url).removeClass('d-none');
  };
  $('#light-logo').on('change', function(){ preview(this, '#show-lightlogo'); });
  $('#dark-logo').on('change',  function(){ preview(this, '#show-darklogo');  });
  $('#favicon').on('change',    function(){ preview(this, '#show-favicon');    });

  // Submit via AJAX (FormData) – works on live servers too
  $('#company-settings-form').on('submit', function (e) {
    e.preventDefault();

    const fd = new FormData(this);

    $.ajax({
      url: "{{ route('company.settings.save') }}",
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrf },
      data: fd,
      processData: false,
      contentType: false,
      success: function (res) {
       showNotification(res.message);
        $('#resp').html('<div class="alert alert-success">'+res.message+'</div>');
      },
      error: function (xhr) {
        if (xhr.status === 422) {
         showNotification(xhr.responseJSON.message, 'error');
        } else {
          showNotification('Something went wrong', 'error');
        }
      }
    });
  });
})();
</script>

</body>
</html>
