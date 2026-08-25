package com.skoracare.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Enable remote debugging (chrome://inspect) — helps diagnose the
        // black screen if the live site fails to load in the WebView.
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
