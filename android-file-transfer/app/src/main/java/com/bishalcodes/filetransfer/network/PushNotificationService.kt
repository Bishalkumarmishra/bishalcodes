package com.bishalcodes.filetransfer.network

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.core.app.NotificationCompat

class AdminNotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "BishalCodes Admin Alert"
        val message = intent.getStringExtra("message") ?: "New P2P update from bishalcodes.com"
        val actionUrl = intent.getStringExtra("url") ?: "https://bishalcodes.com/tools/file_transfer"
        val fileUrl = intent.getStringExtra("fileUrl")

        PushNotificationService.showAdminNotification(
            context = context,
            title = title,
            message = message,
            actionUrl = actionUrl,
            fileUrl = fileUrl
        )
    }
}

class PushNotificationService {

    companion object {
        const val API_KEY = "BISHALCODES_API_KEY_LIVE_99812"
        const val BACKEND_URL = "https://bishalcodes.com/api/v1/push-notification"
        private const val CHANNEL_ID = "BishalCodesAdminNotifications"

        fun showAdminNotification(
            context: Context,
            title: String,
            message: String,
            actionUrl: String? = null,
            fileUrl: String? = null
        ) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val channel = NotificationChannel(
                CHANNEL_ID,
                "BishalCodes Admin Alerts",
                NotificationManager.IMPORTANCE_HIGH
            )
            channel.description = "Admin Push Notifications from bishalcodes.com"
            channel.enableVibration(true)
            manager.createNotificationChannel(channel)

            val targetUrl = fileUrl ?: actionUrl ?: "https://bishalcodes.com/tools/file_transfer"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl))
            val pendingIntent = PendingIntent.getActivity(
                context,
                System.currentTimeMillis().toInt(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(message)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            manager.notify(System.currentTimeMillis().toInt(), notification)
            Log.d("PushNotification", "Notification broadcast delivered: $title -> $targetUrl")
        }
    }
}
