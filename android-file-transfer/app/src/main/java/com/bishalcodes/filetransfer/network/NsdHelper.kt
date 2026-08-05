package com.bishalcodes.filetransfer.network

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Build
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class UnifiedDevice(
    val id: String,
    val name: String,
    val platform: String, // "android_app", "ios_web", "android_web", "desktop_web"
    val hostAddress: String?,
    val port: Int,
    val nsdInfo: NsdServiceInfo? = null
)

class NsdHelper(context: Context) {

    private val nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
    private val serviceType = "_bfiletransfer._tcp."
    private val myCleanName = getCleanDeviceName()
    private val serviceName = "BishalFT-$myCleanName"

    private val _discoveredDevices = MutableStateFlow<List<UnifiedDevice>>(emptyList())
    val discoveredDevices: StateFlow<List<UnifiedDevice>> = _discoveredDevices

    private var registrationListener: NsdManager.RegistrationListener? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private var isCloudPolling = false
    private val myDeviceId = "device-" + Build.MODEL.replace(" ", "_") + "-" + (1000..9999).random()

    companion object {
        fun getCleanDeviceName(): String {
            val model = Build.MODEL
            val manufacturer = Build.MANUFACTURER
            return if (model.startsWith(manufacturer, ignoreCase = true)) {
                model.capitalize()
            } else {
                "${manufacturer.capitalize()} $model"
            }.replace("sdk_gphone16k_x86_64", "Android Emulator")
                .replace("sdk_gphone", "Android Device")
        }
    }

    fun registerService(port: Int) {
        val serviceInfo = NsdServiceInfo().apply {
            this.serviceName = this@NsdHelper.serviceName
            this.serviceType = this@NsdHelper.serviceType
            this.port = port
        }

        registrationListener = object : NsdManager.RegistrationListener {
            override fun onServiceRegistered(registeredServiceInfo: NsdServiceInfo) {
                Log.d("NsdHelper", "Service registered: ${registeredServiceInfo.serviceName}")
            }

            override fun onRegistrationFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                Log.e("NsdHelper", "Registration failed: $errorCode")
            }

            override fun onServiceUnregistered(arg0: NsdServiceInfo) {}
            override fun onUnregistrationFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {}
        }

        try {
            nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener)
        } catch (e: Exception) {
            Log.e("NsdHelper", "Error registering NSD: ${e.message}")
        }
    }

    fun discoverServices(scope: CoroutineScope) {
        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(regType: String) {}

            override fun onServiceFound(service: NsdServiceInfo) {
                if (service.serviceType == serviceType && !service.serviceName.contains(myCleanName)) {
                    nsdManager.resolveService(service, object : NsdManager.ResolveListener {
                        override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {}

                        override fun onServiceResolved(serviceInfo: NsdServiceInfo) {
                            val cleanName = serviceInfo.serviceName
                                .replace("BishalFileTransfer-", "")
                                .replace("BishalFT-", "")
                                .replace("sdk_gphone16k_x86_64", "Android Emulator")

                            val unified = UnifiedDevice(
                                id = serviceInfo.serviceName,
                                name = cleanName,
                                platform = "android_app",
                                hostAddress = serviceInfo.host?.hostAddress,
                                port = serviceInfo.port,
                                nsdInfo = serviceInfo
                            )

                            val currentList = _discoveredDevices.value.toMutableList()
                            if (currentList.none { it.id == unified.id || it.name == cleanName }) {
                                currentList.add(unified)
                                _discoveredDevices.value = currentList
                            }
                        }
                    })
                }
            }

            override fun onServiceLost(service: NsdServiceInfo) {
                val currentList = _discoveredDevices.value.toMutableList()
                currentList.removeIf { it.id == service.serviceName }
                _discoveredDevices.value = currentList
            }

            override fun onDiscoveryStopped(serviceType: String) {}
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {}
            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {}
        }

        try {
            nsdManager.discoverServices(serviceType, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
        } catch (e: Exception) {
            Log.e("NsdHelper", "Error starting NSD discovery: ${e.message}")
        }

        if (!isCloudPolling) {
            isCloudPolling = true
            scope.launch(Dispatchers.IO) {
                while (isActive) {
                    try {
                        pollCloudRadar()
                    } catch (e: Exception) {
                        Log.e("NsdHelper", "Cloud radar error: ${e.message}")
                    }
                    delay(3000)
                }
            }
        }
    }

    private fun pollCloudRadar() {
        val endpoints = listOf(
            "https://bishalcodes.com/api/v1/radar",
            "http://10.0.2.2:3000/api/v1/radar"
        )

        for (targetUrl in endpoints) {
            try {
                val conn = URL(targetUrl).openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 3000

                val payload = JSONObject()
                payload.put("id", myDeviceId)
                payload.put("name", myCleanName)
                payload.put("platform", "android_app")
                payload.put("port", 12345)
                payload.put("status", "active")

                val bytes = payload.toString().toByteArray()
                conn.outputStream.use { os -> os.write(bytes) }

                if (conn.responseCode == 200) {
                    val responseStr = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(responseStr)
                    val devicesArray = json.optJSONArray("activeDevices") ?: continue

                    val currentList = _discoveredDevices.value.toMutableList()

                    for (i in 0 until devicesArray.length()) {
                        val d = devicesArray.getJSONObject(i)
                        val devId = d.optString("id")
                        if (devId == myDeviceId) continue

                        val rawName = d.optString("name", "Web Device")
                        val devName = rawName
                            .replace("BishalFileTransfer-", "")
                            .replace("BishalFT-", "")
                            .replace("sdk_gphone16k_x86_64", "Android Emulator")

                        val devPlatform = d.optString("platform", "desktop_web")
                        val devIp = d.optString("ip", "127.0.0.1")
                        val devPort = d.optInt("port", 12345)

                        val unified = UnifiedDevice(
                            id = devId,
                            name = devName,
                            platform = devPlatform,
                            hostAddress = devIp,
                            port = devPort
                        )

                        if (currentList.none { it.id == devId || it.name == devName }) {
                            currentList.add(unified)
                        }
                    }

                    _discoveredDevices.value = currentList
                    break
                }
            } catch (e: Exception) {
                // Retry next endpoint
            }
        }
    }

    fun stopDiscovery() {
        discoveryListener?.let {
            try {
                nsdManager.stopServiceDiscovery(it)
            } catch (e: Exception) {}
        }
    }

    fun tearDown() {
        registrationListener?.let {
            try {
                nsdManager.unregisterService(it)
            } catch (e: Exception) {}
        }
    }
}
