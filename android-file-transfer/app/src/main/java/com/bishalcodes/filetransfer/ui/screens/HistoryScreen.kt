package com.bishalcodes.filetransfer.ui.screens

import androidx.compose.foundation.background
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
import com.bishalcodes.filetransfer.ui.theme.Black
import com.bishalcodes.filetransfer.ui.theme.DarkGray
import com.bishalcodes.filetransfer.ui.theme.NeonGreen
import com.bishalcodes.filetransfer.ui.theme.White

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
            .background(Black)
            .padding(16.dp)
    ) {
        Text(
            text = "P2P Transfer History",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = White,
            modifier = Modifier.padding(top = 16.dp, bottom = 16.dp)
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
                        tint = Color.DarkGray,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No P2P file transfers yet.",
                        color = Color.Gray,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Files sent or received over your local Wi-Fi will appear here.",
                        color = Color.DarkGray,
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
                            .clip(RoundedCornerShape(12.dp)),
                        colors = CardDefaults.cardColors(containerColor = DarkGray)
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
                                tint = NeonGreen,
                                modifier = Modifier.size(32.dp)
                            )

                            Spacer(modifier = Modifier.width(16.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = log.filename,
                                    fontWeight = FontWeight.Bold,
                                    color = White,
                                    fontSize = 16.sp
                                )
                                Text(
                                    text = "${if (log.isSent) "Sent" else "Received"} • ${log.size}",
                                    color = Color.Gray,
                                    fontSize = 13.sp
                                )
                            }

                            Text(
                                text = log.timestamp,
                                color = Color.Gray,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
