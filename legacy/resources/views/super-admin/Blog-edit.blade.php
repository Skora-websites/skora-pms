<!DOCTYPE html>
<html lang="en"
  class="light-style layout-navbar-fixed layout-menu-fixed layout-compact"
  dir="ltr"
  data-theme="theme-default"
  data-assets-path="assets/"
  data-template="vertical-menu-template"
  data-style="light">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
  
  <meta name="csrf-token" content="{{ csrf_token() }}"> 
  @include('admin.inc.links')
</head>

<body>
  <!-- Layout wrapper -->
  <div class="layout-wrapper layout-content-navbar">
    <div class="layout-container">
      @include('admin.inc.sidebar')
      @include('admin.inc.header')

      <!-- Content wrapper -->
      <div class="content-wrapper">
        <div class="container-xxl flex-grow-1 container-p-y">          
          <div class="card py-2">
            <div class="card-header py-4 no-bg bg-transparent d-flex align-items-center border-bottom flex-wrap justify-content-between">
              <h5 class="fw-bold mb-5">Blogs Details</h5>
            </div>

            <div class="col-md-4 m-auto mt-3">
              @if ($errors->any())
                <div class="alert alert-danger">
                  <ul>
                    @foreach ($errors->all() as $error)
                      <li> &#128073; {{ $error }}</li>
                    @endforeach
                  </ul>
                </div>
              @endif
            </div>

            <!-- Blog Listing -->
              <div class="p-4 mt-3 mb-5">
                <h5 class="modal-title">Update Blogs Details</h5>
                <div class="mt-3" id="successMessage"></div> 
                <form id="editblogForm" action="{{ route('admin.blogs.update', $blog->id) }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    @method('PUT') 
                    
                    <input type="hidden" name="id" value="{{ $blog->id }}">
                
                    <div class="row">

                      <div class="col-md-3 mb-3 d-none">
                        <label>Counselling Courses:</label>
                          {!! selectboxforforeignkey('counsellingcourses', 'id', 'name', 'counsellingcourseid', 'status', 1, $blog->counsellingcourseid) !!}
                      </div>


                        <div class="col-md-4 mb-3">
                            <label>Category:</label>
                            <select name="category_id" class="form-control">
                                @foreach ($categories as $category)
                                    <option value="{{ $category->id }}" {{ $blog->category_id == $category->id ? 'selected' : '' }}>
                                        {{ $category->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                
                        <div class="col-md-4 mb-3">
                            <label>Title:</label>
                            <input type="text" name="title" class="form-control" value="{{ old('title', $blog->title) }}">
                        </div>
                
                        <div class="col-md-4 mb-3">
                            <label>Image:</label>
                            <input type="file" name="image" class="form-control">
                            @if($blog->image)
                                <img src="{{ asset($blog->image) }}" width="80" height="50" class="mt-2">
                            @endif
                        </div>
                
                        <div class="col-md-6 mb-3 d-none">
                            <label>Additional Images:</label>
                            <input type="file" name="images[]" class="form-control" multiple>
                            @foreach($blog->images as $img)
                                <img src="{{ asset($img->image) }}" width="50" height="40" class="mt-2">
                            @endforeach
                        </div>
                
                        <div class="col-md-12 mb-3">
                          <label>Short Discription:</label>
                          <textarea name="shortcontent" id="content" class="form-control ">{{ $blog->shortcontent }}</textarea>
                      </div>
          
                        <div class="col-md-12 mb-3">
                            <label>Description:</label>
                            <textarea name="content" class="form-control tinymce-editor">{{$blog->content }}</textarea>
                        </div>
                    </div>
                
                    <button type="submit" class="btn btn-primary">Update Blog</button>
                </form>
                
                
              </div>

          </div>
          <div class="content-backdrop fade"></div>
        </div>
      </div>
    </div>

    <div class="layout-overlay layout-menu-toggle"></div>
    <div class="drag-target"></div>
  </div>

  <!-- Scripts -->
  <script src="{{ asset('assets/vendor/libs/jquery/jquery.js')}}"></script>
  <script src="{{ asset('assets/vendor/libs/popper/popper.js')}}"></script>
  <script src="{{ asset('assets/vendor/js/bootstrap.js')}}"></script>
  <script src="{{ asset('assets/vendor/libs/node-waves/node-waves.js')}}"></script>
  <script src="{{ asset('assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js')}}"></script>
  <script src="{{ asset('assets/js/main.js')}}"></script>

  
  <script>
    $(document).ready(function () {

        $.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});

$(".updateBlog").click(function (e) {
    e.preventDefault();
    let id = $(this).data("id");
    let formData = new FormData($("#editblogForm")[0]);

    $.ajax({
        url: "/blogs/update/" + id,
        type: "PATCH",
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            alert(response);
            $("#successMessage").html(`<div class="alert alert-success">Blog updated successfully!</div>`);
            setTimeout(() => { $("#successMessage").fadeOut(); }, 4000);
        },
        error: function (xhr) {
            let errors = xhr.responseJSON.errors;
            if (errors) {
                alert(Object.values(errors).flat().join("\n"));
            } else {
                alert("Something went wrong!");
            }
        }
    });
});


        $(".deleteBlog").click(function () {
            let id = $(this).data("id");
            let confirmDelete = confirm("Are you sure you want to delete this blog?");
            if (!confirmDelete) return;

            $.ajax({
                url: "/blogs/" + id,
                type: "DELETE",
                headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
                success: function (response) {
                    alert("Blog deleted successfully!");
                    location.reload();
                },
                error: function (error) {
                    alert("Error while deleting blog!");
                }
            });
        });
    });


  </script>



<script src="{{ asset('tiny/vendor/tinymce/tinymce.min.js') }}"></script>

<script>
  const useDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 1023.5px)').matches;
  
  tinymce.init({
    selector: 'textarea.tinymce-editor',
    plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
    editimage_cors_hosts: ['picsum.photos'],
    menubar: 'file edit view insert format tools table help',
    toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
    toolbar_sticky: true,
    forced_root_block: "", 
    force_br_newlines: true, 
    force_p_newlines: false,
    convert_newlines_to_brs: true,
    toolbar_sticky_offset: isSmallScreen ? 102 : 108,
    autosave_ask_before_unload: true,
    autosave_interval: '30s',
    autosave_prefix: '{path}{query}-{id}-',
    autosave_restore_when_empty: false,
    autosave_retention: '2m',
    image_advtab: true,
    link_list: [{
        title: 'My page 1',
        value: 'https://www.tiny.cloud'
      },
      {
        title: 'My page 2',
        value: 'http://www.moxiecode.com'
      }
    ],
    image_list: [{
        title: 'My page 1',
        value: 'https://www.tiny.cloud'
      },
      {
        title: 'My page 2',
        value: 'http://www.moxiecode.com'
      }
    ],
    image_class_list: [{
        title: 'None',
        value: ''
      },
      {
        title: 'Some class',
        value: 'class-name'
      }
    ],
    importcss_append: true,
    file_picker_callback: (callback, value, meta) => {

      if (meta.filetype === 'file') {
        callback('https://www.google.com/logos/google.jpg', {
          text: 'My text'
        });
      }

      if (meta.filetype === 'image') {
        callback('https://www.google.com/logos/google.jpg', {
          alt: 'My alt text'
        });
      }

      if (meta.filetype === 'media') {
        callback('movie.mp4', {
          source2: 'alt.ogg',
          poster: 'https://www.google.com/logos/google.jpg'
        });
      }
    },
    templates: [{
        title: 'New Table',
        content: 'creates a new table',
        content: '<div class="mceTmpl"><table width="98%%"  border="0" cellspacing="0" cellpadding="0"><tr><th scope="col"> </th><th scope="col"> </th></tr><tr><td> </td><td> </td></tr></table></div>'
      },
      {
        title: 'Starting my story',
        content: 'A cure for writers block',
        content: 'Once upon a time...'
      },
      {
        title: 'New list with dates',
        content: 'New List with dates',
        content: '<div class="mceTmpl"><span class="cdate">cdate</span><br><span class="mdate">mdate</span><h2>My List</h2><ul><li></li><li></li></ul></div>'
      }
    ],
    template_cdate_format: '[Date Created (CDATE): %m/%d/%Y : %H:%M:%S]',
    template_mdate_format: '[Date Modified (MDATE): %m/%d/%Y : %H:%M:%S]',
    height: 400,
    image_caption: true,
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
    noneditable_class: 'mceNonEditable',
    toolbar_mode: 'sliding',
    contextmenu: 'link image table',
    skin: useDarkMode ? 'oxide-dark' : 'oxide',
    content_css: useDarkMode ? 'dark' : 'default',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }'
  });

</script>

<style>
  .tox-tinymce {
      height: 400px !important;
  }
  </style>

</body>
</html>
