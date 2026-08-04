package com.bishalcodes.filetransfer.network

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class AdminNotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val actionUrl: String?,
    val fileUrl: String?,
    val timestamp: Long
)

object AdminNotificationPoller {
    private var isPolling = false
    private var lastSeenTimestamp: Long = 0L
    val notificationHistory = mutableListOf<AdminNotificationItem>()
    var unreadCount = 0

    fun startPolling(context: Context, scope: CoroutineScope) {
        if (isPolling) return
        isPolling = true

        scope.launch(Dispatchers.IO) {
            while (isActive) {
                try {
                    fetchNotifications(context)
                } catch (e: Exception) {
                    Log.e("NotificationPoller", "Error fetching push notifications: ${e.message}")
                }
                delay(6000) // Poll every 6 seconds for instant admin pushes
            }
        }
    }

    private fun fetchNotifications(context: Context) {
        val endpoints = listOf(
            "https://bishalcodes.com/api/v1/push-notification",
            "http://10.0.2.2:3000/api/v1/push-notification"
        )

        for (endpoint in endpoints) {
            try {
                val url = URL(endpoint)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 3000
                connection.readTimeout = 3000

                if (connection.responseCode == 200) {
                    val responseStr = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(responseStr)

                    if (json.optBoolean("success", false)) {
                        val notificationsArray = json.optJSONArray("notifications") ?: continue
                        var newNotificationFound = false

                        for (i in 0 until notificationsArray.length()) {
                            val item = notificationsArray.getJSONObject(i)
                            val id = item.optString("id", "notif-$i")
                            val title = item.optString("title", "BishalCodes Admin")
                            val message = item.optString("message", "New Alert")
                            val actionUrl = item.optString("actionUrl", "https://bishalcodes.com/tools/file_transfer")
                            val fileUrl = if (item.has("fileUrl")) item.optString("fileUrl") else null
                            val timestamp = item.optLong("timestamp", System.currentTimeMillis())

                            val notifItem = AdminNotificationItem(id, title, message, actionUrl, fileUrl, timestamp)

                            if (!notificationHistory.any { it.id == id }) {
                                notificationHistory.add(0, notifItem)
                                unreadCount++

                                if (lastSeenTimestamp > 0 && timestamp > lastSeenTimestamp) {
                                    newNotificationFound = true
                                    PushNotificationService.showAdminNotification(
                                        context = context,
                                        title = title,
                                        message = message,
                                        actionUrl = actionUrl,
                                        fileUrl = fileUrl
                                    )
                                }
                            }
                        }

                        if (lastSeenTimestamp == 0L && notificationsArray.length() > 0) {
                            val latest = notificationsArray.getJSONObject(0)
                            lastSeenTimestamp = latest.optLong("timestamp", System.currentTimeMillis())
                        } else if (newNotificationFound) {
                            val latest = notificationsArray.getJSONObject(0)
                            lastSeenTimestamp = latest.optLong("timestamp", System.currentTimeMillis())
                        }

                        break // Successfully fetched from endpoint
                    }
                }
            } catch (e: Exception) {
                // Try next endpoint
            }
        }
    }
}
