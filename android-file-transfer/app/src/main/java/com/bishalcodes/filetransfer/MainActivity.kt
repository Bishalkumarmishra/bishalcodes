package com.bishalcodes.filetransfer

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.bishalcodes.filetransfer.network.AdminNotificationPoller
import com.bishalcodes.filetransfer.network.FileReceiverService
import com.bishalcodes.filetransfer.network.FileSender
import com.bishalcodes.filetransfer.network.NsdHelper
import com.bishalcodes.filetransfer.ui.components.BottomNavBar
import com.bishalcodes.filetransfer.ui.components.NavTab
import com.bishalcodes.filetransfer.ui.screens.HistoryScreen
import com.bishalcodes.filetransfer.ui.screens.NotificationScreen
import com.bishalcodes.filetransfer.ui.screens.RadarScreen
import com.bishalcodes.filetransfer.ui.screens.SettingsScreen
import com.bishalcodes.filetransfer.ui.screens.SplashScreen
import com.bishalcodes.filetransfer.ui.screens.WebMatchedHomeScreen
import com.bishalcodes.filetransfer.ui.theme.AndroidFileTransferTheme
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AndroidFileTransferTheme {
                MainAppContainer()
            }
        }
    }
}

@Composable
fun MainAppContainer() {
    var showSplash by remember { mutableStateOf(true) }

    if (showSplash) {
        SplashScreen(onSplashFinished = { showSplash = false })
    } else {
        MainNavigationContent()
    }
}

@Composable
fun MainNavigationContent() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val nsdHelper = remember { NsdHelper(context) }
    val fileSender = remember { FileSender(context) }

    var selectedTab by remember { mutableStateOf(NavTab.TRANSFER) }
    var selectedFileUri by remember { mutableStateOf<Uri?>(null) }
    var isNotificationScreenOpen by remember { mutableStateOf(false) }

    val discoveredDevices by nsdHelper.discoveredDevices.collectAsState(initial = emptyList())

    // File Picker Launcher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            selectedFileUri = it
            selectedTab = NavTab.RADAR
            nsdHelper.discoverServices()
            Toast.makeText(context, "File selected! Scanning radar...", Toast.LENGTH_SHORT).show()
        }
    }

    // Permission launcher for Android 13+
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { _ -> }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.NEARBY_WIFI_DEVICES,
                    Manifest.permission.POST_NOTIFICATIONS
                )
            )
        }
        // Start live polling for bishalcodes.com Admin Push Notifications
        AdminNotificationPoller.startPolling(context, coroutineScope)
    }

    if (isNotificationScreenOpen) {
        NotificationScreen(onBack = { isNotificationScreenOpen = false })
    } else {
        Scaffold(
            bottomBar = {
                BottomNavBar(
                    selectedTab = selectedTab,
                    onTabSelected = { tab ->
                        selectedTab = tab
                        if (tab == NavTab.RADAR) {
                            nsdHelper.discoverServices()
                        }
                    }
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (selectedTab) {
                    NavTab.TRANSFER -> {
                        WebMatchedHomeScreen(
                            onSendClick = { filePickerLauncher.launch("*/*") },
                            onReceiveClick = {
                                nsdHelper.registerService(12345)
                                val intent = Intent(context, FileReceiverService::class.java)
                                context.startForegroundService(intent)
                                Toast.makeText(context, "Receiver active! Waiting for P2P connection...", Toast.LENGTH_LONG).show()
                            },
                            onNotificationClick = {
                                isNotificationScreenOpen = true
                            }
                        )
                    }

                    NavTab.RADAR -> {
                        RadarScreen(
                            discoveredDevices = discoveredDevices,
                            onConnectDevice = { device ->
                                selectedFileUri?.let { uri ->
                                    val hostAddress = device.host?.hostAddress
                                    if (hostAddress != null) {
                                        Toast.makeText(context, "Sending P2P file to ${device.serviceName}...", Toast.LENGTH_SHORT).show()
                                        coroutineScope.launch {
                                            val success = fileSender.sendFile(uri, hostAddress, device.port)
                                            if (success) {
                                                Toast.makeText(context, "P2P Transfer Successful! 🎉", Toast.LENGTH_SHORT).show()
                                                selectedTab = NavTab.HISTORY
                                            } else {
                                                Toast.makeText(context, "P2P Transfer failed.", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    }
                                } ?: Toast.makeText(context, "Please select a file first from Transfer tab!", Toast.LENGTH_LONG).show()
                            }
                        )
                    }

                    NavTab.HISTORY -> {
                        HistoryScreen()
                    }

                    NavTab.SETTINGS -> {
                        SettingsScreen()
                    }
                }
            }
        }
    }
}
