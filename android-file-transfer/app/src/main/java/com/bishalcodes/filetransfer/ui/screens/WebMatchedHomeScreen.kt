package com.bishalcodes.filetransfer.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bishalcodes.filetransfer.R
import com.bishalcodes.filetransfer.network.AdminNotificationPoller
import com.bishalcodes.filetransfer.ui.theme.Black
import com.bishalcodes.filetransfer.ui.theme.BrightGreen
import com.bishalcodes.filetransfer.ui.theme.CardGray
import com.bishalcodes.filetransfer.ui.theme.DarkGray
import com.bishalcodes.filetransfer.ui.theme.DarkGreen
import com.bishalcodes.filetransfer.ui.theme.NeonGreen
import com.bishalcodes.filetransfer.ui.theme.White
import java.text.SimpleDateFormat
import java.util.*

val NavyDark = Color(0xFF090E17)
val MutedBlue = Color(0xFF8F9CAE)
val MutedGrey = Color(0xFF6B7A90)

@Composable
fun WebMatchedHomeScreen(
    onSendClick: () -> Unit,
    onReceiveClick: () -> Unit
) {
    val context = LocalContext.current
    val density = LocalDensity.current
    var showNotificationDialog by remember { mutableStateOf(false) }

    val infiniteTransition = rememberInfiniteTransition(label = "wavePulse")
    val waveProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "waveProgress"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Header matching bishalcodes.com with Notification Bell Icon
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(NeonGreen),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = "Logo",
                        tint = Black,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "BishalCodes",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = White
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // Notification Bell Icon with Badge
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(DarkGray)
                        .clickable {
                            AdminNotificationPoller.unreadCount = 0
                            showNotificationDialog = true
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = "Notifications",
                        tint = NeonGreen,
                        modifier = Modifier.size(20.dp)
                    )
                    if (AdminNotificationPoller.unreadCount > 0) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .align(Alignment.TopEnd)
                                .background(Color.Red, CircleShape)
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .border(1.dp, NeonGreen, RoundedCornerShape(20.dp))
                        .background(DarkGray)
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "File Transfer",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = NeonGreen
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Headline matching web app
        Text(
            text = "Upload, edit and share\nfiles of any size",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = White,
            textAlign = TextAlign.Center,
            lineHeight = 30.sp
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "Our end-to-end encrypted, AI-powered file sharing platform allows you to upload, manipulate & share files of any size, on any device.",
            fontSize = 12.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        // EXACT MATCH Circular Drop Target matching Image 2
        Box(
            modifier = Modifier
                .size(280.dp)
                .clickable { onSendClick() },
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = this.center
                val innerCircleRadius = with(density) { 105.dp.toPx() }
                val maxExpansion = with(density) { 32.dp.toPx() }

                // 3 Staggered expanding wave ripples
                val phases = listOf(0f, 0.33f, 0.66f)
                phases.forEach { phase ->
                    val progress = (waveProgress + phase) % 1f
                    val currentRadius = innerCircleRadius + progress * maxExpansion
                    val currentAlpha = (1f - progress) * 0.7f

                    drawCircle(
                        color = NeonGreen.copy(alpha = currentAlpha),
                        radius = currentRadius,
                        center = center,
                        style = Stroke(width = 2.dp.toPx())
                    )
                }

                // Main Solid Neon Green Circle Rim
                drawCircle(
                    color = NeonGreen,
                    radius = innerCircleRadius,
                    center = center,
                    style = Stroke(width = 2.5.dp.toPx())
                )
            }

            // Central Dark Navy Circular Surface
            Box(
                modifier = Modifier
                    .size(252.dp)
                    .clip(CircleShape)
                    .background(NavyDark)
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    // Cloud Upload Icon in glowing green circle
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(NeonGreen),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_cloud_upload),
                            contentDescription = "Cloud Upload Icon",
                            tint = White,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Click or drag-and-drop",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = White,
                        textAlign = TextAlign.Center
                    )

                    Text(
                        text = "your files here",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = White,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Or select a folder",
                        fontSize = 13.sp,
                        color = MutedBlue,
                        fontWeight = FontWeight.Medium,
                        textDecoration = TextDecoration.Underline
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Up to 100GB direct P2P",
                        fontSize = 11.sp,
                        color = MutedGrey,
                        fontWeight = FontWeight.Normal
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Send & Receive Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { onSendClick() },
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NeonGreen),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Send File",
                    color = Black,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }

            Button(
                onClick = { onReceiveClick() },
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp)
                    .border(1.dp, NeonGreen, RoundedCornerShape(12.dp)),
                colors = ButtonDefaults.buttonColors(containerColor = DarkGray),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Receive File",
                    color = White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Web Stats Bar matching bishalcodes.com
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(CardGray)
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("131M", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = BrightGreen)
                Text("Files Shared", fontSize = 11.sp, color = Color.Gray)
            }
            Box(modifier = Modifier.width(1.dp).height(20.dp).background(DarkGreen))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("7.6PB", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = BrightGreen)
                Text("Uploaded", fontSize = 11.sp, color = Color.Gray)
            }
            Box(modifier = Modifier.width(1.dp).height(20.dp).background(DarkGreen))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Litespeed", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = BrightGreen)
                Text("Superfast P2P", fontSize = 11.sp, color = Color.Gray)
            }
        }
    }

    // Admin Notification History Dialog
    if (showNotificationDialog) {
        AlertDialog(
            onDismissRequest = { showNotificationDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Notifications, contentDescription = "Alerts", tint = NeonGreen)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Admin Notifications", color = White, fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 350.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    val list = AdminNotificationPoller.notificationHistory
                    if (list.isEmpty()) {
                        Text(
                            "No broadcast notifications received yet.",
                            color = Color.Gray,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(vertical = 16.dp)
                        )
                    } else {
                        list.forEach { notif ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                colors = CardDefaults.cardColors(containerColor = DarkGray)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(notif.title, color = White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(notif.timestamp))
                                        Text(timeStr, color = Color.Gray, fontSize = 11.sp)
                                    }

                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(notif.message, color = Color.LightGray, fontSize = 12.sp)

                                    if (!notif.actionUrl.isNullOrEmpty()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "Open Link ↗",
                                            color = NeonGreen,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.clickable {
                                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(notif.actionUrl))
                                                context.startActivity(intent)
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showNotificationDialog = false }) {
                    Text("Close", color = NeonGreen, fontWeight = FontWeight.Bold)
                }
            },
            containerColor = CardGray
        )
    }
}
