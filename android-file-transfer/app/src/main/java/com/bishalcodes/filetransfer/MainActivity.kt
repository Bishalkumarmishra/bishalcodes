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
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.bishalcodes.filetransfer.ui.theme.DarkText
import com.bishalcodes.filetransfer.ui.theme.LightBg
import com.bishalcodes.filetransfer.ui.theme.PrimaryGreen
import com.bishalcodes.filetransfer.ui.theme.White
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
    var showFarP2PDialog by remember { mutableStateOf(false) }
    var farP2PLink by remember { mutableStateOf("") }

    val discoveredDevices by nsdHelper.discoveredDevices.collectAsState(initial = emptyList())

    // File Picker Launcher for Nearby Direct Stream
    val directFilePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            selectedFileUri = it
            Toast.makeText(context, "Sending file directly to nearby device...", Toast.LENGTH_SHORT).show()
        }
    }

    // Permission launcher for Location, Bluetooth & Nearby Wi-Fi
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { _ -> }

    LaunchedEffect(Unit) {
        val permissionsToRequest = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissionsToRequest.add(Manifest.permission.BLUETOOTH_CONNECT)
            permissionsToRequest.add(Manifest.permission.BLUETOOTH_SCAN)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsToRequest.add(Manifest.permission.NEARBY_WIFI_DEVICES)
            permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            permissionsToRequest.add(Manifest.permission.READ_MEDIA_IMAGES)
            permissionsToRequest.add(Manifest.permission.READ_MEDIA_VIDEO)
        } else {
            permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        }

        permissionLauncher.launch(permissionsToRequest.toTypedArray())
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
                            nsdHelper.discoverServices(coroutineScope)
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
                            // METHOD A: Central Drop Zone -> Far P2P Link & QR Generator
                            onSendClick = {
                                val transferId = "p2p-" + (100000..999999).random()
                                farP2PLink = "https://bishalcodes.com/tools/file_transfer?id=$transferId"
                                showFarP2PDialog = true
                            },
                            // METHOD B: Send / Receive Nearby Device Buttons
                            onReceiveClick = {
                                selectedTab = NavTab.RADAR
                                nsdHelper.registerService(12345)
                                nsdHelper.discoverServices(coroutineScope)
                                val intent = Intent(context, FileReceiverService::class.java)
                                context.startForegroundService(intent)
                                Toast.makeText(context, "Nearby Receiver Active! Scanning nearby devices...", Toast.LENGTH_LONG).show()
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
                                // Send Invitation Prompt to Device -> On Acceptance -> Pick File & Stream!
                                Toast.makeText(context, "Sending pairing invitation to ${device.name}...", Toast.LENGTH_SHORT).show()
                                directFilePickerLauncher.launch("*/*")
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

                // Far P2P Link & QR Dialog (Method A)
                if (showFarP2PDialog) {
                    AlertDialog(
                        onDismissRequest = { showFarP2PDialog = false },
                        containerColor = LightBg,
                        title = {
                            Text("Far P2P Share Link", color = DarkText, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        },
                        text = {
                            Column {
                                Text("Share this direct link to transfer files across long distances:", fontSize = 13.sp, color = Color.Gray)
                                Spacer(modifier = Modifier.height(12.dp))
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFFE0F2E6), shape = RoundedCornerShape(8.dp))
                                        .padding(12.dp)
                                ) {
                                    Text(farP2PLink, fontSize = 12.sp, color = PrimaryGreen, fontWeight = FontWeight.Bold)
                                }
                            }
                        },
                        confirmButton = {
                            Button(
                                onClick = {
                                    val sendIntent = Intent().apply {
                                        action = Intent.ACTION_SEND
                                        putExtra(Intent.EXTRA_TEXT, farP2PLink)
                                        type = "text/plain"
                                    }
                                    context.startActivity(Intent.createChooser(sendIntent, "Share Far P2P Link"))
                                    showFarP2PDialog = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen)
                            ) {
                                Text("Share Link", color = White, fontWeight = FontWeight.Bold)
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showFarP2PDialog = false }) {
                                Text("Close", color = Color.Gray)
                            }
                        }
                    )
                }
            }
        }
    }
}
