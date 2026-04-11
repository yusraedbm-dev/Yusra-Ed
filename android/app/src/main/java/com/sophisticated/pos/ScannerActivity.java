package com.sophisticated.pos;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.journeyapps.barcodescanner.BarcodeCallback;
import com.journeyapps.barcodescanner.BarcodeResult;
import com.journeyapps.barcodescanner.DecoratedBarcodeView;
import java.util.List;

public class ScannerActivity extends AppCompatActivity {
    private DecoratedBarcodeView barcodeView;
    private long lastScanTime = 0;
    private String lastCode = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        barcodeView = new DecoratedBarcodeView(this);
        setContentView(barcodeView);

        // Tap to close functionality
        barcodeView.setOnClickListener(v -> finish());

        barcodeView.decodeContinuous(new BarcodeCallback() {
            @Override
            public void barcodeResult(BarcodeResult result) {
                String code = result.getText();
                if (code == null) return;

                long currentTime = System.currentTimeMillis();

                // Prevent duplicate scans within 1.5 seconds
                if (code.equals(lastCode) && (currentTime - lastScanTime) < 1500) {
                    return;
                }

                lastCode = code;
                lastScanTime = currentTime;

                // Send broadcast to MainActivity
                Intent intent = new Intent("SCAN_RESULT");
                intent.putExtra("code", code);
                sendBroadcast(intent);
            }

            @Override
            public void possibleResultPoints(List<com.google.zxing.ResultPoint> resultPoints) {}
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        barcodeView.resume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        barcodeView.pause();
    }
}
