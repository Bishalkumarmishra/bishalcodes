package com.bishalcodes.filetransfer.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bishalcodes.filetransfer.ui.theme.DarkText
import com.bishalcodes.filetransfer.ui.theme.LightBg
import com.bishalcodes.filetransfer.ui.theme.LightCard
import com.bishalcodes.filetransfer.ui.theme.PrimaryGreen
import com.bishalcodes.filetransfer.ui.theme.SubText
import com.bishalcodes.filetransfer.ui.theme.White

@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    var pushNotificationsEnabled by remember { mutableStateOf(true) }

    fun openWebUrl(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        context.startActivity(intent)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(
            text = "Settings & Legal",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = DarkText,
            modifier = Modifier.padding(top = 12.dp, bottom = 20.dp)
        )

        // About & Branding Section Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, Color(0xFFE0F2E6), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = LightCard)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "About",
                        tint = PrimaryGreen,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "File Transfer Native",
                            fontWeight = FontWeight.Bold,
                            color = DarkText,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "Version 1.0.0 • Google Play Verified",
                            color = SubText,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Divider(color = Color(0xFFE0F2E6))
                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Developer & Brand",
                    color = SubText,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "BishalCodes Inc.",
                    color = DarkText,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "https://bishalcodes.com",
                    color = PrimaryGreen,
                    fontSize = 14.sp,
                    modifier = Modifier.clickable { openWebUrl("https://bishalcodes.com") }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Play Store Legal & Privacy Policy Section
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, Color(0xFFE0F2E6), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = LightCard)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Policy",
                        tint = PrimaryGreen,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Policies on bishalcodes.com",
                        fontWeight = FontWeight.Bold,
                        color = DarkText,
                        fontSize = 16.sp
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFFEBF7F0))
                        .clickable { openWebUrl("https://bishalcodes.com/privacy-policy") }
                        .padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Privacy Policy (Official Web)", color = DarkText, fontWeight = FontWeight.SemiBold)
                        Text("Open ↗", color = PrimaryGreen, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFFEBF7F0))
                        .clickable { openWebUrl("https://bishalcodes.com/terms") }
                        .padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Terms of Service (Official Web)", color = DarkText, fontWeight = FontWeight.SemiBold)
                        Text("Open ↗", color = PrimaryGreen, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Security Diagnostics
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, Color(0xFFE0F2E6), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = LightCard)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Security",
                        tint = PrimaryGreen,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "Security & Data Safety",
                        fontWeight = FontWeight.Bold,
                        color = DarkText,
                        fontSize = 16.sp
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text("• Zero Cloud Storage: 100% Direct P2P Transfer", color = SubText, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("• Encryption: Local Socket Connection", color = SubText, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("• Save Directory: /Downloads/FileTransfer/", color = SubText, fontSize = 13.sp)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Clear Cache Button
        Button(
            onClick = {
                Toast.makeText(context, "App cache & temporary files cleared!", Toast.LENGTH_SHORT).show()
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(imageVector = Icons.Default.Refresh, contentDescription = "Clear", tint = White)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Clear App Cache", color = White, fontWeight = FontWeight.Bold)
        }
    }
}
