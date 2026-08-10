<!DOCTYPE html>
<html lang="en" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" dir="ltr" data-theme="theme-default" data-assets-path="assets/" data-template="vertical-menu-template" data-style="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
  <title>Doctor Admin || Blogs</title>
  @include('super-admin.inc.header-links')
  <style>
    .modal-xl {
      max-width: 90% !important;
    }
    .modal-body {
      max-height: 500px;
      overflow-y: auto;
    }
    .tox-tinymce {
      height: 500px !important;
    }
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
            <div class="card mt-5 mb-5">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title m-0">All Blogs</h5>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addModal">Add Blog</button>
              </div>
              <div class="row align-items-end mb-3">
                <div class="col-lg-4 col-md-6">
                  <div class="form-floating form-floating-outline">
                    <input type="text" id="searchBoxBlogs" class="form-control" placeholder="Search Blogs">
                    <label for="searchBoxBlogs">Search Blogs</label>
                  </div>
                </div>
              </div>
              <div class="table-responsive">
                <div id="blogsLoader" class="text-center" style="display: none;">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
                <table class="table table-sm" id="blogsTable">
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Image</th>
                      <th>Category Name</th>
                      <th>Blog Title</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @forelse($blogs as $index => $blog)
                      <tr>
                        <td>{{ $index + 1 }}</td>
                        <td><img src="{{ asset($blog->image) }}" height="60" width="60" class="rounded"></td>
                        <td>{{ optional($blog->category)->name ?? 'N/A' }}</td>
                        <td>{{ $blog->title }}</td>
                        <td>
                          <span class="badge bg-info">{{ $blog->button1 }}</span>
                          <span class="badge bg-primary">{{ $blog->button2 }}</span>
                          <span class="badge bg-success">{{ $blog->button3 }}</span>
                          <a href="{{ route('super-admin.Blog-edit', $blog->id) }}" class="btn btn-sm btn-outline-primary mx-1">
                            <i class="ri-pencil-fill"></i>
                          </a>
                          <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-id="{{ $blog->id }}">
                            <i class="ri-delete-bin-fill"></i>
                          </button>
                        </td>
                      </tr>
                    @empty
                      <tr>
                        <td colspan="5" class="text-center text-danger">No Records Found</td>
                      </tr>
                    @endforelse
                  </tbody>
                </table>
                <div class="d-flex justify-content-center mt-4">
                  {{ $blogs->links() }}
                </div>
              </div>
            </div>
          </div>
          @include('super-admin.inc.footer')
        </div>
      </div>
    </div>
  </div>

  <!-- Add Modal -->
  <div class="modal fade" id="addModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-semibold">Add Blog</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form action="{{ route('blogs.store') }}" method="POST" enctype="multipart/form-data" id="addBlogForm">
            @csrf
            <div class="row">
              <div class="col-md-4 mb-3">
                <div class="form-floating form-floating-outline">
                  <select name="category_id" class="form-control" required>
                    <option value="">Select Category</option>
                    @foreach ($categories as $category)
                      <option value="{{ $category->id }}">{{ $category->name }}</option>
                    @endforeach
                  </select>
                  <label for="category_id">Category</label>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <div class="form-floating form-floating-outline">
                  <input type="text" name="title" class="form-control" placeholder="Blog Title" required />
                  <label for="title">Title</label>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <div class="form-floating form-floating-outline">
                  <input type="file" name="image" class="form-control" accept="image/*" required />
                  <label for="image">Image</label>
                </div>
              </div>
              <div class="col-md-12 mb-3">
                <div class="form-floating form-floating-outline">
                  <textarea name="shortcontent" class="form-control" placeholder="Short Description"></textarea>
                  <label for="shortcontent">Short Description</label>
                </div>
              </div>
              <div class="col-md-12 mb-3">
                <div class="form-floating form-floating-outline">
                  <textarea name="content" class="form-control tinymce-editor" placeholder="Description"></textarea>
                  <label for="content">Description</label>
                </div>
              </div>
            </div>
            <div class="modal-footer p-0">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Blog</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  @include('super-admin.inc.footer-links')

  <script src="tiny/vendor/tinymce/tinymce.min.js"></script>
  <script>
    $(document).ready(function() {
      // Initialize DataTable
      const table = $('#blogsTable').DataTable({
        searching: true,
        paging: true,
        info: false,
        lengthChange: false,
        pageLength: 10
      });

      // Custom search input
      $('#searchBoxBlogs').on('keyup', function() {
        table.search(this.value).draw();
      });

      // TinyMCE Initialization
      function initTinyMCE() {
        tinymce.init({
          selector: 'textarea.tinymce-editor',
          plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount emoticons quickbars',
          toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image media table emoticons | removeformat | help',
          height: 400,
          menubar: true,
          branding: false,
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
          image_advtab: true,
          file_picker_callback: function(callback, value, meta) {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            if (meta.filetype === 'image') {
              input.setAttribute('accept', 'image/*');
            }
            input.onchange = function() {
              const file = this.files[0];
              const reader = new FileReader();
              reader.onload = function(e) {
                callback(e.target.result, { alt: file.name });
              };
              reader.readAsDataURL(file);
            };
            input.click();
          },
          setup: function(editor) {
            editor.on('init', function() {
              document.querySelectorAll('.tox-tinymce-aux').forEach(function(el) {
                el.style.zIndex = '1050'; // Match Bootstrap modal z-index
              });
            });
          }
        });
      }

      // Initialize TinyMCE when modal is shown
      $('#addModal').on('shown.bs.modal', function() {
        tinymce.remove(); // Remove any existing instances
        initTinyMCE();
      });

      // Clean up TinyMCE when modal is hidden
      $('#addModal').on('hidden.bs.modal', function() {
        tinymce.remove();
      });

      // Add Blog Form Submission
      $('#addBlogForm').on('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        $.ajax({
          url: '{{ route("blogs.store") }}',
          type: 'POST',
          data: formData,
          processData: false,
          contentType: false,
          success: function(response) {
            alert('Blog added successfully!');
            location.reload();
          },
          error: function(xhr) {
            alert('Error: ' + xhr.responseJSON.message);
          }
        });
      });

      // Delete Blog
      $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        if (confirm('Are you sure you want to delete this blog?')) {
          $.ajax({
            url: `/super-admin/blogs/${id}`,
            type: 'POST',
            data: {
              _token: $('meta[name="csrf-token"]').attr('content'),
              _method: 'DELETE'
            },
            success: function() {
              alert('Blog deleted successfully!');
              location.reload();
            },
            error: function(xhr) {
              alert('Error: ' + xhr.responseJSON.message);
            }
          });
        }
      });

      // Success/Error Message Fade Out
      $('.alert').fadeOut(5000);
    });
  </script>
</body>
</html>