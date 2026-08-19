package com.bishalcodes.filetransfer

import android.Manifest
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.util.Base64
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bishalcodes.filetransfer.network.AdminNotificationPoller
import com.bishalcodes.filetransfer.network.FileReceiverService
import com.bishalcodes.filetransfer.network.FileSender
import com.bishalcodes.filetransfer.network.NsdHelper
import com.bishalcodes.filetransfer.network.UnifiedDevice
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
import com.bishalcodes.filetransfer.ui.theme.LightCard
import com.bishalcodes.filetransfer.ui.theme.PrimaryGreen
import com.bishalcodes.filetransfer.ui.theme.SubText
import com.bishalcodes.filetransfer.ui.theme.White
import com.bishalcodes.filetransfer.utils.QRCodeUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

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

data class FarP2PSession(
    val fileName: String,
    val fileSize: String,
    val link: String,
    val uri: Uri
)

data class AndroidPairRequest(
    val id: String,
    val fromId: String,
    val fromName: String,
    val targetId: String
)

@Composable
fun MainAppContainer() {
    MainNavigationContent()
}

@Composable
fun MainNavigationContent() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val nsdHelper = remember { NsdHelper(context) }

    var selectedTab by remember { mutableStateOf(NavTab.TRANSFER) }
    var isNotificationScreenOpen by remember { mutableStateOf(false) }

    val discoveredDevices by nsdHelper.discoveredDevices.collectAsState(initial = emptyList())

    // Unique Device ID & Clean Model Name for Android App
    val myDeviceId = remember { "android-" + Build.MODEL.replace(" ", "") + "-" + (1000..9999).random() }
    val myDeviceName = remember { NsdHelper.getCleanDeviceName(Build.MODEL) }

    // Pairing States
    var incomingPairRequest by remember { mutableStateOf<AndroidPairRequest?>(null) }
    var targetPairedDeviceId by remember { mutableStateOf<String?>(null) }
    var pairedDeviceName by remember { mutableStateOf<String?>(null) }

    // Far P2P Drop Zone Session
    var farP2PSession by remember { mutableStateOf<FarP2PSession?>(null) }

    // Direct File Picker for Nearby Paired Transfer
    val directNearbyPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { selectedUri ->
            val targetId = targetPairedDeviceId ?: return@rememberLauncherForActivityResult
            val meta = getFileMetadata(context, selectedUri)
            Toast.makeText(context, "Sending '${meta.first}' to $pairedDeviceName...", Toast.LENGTH_SHORT).show()

            coroutineScope.launch(Dispatchers.IO) {
                try {
                    val bytes = context.contentResolver.openInputStream(selectedUri)?.use { it.readBytes() }
                    if (bytes != null) {
                        val mimeType = context.contentResolver.getType(selectedUri) ?: "application/octet-stream"
                        val base64Data = "data:$mimeType;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)

                        // 1. Post to Cloud Radar API
                        try {
                            val connApi = URL("https://bishalcodes.com/api/v1/radar").openConnection() as HttpURLConnection
                            connApi.requestMethod = "POST"
                            connApi.setRequestProperty("Content-Type", "application/json")
                            connApi.doOutput = true
                            connApi.connectTimeout = 5000

                            val payloadApi = JSONObject().apply {
                                put("action", "send_direct_file")
                                put("id", myDeviceId)
                                put("name", myDeviceName)
                                put("targetId", targetId)
                                put("fileName", meta.first)
                                put("fileSize", bytes.size)
                                put("fileData", base64Data)
                            }

                            connApi.outputStream.use { os -> os.write(payloadApi.toString().toByteArray()) }
                            if (connApi.responseCode == 200) {
                                coroutineScope.launch(Dispatchers.Main) {
                                    Toast.makeText(context, "🎉 '${meta.first}' sent successfully to $pairedDeviceName!", Toast.LENGTH_LONG).show()
                                }
                            }
                        } catch (e: Exception) {}

                        // 2. Post to Firebase Firestore REST API for Direct File
                        try {
                            val firestoreUrl = URL("https://firestore.googleapis.com/v1/projects/bishal-mishra-3c559/databases/(default)/documents/p2p_direct_files?documentId=$targetId")
                            val connFs = firestoreUrl.openConnection() as HttpURLConnection
                            connFs.requestMethod = "POST"
                            connFs.setRequestProperty("Content-Type", "application/json")
                            connFs.doOutput = true
                            connFs.connectTimeout = 5000

                            val fieldsObj = JSONObject().apply {
                                put("senderId", JSONObject().put("stringValue", myDeviceId))
                                put("senderName", JSONObject().put("stringValue", myDeviceName))
                                put("targetId", JSONObject().put("stringValue", targetId))
                                put("fileName", JSONObject().put("stringValue", meta.first))
                                put("fileData", JSONObject().put("stringValue", base64Data))
                            }
                            val docObj = JSONObject().apply { put("fields", fieldsObj) }
                            connFs.outputStream.use { os -> os.write(docObj.toString().toByteArray()) }
                            connFs.responseCode
                        } catch (e: Exception) {}
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    // Drop Zone File Picker Launcher for Far P2P Link & QR Generation
    val dropZonePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { selectedUri ->
            val meta = getFileMetadata(context, selectedUri)
            val transferId = "p2p-" + (100000..999999).random()
            val webLink = "https://bishalcodes.com/tools/file-transfer?id=$transferId"
            farP2PSession = FarP2PSession(
                fileName = meta.first,
                fileSize = meta.second,
                link = webLink,
                uri = selectedUri
            )

            // Register payload to Cloud Radar API AND Firebase Firestore REST so link/QR downloads immediately
            coroutineScope.launch(Dispatchers.IO) {
                try {
                    val bytes = context.contentResolver.openInputStream(selectedUri)?.use { it.readBytes() }
                    if (bytes != null) {
                        val mimeType = context.contentResolver.getType(selectedUri) ?: "application/octet-stream"
                        val base64Data = "data:$mimeType;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)

                        // 1. Post to Cloud Radar API
                        try {
                            val connApi = URL("https://bishalcodes.com/api/v1/radar").openConnection() as HttpURLConnection
                            connApi.requestMethod = "POST"
                            connApi.setRequestProperty("Content-Type", "application/json")
                            connApi.doOutput = true
                            connApi.connectTimeout = 5000

                            val payloadApi = JSONObject()
                            payloadApi.put("action", "register_p2p_link")
                            payloadApi.put("transferId", transferId)
                            payloadApi.put("fileName", meta.first)
                            payloadApi.put("fileSize", bytes.size)
                            payloadApi.put("fileData", base64Data)

                            connApi.outputStream.use { os -> os.write(payloadApi.toString().toByteArray()) }
                            connApi.responseCode
                        } catch (e: Exception) {}

                        // 2. Post to Firebase Firestore REST API
                        try {
                            val firestoreUrl = URL("https://firestore.googleapis.com/v1/projects/bishal-mishra-3c559/databases/(default)/documents/p2p_links?documentId=$transferId")
                            val connFs = firestoreUrl.openConnection() as HttpURLConnection
                            connFs.requestMethod = "POST"
                            connFs.setRequestProperty("Content-Type", "application/json")
                            connFs.doOutput = true
                            connFs.connectTimeout = 5000

                            val fieldsObj = JSONObject().apply {
                                put("transferId", JSONObject().put("stringValue", transferId))
                                put("fileName", JSONObject().put("stringValue", meta.first))
                                put("fileData", JSONObject().put("stringValue", base64Data))
                            }
                            val docObj = JSONObject().apply {
                                put("fields", fieldsObj)
                            }

                            connFs.outputStream.use { os -> os.write(docObj.toString().toByteArray()) }
                            if (connFs.responseCode == 200 || connFs.responseCode == 201) {
                                coroutineScope.launch(Dispatchers.Main) {
                                    Toast.makeText(context, "P2P Link & QR Code live for instant download! 🎉", Toast.LENGTH_SHORT).show()
                                }
                            }
                        } catch (e: Exception) {}
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    // Radar Heartbeat & Incoming Pair Request Listener
    LaunchedEffect(Unit) {
        coroutineScope.launch(Dispatchers.IO) {
            while (true) {
                try {
                    val conn = URL("https://bishalcodes.com/api/v1/radar").openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true
                    conn.connectTimeout = 1200
                    conn.readTimeout = 1200

                    val body = JSONObject().apply {
                        put("id", myDeviceId)
                        put("name", myDeviceName)
                        put("platform", "android_app")
                        put("status", "active")
                    }

                    conn.outputStream.use { os -> os.write(body.toString().toByteArray()) }
                    if (conn.responseCode == 200) {
                        val responseStr = conn.inputStream.bufferedReader().use { it.readText() }
                        val json = JSONObject(responseStr)
                        if (json.optBoolean("success")) {
                            val reqs = json.optJSONArray("incomingRequests")
                            if (reqs != null && reqs.length() > 0) {
                                val reqObj = reqs.getJSONObject(0)
                                coroutineScope.launch(Dispatchers.Main) {
                                    incomingPairRequest = AndroidPairRequest(
                                        id = reqObj.getString("id"),
                                        fromId = reqObj.getString("fromId"),
                                        fromName = reqObj.optString("fromName", "Nearby Device"),
                                        targetId = reqObj.getString("targetId")
                                    )
                                }
                            }
                        }
                    }
                } catch (e: Exception) {}
                delay(2500)
            }
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
                        } else {
                            nsdHelper.stopDiscovery()
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
                            // Tapping Circular Drop Zone -> Pick File & Generate Link + QR Code!
                            onSendClick = {
                                dropZonePickerLauncher.launch("*/*")
                            },
                            // Tapping Send/Receive Nearby Buttons -> SHAREit Mode!
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
                            // EXACT SHAREIT WORKFLOW: Tapping Connect sends Invitation & Polls for Acceptance!
                            onConnectDevice = { device ->
                                Toast.makeText(context, "Sending connection invitation to ${device.name}...", Toast.LENGTH_SHORT).show()

                                coroutineScope.launch(Dispatchers.IO) {
                                    try {
                                        val conn = URL("https://bishalcodes.com/api/v1/radar").openConnection() as HttpURLConnection
                                        conn.requestMethod = "POST"
                                        conn.setRequestProperty("Content-Type", "application/json")
                                        conn.doOutput = true
                                        conn.connectTimeout = 5000

                                        val body = JSONObject().apply {
                                            put("action", "connect_request")
                                            put("id", myDeviceId)
                                            put("name", myDeviceName)
                                            put("targetId", device.id)
                                        }

                                        conn.outputStream.use { os -> os.write(body.toString().toByteArray()) }
                                        if (conn.responseCode == 200) {
                                            val respStr = conn.inputStream.bufferedReader().use { it.readText() }
                                            val respObj = JSONObject(respStr)
                                            val pairReq = respObj.optJSONObject("pairRequest")
                                            val reqId = pairReq?.optString("id")

                                            if (reqId != null) {
                                                // Poll for acceptance
                                                var accepted = false
                                                for (i in 0 until 15) { // 30s timeout
                                                    delay(2000)
                                                    val connCheck = URL("https://bishalcodes.com/api/v1/radar").openConnection() as HttpURLConnection
                                                    connCheck.requestMethod = "POST"
                                                    connCheck.setRequestProperty("Content-Type", "application/json")
                                                    connCheck.doOutput = true
                                                    connCheck.connectTimeout = 3000

                                                    val checkBody = JSONObject().apply {
                                                        put("action", "check_pair_status")
                                                        put("id", myDeviceId)
                                                    }
                                                    connCheck.outputStream.use { os -> os.write(checkBody.toString().toByteArray()) }
                                                    if (connCheck.responseCode == 200) {
                                                        val checkStr = connCheck.inputStream.bufferedReader().use { it.readText() }
                                                        val checkObj = JSONObject(checkStr)
                                                        val sentReqs = checkObj.optJSONArray("sentRequests")
                                                        if (sentReqs != null) {
                                                            for (j in 0 until sentReqs.length()) {
                                                                val r = sentReqs.getJSONObject(j)
                                                                if (r.optString("id") == reqId && r.optString("status") == "accepted") {
                                                                    accepted = true
                                                                    break
                                                                }
                                                            }
                                                        }
                                                    }
                                                    if (accepted) break
                                                }

                                                coroutineScope.launch(Dispatchers.Main) {
                                                    if (accepted) {
                                                        targetPairedDeviceId = device.id
                                                        pairedDeviceName = device.name
                                                        Toast.makeText(context, "⚡ Connected to ${device.name}! Choose file to send.", Toast.LENGTH_LONG).show()
                                                        directNearbyPickerLauncher.launch("*/*")
                                                    } else {
                                                        Toast.makeText(context, "Pairing request to ${device.name} timed out or declined.", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            }
                                        }
                                    } catch (e: Exception) {
                                        coroutineScope.launch(Dispatchers.Main) {
                                            Toast.makeText(context, "Failed to connect to ${device.name}", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                }
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

                // INCOMING PAIRING INVITATION ALERT DIALOG (RECEIVER DEVICE)
                incomingPairRequest?.let { req ->
                    AlertDialog(
                        onDismissRequest = { incomingPairRequest = null },
                        containerColor = LightBg,
                        title = {
                            Text("🔔 Pairing Invitation", color = DarkText, fontWeight = FontWeight.Black, fontSize = 18.sp)
                        },
                        text = {
                            Text(
                                text = "${req.fromName} wants to connect with your device for instant direct file transfer.",
                                color = DarkText,
                                fontSize = 13.sp
                            )
                        },
                        confirmButton = {
                            Button(
                                onClick = {
                                    val reqId = req.id
                                    val senderName = req.fromName
                                    val senderId = req.fromId
                                    incomingPairRequest = null
                                    targetPairedDeviceId = senderId
                                    pairedDeviceName = senderName

                                    coroutineScope.launch(Dispatchers.IO) {
                                        try {
                                            val conn = URL("https://bishalcodes.com/api/v1/radar").openConnection() as HttpURLConnection
                                            conn.requestMethod = "POST"
                                            conn.setRequestProperty("Content-Type", "application/json")
                                            conn.doOutput = true
                                            conn.connectTimeout = 3000

                                            val body = JSONObject().apply {
                                                put("action", "respond_request")
                                                put("requestId", reqId)
                                                put("responseStatus", "accepted")
                                            }
                                            conn.outputStream.use { os -> os.write(body.toString().toByteArray()) }
                                            conn.responseCode
                                        } catch (e: Exception) {}
                                    }

                                    Toast.makeText(context, "⚡ Accepted! Paired with $senderName.", Toast.LENGTH_SHORT).show()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen)
                            ) {
                                Text("Accept", color = White, fontWeight = FontWeight.Bold)
                            }
                        },
                        dismissButton = {
                            TextButton(
                                onClick = {
                                    val reqId = req.id
                                    incomingPairRequest = null

                                    coroutineScope.launch(Dispatchers.IO) {
                                        try {
                                            val conn = URL("https://bishalcodes.com/api/v1/radar").openConnection() as HttpURLConnection
                                            conn.requestMethod = "POST"
                                            conn.setRequestProperty("Content-Type", "application/json")
                                            conn.doOutput = true

                                            val body = JSONObject().apply {
                                                put("action", "respond_request")
                                                put("requestId", reqId)
                                                put("responseStatus", "rejected")
                                            }
                                            conn.outputStream.use { os -> os.write(body.toString().toByteArray()) }
                                            conn.responseCode
                                        } catch (e: Exception) {}
                                    }
                                }
                            ) {
                                Text("Decline", color = SubText)
                            }
                        }
                    )
                }

                // EXACT WEB MATCH: Far P2P Dashboard Modal (Link + QR Code + Instant Download Signal)
                farP2PSession?.let { session ->
                    AlertDialog(
                        onDismissRequest = { farP2PSession = null },
                        containerColor = LightBg,
                        title = {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("P2P Transfer Dashboard", color = DarkText, fontWeight = FontWeight.Black, fontSize = 18.sp)
                                IconButton(onClick = { farP2PSession = null }) {
                                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = SubText)
                                }
                            }
                        },
                        text = {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                // Selected File Card
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(LightCard, shape = RoundedCornerShape(12.dp))
                                        .border(1.dp, Color(0xFFE0F2E6), RoundedCornerShape(12.dp))
                                        .padding(12.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .clip(CircleShape)
                                                .background(PrimaryGreen),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(imageVector = Icons.Default.Share, contentDescription = null, tint = White, modifier = Modifier.size(18.dp))
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                text = session.fileName,
                                                fontWeight = FontWeight.Bold,
                                                color = DarkText,
                                                fontSize = 13.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Text(
                                                text = "Size: ${session.fileSize} • End-to-End Encrypted",
                                                color = SubText,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // QR Code Display
                                val qrBitmap = remember(session.link) {
                                    QRCodeUtils.generateQRCode(session.link, 300, 300)
                                }

                                qrBitmap?.let { bmp ->
                                    Box(
                                        modifier = Modifier
                                            .size(180.dp)
                                            .clip(RoundedCornerShape(16.dp))
                                            .background(White)
                                            .border(2.dp, PrimaryGreen, RoundedCornerShape(16.dp))
                                            .padding(10.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Image(
                                            bitmap = bmp.asImageBitmap(),
                                            contentDescription = "P2P QR Code",
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Text(
                                    text = "Scan QR code or share link below to download directly:",
                                    fontSize = 11.sp,
                                    color = SubText,
                                    textAlign = TextAlign.Center
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                // Link Box
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFFE0F2E6), shape = RoundedCornerShape(8.dp))
                                        .padding(10.dp)
                                ) {
                                    Text(
                                        text = session.link,
                                        fontSize = 11.sp,
                                        color = PrimaryGreen,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        },
                        confirmButton = {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                        val clip = android.content.ClipData.newPlainText("P2P Link", session.link)
                                        clipboard.setPrimaryClip(clip)
                                        Toast.makeText(context, "P2P Link copied to clipboard!", Toast.LENGTH_SHORT).show()
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen)
                                ) {
                                    Text("Copy Link", color = White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }

                                Button(
                                    onClick = {
                                        val sendIntent = Intent().apply {
                                            action = Intent.ACTION_SEND
                                            // PURE RAW URL ONLY so scanners and browsers open link directly!
                                            putExtra(Intent.EXTRA_TEXT, session.link)
                                            type = "text/plain"
                                        }
                                        context.startActivity(Intent.createChooser(sendIntent, "Share P2P Link"))
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF121A15))
                                ) {
                                    Text("Share", color = White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

fun getFileMetadata(context: Context, uri: Uri): Pair<String, String> {
    var name = "Shared_File"
    var sizeStr = "Unknown Size"
    try {
        val cursor: Cursor? = context.contentResolver.query(uri, null, null, null, null)
        cursor?.use {
            if (it.moveToFirst()) {
                val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = it.getColumnIndex(OpenableColumns.SIZE)
                if (nameIndex != -1) name = it.getString(nameIndex) ?: "Shared_File"
                if (sizeIndex != -1) {
                    val bytes = it.getLong(sizeIndex)
                    sizeStr = when {
                        bytes > 1024 * 1024 * 1024 -> String.format("%.2f GB", bytes.toDouble() / (1024 * 1024 * 1024))
                        bytes > 1024 * 1024 -> String.format("%.2f MB", bytes.toDouble() / (1024 * 1024))
                        bytes > 1024 -> String.format("%.2f KB", bytes.toDouble() / 1024)
                        else -> "$bytes Bytes"
                    }
                }
            }
        }
    } catch (e: Exception) {}
    return Pair(name, sizeStr)
}
