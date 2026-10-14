package com.skoracare.sos;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * SOS dispatch host activity.
 *
 * Registers the Kotlin {@link SosLocationPlugin} so the WebView can start and
 * stop the foreground location service used to stream the doctor's live GPS to
 * the patient's tracker (Uber-style).
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SosLocationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
