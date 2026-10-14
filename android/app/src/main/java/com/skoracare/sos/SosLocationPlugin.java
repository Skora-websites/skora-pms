package com.skoracare.sos;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Native SOS location bridge.
 *
 * Streams the doctor's live GPS to the patient tracker while an emergency case
 * is active. The JS side calls {@link #startTracking(PluginCall)} once and
 * listens on the "location" event; {@link #stopTracking(PluginCall)} tears the
 * foreground service down.
 *
 * The foreground service is what keeps the stream alive when the WebView is
 * backgrounded — the browser geolocation API stops delivering fixes as soon as
 * the page is hidden.
 */
@CapacitorPlugin(
        name = "SosLocation",
        permissions = {
                @Permission(alias = "location", strings = { android.Manifest.permission.ACCESS_FINE_LOCATION }),
        }
)
public class SosLocationPlugin extends Plugin implements SosLocationService.LocationSink {

    private boolean tracking = false;
    private JSObject lastLocation = null;

    @Override
    public void load() {
        super.load();
        SosLocationService.setSink(this);
    }

    @Override
    public void handleOnDestroy() {
        stopService();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void startTracking(PluginCall call) {
        if (!hasLocationPermission()) {
            // The alias comes from the @Permission annotation above; Capacitor
            // maps the granted/denied result back through permissionAlias.
            requestPermissionForAlias("location", call, "locationPermissionCallback");
            return;
        }
        beginTracking(call);
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (!hasLocationPermission()) {
            call.reject("Location permission denied — cannot share live location.");
            return;
        }
        beginTracking(call);
    }

    private void beginTracking(PluginCall call) {
        if (!tracking) {
            tracking = true;
            SosLocationService.setSink(this);
            Intent intent = new Intent(getContext(), SosLocationService.class);
            ContextCompat.startForegroundService(getContext(), intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        stopService();
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("tracking", tracking);
        result.put("lastLocation", lastLocation);
        call.resolve(result);
    }

    @Override
    public void onLocation(double lat, double lng, long timestamp) {
        JSObject payload = new JSObject();
        payload.put("lat", lat);
        payload.put("lng", lng);
        payload.put("timestamp", timestamp);
        lastLocation = payload;
        // notifyListeners is Capacitor 8's documented event channel; the JS
        // side registers with addListener("location", …).
        notifyListeners("location", payload);
    }

    private void stopService() {
        tracking = false;
        SosLocationService.setSink(null);
        getContext().stopService(new Intent(getContext(), SosLocationService.class));
    }

    private boolean hasLocationPermission() {
        return SosLocationService.hasLocationPermission(getContext());
    }
}
