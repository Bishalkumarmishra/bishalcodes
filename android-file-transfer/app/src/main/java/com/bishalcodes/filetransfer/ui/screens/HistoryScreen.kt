package com.bishalcodes.filetransfer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bishalcodes.filetransfer.ui.theme.DarkText
import com.bishalcodes.filetransfer.ui.theme.LightBg
import com.bishalcodes.filetransfer.ui.theme.LightCard
import com.bishalcodes.filetransfer.ui.theme.PrimaryGreen
import com.bishalcodes.filetransfer.ui.theme.SubText

data class TransferLog(
    val filename: String,
    val size: String,
    val isSent: Boolean,
    val timestamp: String
)

@Composable
fun HistoryScreen(logs: List<TransferLog> = emptyList()) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .padding(16.dp)
    ) {
        Text(
            text = "P2P Transfer History",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = DarkText,
            modifier = Modifier.padding(top = 12.dp, bottom = 16.dp)
        )

        if (logs.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.List,
                        contentDescription = "Empty History",
                        tint = SubText,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No P2P file transfers yet.",
                        color = DarkText,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Files sent or received over your local Wi-Fi will appear here.",
                        color = SubText,
                        fontSize = 12.sp
                    )
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(logs) { log ->
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
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = "Success",
                                tint = PrimaryGreen,
                                modifier = Modifier.size(32.dp)
                            )

                            Spacer(modifier = Modifier.width(16.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = log.filename,
                                    fontWeight = FontWeight.Bold,
                                    color = DarkText,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = "${if (log.isSent) "Sent" else "Received"} • ${log.size}",
                                    color = SubText,
                                    fontSize = 12.sp
                                )
                            }

                            Text(
                                text = log.timestamp,
                                color = SubText,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
