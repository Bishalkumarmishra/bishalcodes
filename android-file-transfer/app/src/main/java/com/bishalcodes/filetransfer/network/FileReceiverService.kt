package com.bishalcodes.filetransfer.network

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Environment
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.io.File
import java.io.FileOutputStream
import java.net.ServerSocket
import java.net.Socket

class FileReceiverService : Service() {

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    private var serverSocket: ServerSocket? = null
    
    private val CHANNEL_ID = "FileTransferChannel"

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Bishal File Transfer")
            .setContentText("Listening for incoming files...")
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .build()
            
        startForeground(1, notification)
        startServer()
        
        return START_STICKY
    }

    private fun startServer() {
        serviceScope.launch {
            try {
                // Listen on any available port
                serverSocket = ServerSocket(0)
                Log.d("FileReceiver", "Server started on port ${serverSocket?.localPort}")
                
                while (isActive) {
                    val clientSocket = serverSocket?.accept()
                    clientSocket?.let { handleIncomingFile(it) }
                }
            } catch (e: Exception) {
                Log.e("FileReceiver", "Server error: ${e.message}")
            }
        }
    }

    private fun handleIncomingFile(socket: Socket) {
        serviceScope.launch {
            try {
                val inputStream = socket.getInputStream()
                
                // Save to public Downloads directory
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val newFile = File(downloadsDir, "ReceivedFile_${System.currentTimeMillis()}.dat")
                
                Log.d("FileReceiver", "Receiving file to ${newFile.absolutePath}")
                
                val outputStream = FileOutputStream(newFile)
                val buffer = ByteArray(4096)
                var bytesRead: Int
                
                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                }
                
                outputStream.flush()
                outputStream.close()
                inputStream.close()
                socket.close()
                
                Log.d("FileReceiver", "File successfully received!")
                
            } catch (e: Exception) {
                Log.e("FileReceiver", "Error receiving file: ${e.message}")
            }
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "File Transfer Service",
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
    }

    override fun onDestroy() {
        super.onDestroy()
        serverSocket?.close()
        serviceJob.cancel()
    }
}
