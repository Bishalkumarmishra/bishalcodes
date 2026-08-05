package com.bishalcodes.filetransfer.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bishalcodes.filetransfer.ui.theme.DarkText
import com.bishalcodes.filetransfer.ui.theme.LightCard
import com.bishalcodes.filetransfer.ui.theme.PrimaryGreen
import com.bishalcodes.filetransfer.ui.theme.SubText

enum class NavTab(val title: String, val icon: ImageVector) {
    TRANSFER("Transfer", Icons.Default.Share),
    RADAR("Radar", Icons.Default.Home),
    HISTORY("History", Icons.Default.List),
    SETTINGS("Settings", Icons.Default.Settings)
}

@Composable
fun BottomNavBar(
    selectedTab: NavTab,
    onTabSelected: (NavTab) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(68.dp)
            .background(LightCard)
            .border(1.dp, Color(0xFFE0F2E6), RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceAround,
        verticalAlignment = Alignment.CenterVertically
    ) {
        NavTab.values().forEach { tab ->
            val isSelected = selectedTab == tab
            val activeColor = PrimaryGreen
            val inactiveColor = SubText

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onTabSelected(tab) }
                    .padding(horizontal = 14.dp, vertical = 4.dp)
            ) {
                Icon(
                    imageVector = tab.icon,
                    contentDescription = tab.title,
                    tint = if (isSelected) activeColor else inactiveColor,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = tab.title,
                    fontSize = 11.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                    color = if (isSelected) activeColor else inactiveColor
                )
            }
        }
    }
}
