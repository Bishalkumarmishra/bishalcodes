package com.bishalcodes.filetransfer.network

import android.content.Context
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.net.Socket

class FileSender(private val context: Context) {

    // Sends a file to a specific IP address and Port
    suspend fun sendFile(fileUri: Uri, targetIpAddress: String, port: Int): Boolean {
        return withContext(Dispatchers.IO) {
            var socket: Socket? = null
            var inputStream: InputStream? = null
            var outputStream: OutputStream? = null

            try {
                Log.d("FileSender", "Opening socket to $targetIpAddress:$port")
                socket = Socket(targetIpAddress, port)
                
                outputStream = socket.getOutputStream()
                
                // ContentResolver gets the file from the URI safely without needing direct file paths
                inputStream = context.contentResolver.openInputStream(fileUri)

                if (inputStream == null) {
                    Log.e("FileSender", "Could not open input stream for URI: $fileUri")
                    return@withContext false
                }

                // Buffer for reading/writing
                val buffer = ByteArray(4096)
                var bytesRead: Int
                
                Log.d("FileSender", "Starting file transfer...")

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                }
                
                outputStream.flush()
                Log.d("FileSender", "File transfer complete!")
                true
                
            } catch (e: Exception) {
                Log.e("FileSender", "Error sending file: ${e.message}", e)
                false
            } finally {
                // Always close streams in finally block to prevent memory leaks
                inputStream?.close()
                outputStream?.close()
                socket?.close()
            }
        }
    }
}
