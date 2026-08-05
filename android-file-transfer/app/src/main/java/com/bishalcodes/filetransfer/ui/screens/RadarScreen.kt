package com.bishalcodes.filetransfer.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bishalcodes.filetransfer.network.UnifiedDevice
import com.bishalcodes.filetransfer.ui.theme.DarkText
import com.bishalcodes.filetransfer.ui.theme.LightBg
import com.bishalcodes.filetransfer.ui.theme.LightCard
import com.bishalcodes.filetransfer.ui.theme.PrimaryGreen
import com.bishalcodes.filetransfer.ui.theme.SubText
import com.bishalcodes.filetransfer.ui.theme.White

@Composable
fun RadarScreen(
    discoveredDevices: List<UnifiedDevice>,
    onConnectDevice: (UnifiedDevice) -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "radar")
    val radius by infiniteTransition.animateFloat(
        initialValue = 20f,
        targetValue = 250f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "radius"
    )
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "alpha"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Radar Discovery",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = DarkText,
            modifier = Modifier.padding(top = 12.dp, bottom = 4.dp)
        )

        Text(
            text = "Scanning for Android apps, iPhones & Web Browsers...",
            fontSize = 12.sp,
            color = SubText,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Radar Canvas Animation
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = this.center
                drawCircle(
                    color = PrimaryGreen.copy(alpha = alpha),
                    radius = radius,
                    center = center,
                    style = Stroke(width = 3.dp.toPx())
                )
                drawCircle(
                    color = Color(0xFFD0EAD8),
                    radius = 180f,
                    center = center,
                    style = Stroke(width = 1.5.dp.toPx())
                )
                drawCircle(
                    color = Color(0xFFD0EAD8),
                    radius = 100f,
                    center = center,
                    style = Stroke(width = 1.5.dp.toPx())
                )
            }

            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(PrimaryGreen, shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Radar Active",
                    tint = White
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Discovered Devices (${discoveredDevices.size})",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = DarkText,
            modifier = Modifier
                .align(Alignment.Start)
                .padding(vertical = 8.dp)
        )

        if (discoveredDevices.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Searching for nearby devices on Wi-Fi & Web...",
                    color = SubText,
                    fontSize = 13.sp
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(discoveredDevices) { device ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, Color(0xFFE0F2E6), RoundedCornerShape(12.dp)),
                        colors = CardDefaults.cardColors(containerColor = LightCard)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFEBF7F0)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    val icon = when (device.platform) {
                                        "ios_web" -> Icons.Default.Share
                                        "desktop_web" -> Icons.Default.Send
                                        else -> Icons.Default.Phone
                                    }
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = device.platform,
                                        tint = PrimaryGreen,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = device.name,
                                        fontWeight = FontWeight.Bold,
                                        color = DarkText,
                                        fontSize = 14.sp
                                    )
                                    val platformText = when (device.platform) {
                                        "ios_web" -> "iPhone (Safari Web)"
                                        "desktop_web" -> "Web Browser / Desktop"
                                        "android_web" -> "Android (Chrome Web)"
                                        else -> "Android Native App"
                                    }
                                    Text(
                                        text = platformText,
                                        color = SubText,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            Button(
                                onClick = { onConnectDevice(device) },
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Connect", color = White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
