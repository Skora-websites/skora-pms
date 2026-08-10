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

    <link rel="stylesheet" href="../../assets/vendor/css/pages/page-faq.css" />
 
</head>

<body>
<div class="layout-wrapper layout-content-navbar">
  <div class="layout-container">
    @include('super-admin.inc.sidebar')
    <div class="layout-page">
      @include('super-admin.inc.header')

         <div class="content-wrapper">

   

          
          <div class="content-backdrop fade"></div>
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



</body>
</html>
