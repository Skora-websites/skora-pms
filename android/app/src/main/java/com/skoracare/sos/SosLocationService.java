package com.skoracare.sos;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;


/**
 * Foreground location service for SOS dispatch.
 *
 * Keeps a 5-second high-accuracy GPS stream alive while the doctor is en
 * route, publishing an ongoing low-importance notification so Android does
 * not reclaim the process mid-visit. Updates are forwarded to the plugin's
 * listener registry (never a broadcast) so only the SOS WebView receives
 * them.
 */
public class SosLocationService extends Service {

    /** Callback sink owned by the plugin; null while tracking is stopped. */
    public interface LocationSink {
        void onLocation(double lat, double lng, long timestamp);
    }

    private static final String CHANNEL_ID = "sos_tracking";
    private static final int NOTIFICATION_ID = 1001;

    private static LocationSink sink;

    private FusedLocationProviderClient fusedClient;
    private final LocationCallback locationCallback = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult result) {
            Location location = result.getLastLocation();
            if (location == null) return;
            LocationSink target = sink;
            if (target != null) {
                target.onLocation(location.getLatitude(), location.getLongitude(), location.getTime());
            }
        }
    };

    /** Installs (or clears) the sink that receives location updates. */
    public static void setSink(LocationSink target) {
        sink = target;
    }

    public static boolean hasLocationPermission(android.content.Context context) {
        return ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED
            || ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        fusedClient = LocationServices.getFusedLocationProviderClient(this);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Android 14+ requires the type at start time; older versions ignore it.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID, buildNotification());
        }
        startLocationUpdates();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        fusedClient.removeLocationUpdates(locationCallback);
        sink = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void startLocationUpdates() {
        if (!hasLocationPermission(this)) return;

        // create() + setters is deprecated in favour of the Builder, but it is
        // the API the probe validated and the builder's constant resolution
        // differs across play-services versions.
        LocationRequest request = LocationRequest.create()
                .setInterval(5000)
                .setFastestInterval(3000)
                .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SkoraCare SOS",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Live location sharing during an emergency visit");
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    private android.app.Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SkoraCare SOS active")
                .setContentText("Sharing live location with the patient")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }
}
