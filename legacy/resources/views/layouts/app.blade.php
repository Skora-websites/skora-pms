<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" 
      data-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#000000"/>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Skora Care">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="Skora Care">
    <meta name="msapplication-TileColor" content="#000000">
    <meta name="msapplication-TileImage" content="/icon-144x144.png">
    
    <!-- Manifest -->
    <link rel="manifest" href="{{ asset('manifest.json') }}">
    
    <!-- Icons -->
    <link rel="icon" href="{{ asset('icon-32x32.png') }}" sizes="32x32" type="image/png">
    <link rel="icon" href="{{ asset('icon-192x192.png') }}" sizes="192x192" type="image/png">
    <link rel="apple-touch-icon" href="{{ asset('icon-180x180.png') }}">
    
    <title>@yield('title', config('app.name', 'Skora Care'))</title>
    
    <!-- Vite CSS -->
    @vite(['resources/css/app.css'])
    
    <!-- PWA Styles -->
    <style>
        .pwa-install-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            display: none;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .pwa-install-btn.show {
            display: block;
            animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        /* PWA-specific styles */
        @media (display-mode: standalone) {
            body {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
            }
            .pwa-install-btn {
                display: none !important;
            }
        }
    </style>
    
    @stack('styles')
</head>
<body>
    <div id="app">
        <!-- Your application content -->
        @yield('content')
    </div>
    
    <!-- PWA Install Button -->
    <button id="pwaInstallBtn" class="pwa-install-btn">
        📱 Install App
    </button>
    
    <!-- Vite JS -->
    @vite(['resources/js/app.js'])
    
    <!-- PWA Script -->
    <script>
        // PWA Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                const swUrl = '{{ asset("sw.js") }}';
                
                navigator.serviceWorker.register(swUrl)
                    .then(function(registration) {
                        console.log('✅ Service Worker registered with scope:', registration.scope);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            console.log('🔄 Service Worker update found:', newWorker);
                            
                            newWorker.addEventListener('statechange', () => {
                                console.log('🔄 New Service Worker state:', newWorker.state);
                                
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('🔄 New content available!');
                                    // Show update notification
                                    if (confirm('New version available! Reload to update?')) {
                                        window.location.reload();
                                    }
                                }
                            });
                        });
                    })
                    .catch(function(error) {
                        console.log('❌ Service Worker registration failed:', error);
                    });
            });
        } else {
            console.log('❌ Service Workers not supported');
        }
        
        // PWA Installation Prompt
        let deferredPrompt;
        const installBtn = document.getElementById('pwaInstallBtn');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('✅ PWA install prompt available');
            
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            
            // Show install button
            if (installBtn) {
                installBtn.classList.add('show');
            }
            
            // Log install criteria
            console.log('PWA Install Criteria:');
            console.log('- Secure context:', window.isSecureContext);
            console.log('- Engagement:', navigator.userAgent);
        });
        
        // Install button click handler
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) {
                    alert('Installation not available');
                    return;
                }
                
                // Show the install prompt
                deferredPrompt.prompt();
                
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                
                console.log(`User response to the install prompt: ${outcome}`);
                
                // Hide the install button
                installBtn.classList.remove('show');
                
                // Clear the saved prompt
                deferredPrompt = null;
            });
        }
        
        // Detect if running as PWA
        window.addEventListener('load', () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
            
            if (isStandalone || isFullscreen) {
                console.log('📱 Running as installed PWA');
                // You can add PWA-specific logic here
            } else {
                console.log('🌐 Running in browser');
            }
        });
        
        // Detect online/offline status
        window.addEventListener('online', () => {
            console.log('✅ Back online');
            document.body.classList.remove('offline');
        });
        
        window.addEventListener('offline', () => {
            console.log('❌ You are offline');
            document.body.classList.add('offline');
        });
        
        // Check initial online status
        if (!navigator.onLine) {
            document.body.classList.add('offline');
        }
        
        // Log PWA capabilities
        console.log('🔧 PWA Capabilities Check:');
        console.log('- Service Worker:', 'serviceWorker' in navigator);
        console.log('- Cache API:', 'caches' in window);
        console.log('- IndexedDB:', 'indexedDB' in window);
        console.log('- Notifications:', 'Notification' in window);
        console.log('- Push Manager:', 'PushManager' in window);
        console.log('- Install Prompt:', 'BeforeInstallPromptEvent' in window);
    </script>
    
    @stack('scripts')
</body>
</html>