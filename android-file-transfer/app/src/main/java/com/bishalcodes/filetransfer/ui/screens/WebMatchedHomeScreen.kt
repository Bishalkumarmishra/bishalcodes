package com.bishalcodes.filetransfer.ui.screens

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
import com.bishalcodes.filetransfer.ui.theme.DarkText
import com.bishalcodes.filetransfer.ui.theme.LightBg
import com.bishalcodes.filetransfer.ui.theme.LightCard
import com.bishalcodes.filetransfer.ui.theme.PrimaryGreen
import com.bishalcodes.filetransfer.ui.theme.SubText
import com.bishalcodes.filetransfer.ui.theme.White

@Composable
fun WebMatchedHomeScreen(
    onSendClick: () -> Unit,
    onReceiveClick: () -> Unit,
    onNotificationClick: () -> Unit
) {
    val density = LocalDensity.current

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

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
    ) {
        val screenWidth = maxWidth
        val isTablet = screenWidth > 600.dp
        val circleSize = if (isTablet) 320.dp else 260.dp

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Top Header with Light Green theme & Notification Bell Icon
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
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(PrimaryGreen),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Logo",
                            tint = White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "BishalCodes",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = DarkText
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Notification Bell Icon
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(LightCard)
                            .border(1.dp, Color(0xFFE0F2E6), CircleShape)
                            .clickable {
                                AdminNotificationPoller.unreadCount = 0
                                onNotificationClick()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = PrimaryGreen,
                            modifier = Modifier.size(20.dp)
                        )
                        if (AdminNotificationPoller.unreadCount > 0) {
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .align(Alignment.TopEnd)
                                    .clip(CircleShape)
                                    .background(Color.Red),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${AdminNotificationPoller.unreadCount}",
                                    color = White,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(PrimaryGreen)
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "File Transfer",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = White
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Headline
            Text(
                text = "Upload, edit and share\nfiles of any size",
                fontSize = if (isTablet) 28.sp else 22.sp,
                fontWeight = FontWeight.Black,
                color = DarkText,
                textAlign = TextAlign.Center,
                lineHeight = 28.sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "End-to-end encrypted fast P2P file transfer across Android, iPhones & Web Browsers.",
                fontSize = 12.sp,
                color = SubText,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Circular Drop Target
            Box(
                modifier = Modifier
                    .size(circleSize)
                    .clickable { onSendClick() },
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val center = this.center
                    val innerCircleRadius = with(density) { (circleSize.toPx() / 2) - 30.dp.toPx() }
                    val maxExpansion = with(density) { 26.dp.toPx() }

                    val phases = listOf(0f, 0.33f, 0.66f)
                    phases.forEach { phase ->
                        val progress = (waveProgress + phase) % 1f
                        val currentRadius = innerCircleRadius + progress * maxExpansion
                        val currentAlpha = (1f - progress) * 0.6f

                        drawCircle(
                            color = PrimaryGreen.copy(alpha = currentAlpha),
                            radius = currentRadius,
                            center = center,
                            style = Stroke(width = 2.dp.toPx())
                        )
                    }

                    drawCircle(
                        color = PrimaryGreen,
                        radius = innerCircleRadius,
                        center = center,
                        style = Stroke(width = 2.5.dp.toPx())
                    )
                }

                Box(
                    modifier = Modifier
                        .size(circleSize - 40.dp)
                        .clip(CircleShape)
                        .background(LightCard)
                        .border(1.dp, Color(0xFFD4EEDC), CircleShape)
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(PrimaryGreen),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_cloud_upload),
                                contentDescription = "Cloud Upload Icon",
                                tint = White,
                                modifier = Modifier.size(26.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "Click or drag-and-drop",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = DarkText,
                            textAlign = TextAlign.Center
                        )

                        Text(
                            text = "your files here",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = DarkText,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Or select a folder",
                            fontSize = 12.sp,
                            color = PrimaryGreen,
                            fontWeight = FontWeight.Bold,
                            textDecoration = TextDecoration.Underline
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "Up to 100GB direct P2P",
                            fontSize = 10.sp,
                            color = SubText
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = { onSendClick() },
                    modifier = Modifier
                        .weight(1f)
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "Send File",
                        color = White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }

                Button(
                    onClick = { onReceiveClick() },
                    modifier = Modifier
                        .weight(1f)
                        .height(50.dp)
                        .border(1.dp, PrimaryGreen, RoundedCornerShape(12.dp)),
                    colors = ButtonDefaults.buttonColors(containerColor = LightCard),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "Receive File",
                        color = PrimaryGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Light Green Stats Capsule
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(LightCard)
                    .border(1.dp, Color(0xFFE0F2E6), RoundedCornerShape(16.dp))
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("131M", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = PrimaryGreen)
                    Text("Files Shared", fontSize = 11.sp, color = SubText)
                }
                Box(modifier = Modifier.width(1.dp).height(20.dp).background(Color(0xFFE0F2E6)))
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("7.6PB", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = PrimaryGreen)
                    Text("Uploaded", fontSize = 11.sp, color = SubText)
                }
                Box(modifier = Modifier.width(1.dp).height(20.dp).background(Color(0xFFE0F2E6)))
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Litespeed", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = PrimaryGreen)
                    Text("Superfast P2P", fontSize = 11.sp, color = SubText)
                }
            }
        }
    }
}
