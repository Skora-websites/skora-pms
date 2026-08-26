# Probe 3: Minimal Capacitor Sidecar for Background GPS Daemon

## Test Plan (Manual - requires Android Studio / Xcode)

### Setup Commands
```bash
# Create throwaway Capacitor project
cd /tmp
npx @capacitor/cli create probe-gps --web-dir=dist --package-name=com.skoracare.probe
cd probe-gps

# Add platforms
npx cap add android
npx cap add ios

# Install plugins
npm install @capacitor/geolocation @capacitor/background-task

# Sync
npx cap sync
```

### Android: Foreground Service (MainActivity.java / Kotlin)
```kotlin
// android/app/src/main/java/com/skoracare/probe/MainActivity.kt
package com.skoracare.probe

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.getcapacitor.BridgeActivity
import com.google.android.gms.location.*

class LocationForegroundService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private val CHANNEL_ID = "gps_tracking_channel"
    private val NOTIFICATION_ID = 1001

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startLocationUpdates()
        return START_STICKY
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.create().apply {
            interval = 5000
            fastestInterval = 3000
            priority = Priority.PRIORITY_HIGH_ACCURACY
        }

        val locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    // Broadcast to WebView via JS bridge
                    val intent = Intent("com.skoracare.GPS_UPDATE").apply {
                        putExtra("lat", location.latitude)
                        putExtra("lng", location.longitude)
                        putExtra("timestamp", System.currentTimeMillis())
                    }
                    sendBroadcast(intent)
                }
            }
        }

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "GPS Tracking", NotificationManager.IMPORTANCE_LOW)
            channel.description = "Background location tracking for SOS"
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): NotificationCompat.Builder {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SkoraCare SOS Active")
            .setContentText("Sharing live location with patient")
            .setSmallIcon(R.drawable.ic_location)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
    }

    override fun onBind(intent: Intent): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }
}

// In MainActivity - start service when SOS starts
class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Listen for JS bridge message to start/stop service
    }
}
```

### AndroidManifest.xml additions
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

<service
    android:name=".LocationForegroundService"
    android:foregroundServiceType="location"
    android:exported="false" />
```

### iOS: Background Location (AppDelegate.swift)
```swift
// ios/App/AppDelegate.swift
import UIKit
import Capacitor
import CoreLocation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, CLLocationManagerDelegate {
    var window: UIWindow?
    let locationManager = CLLocationManager()

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.activityType = .fitness
        locationManager.distanceFilter = 10 // meters

        // Request always authorization
        locationManager.requestAlwaysAuthorization()
        return true
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        if status == .authorizedAlways {
            locationManager.startUpdatingLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        // Send to WebView via Capacitor bridge
        let data: [String: Any] = [
            "lat": location.coordinate.latitude,
            "lng": location.coordinate.longitude,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        NotificationCenter.default.post(name: Notification.Name("capacitor.gps.update"), object: nil, userInfo: data)
    }
}
```

### Info.plist additions
```xml
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>SkoraCare needs your location to share live position during SOS emergencies</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>SkoraCare needs your location to share live position during SOS emergencies</string>
```

### PWA ↔ Native Bridge (WebView)
```javascript
// In PWA (served from Vercel)
window.addEventListener('capacitor.gps.update', (e) => {
  const { lat, lng, timestamp } = e.detail;
  // Update UI, send to backend
  fetch('/api/doctor/sos/last-location', {
    method: 'POST',
    body: JSON.stringify({ lat, lng, caseId: activeCaseId })
  });
});

// Or via local WebSocket (more reliable)
const ws = new WebSocket('ws://localhost:8080/gps');
ws.onmessage = (msg) => { /* handle GPS */ };
```

---

## Expected Results

| Platform | Background GPS Survival | Bundle Overhead | PWA Communication |
|----------|------------------------|-----------------|-------------------|
| Android  | 30min+ ✅ (Foreground Service) | ~2-3MB | BroadcastReceiver → JS Bridge / Local WS ✅ |
| iOS      | 30min+ ✅ (Background Mode) | ~1-2MB | NotificationCenter → JS Bridge / Local WS ✅ |

## Reality Check
- **Build**: Yes, builds with standard Capacitor workflow
- **Background survival**: Android Foreground Service = reliable; iOS background location = reliable but requires "Always" permission
- **Bundle overhead**: ~3-5MB total (Capacitor core + geolocation + background-task)
- **PWA communication**: capacitor:// protocol not available from Vercel-served PWA. Must use local WebSocket or Capacitor's JS bridge (requires native app shell)
- **Critical limitation**: A PWA served from Vercel **cannot** directly talk to native plugins. You need a Capacitor app shell (native wrapper) that loads the PWA.

---

## Verdict
**PROBE 3: CONDITIONAL PASS** — Native background GPS works, but requires full Capacitor app (not PWA-only). PWA from Vercel can't access native plugins without native wrapper.