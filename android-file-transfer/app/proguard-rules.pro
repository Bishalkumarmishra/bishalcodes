# Keep Kotlin Coroutines
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# Keep Compose rules
-keep class androidx.compose.material3.** { *; }
-keep class androidx.compose.ui.** { *; }

# Keep ZXing rules for QR Code generation
-keep class com.google.zxing.** { *; }
-dontwarn com.google.zxing.**

# Keep Application models & network classes
-keep class com.bishalcodes.filetransfer.network.** { *; }
-keep class com.bishalcodes.filetransfer.ui.** { *; }

# Strip logging in release builds (optional optimization)
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
