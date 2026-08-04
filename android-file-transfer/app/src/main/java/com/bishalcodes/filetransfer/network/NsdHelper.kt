package com.bishalcodes.filetransfer.network

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class NsdHelper(context: Context) {

    private val nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
    private val serviceType = "_bfiletransfer._tcp."
    private val serviceName = "BishalFileTransfer"

    private val _discoveredDevices = MutableStateFlow<List<NsdServiceInfo>>(emptyList())
    val discoveredDevices: StateFlow<List<NsdServiceInfo>> = _discoveredDevices

    private var registrationListener: NsdManager.RegistrationListener? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null

    // Register this device on the network so others can find it
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

            override fun onServiceUnregistered(arg0: NsdServiceInfo) {
                Log.d("NsdHelper", "Service unregistered")
            }

            override fun onUnregistrationFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                Log.e("NsdHelper", "Unregistration failed: $errorCode")
            }
        }

        nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener)
    }

    // Discover other devices running this app
    fun discoverServices() {
        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(regType: String) {
                Log.d("NsdHelper", "Service discovery started")
            }

            override fun onServiceFound(service: NsdServiceInfo) {
                Log.d("NsdHelper", "Service discovery success: $service")
                if (service.serviceType == serviceType) {
                    nsdManager.resolveService(service, object : NsdManager.ResolveListener {
                        override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                            Log.e("NsdHelper", "Resolve failed: $errorCode")
                        }

                        override fun onServiceResolved(serviceInfo: NsdServiceInfo) {
                            Log.d("NsdHelper", "Resolve Succeeded: $serviceInfo")
                            val currentList = _discoveredDevices.value.toMutableList()
                            // Avoid duplicates
                            if (currentList.none { it.serviceName == serviceInfo.serviceName }) {
                                currentList.add(serviceInfo)
                                _discoveredDevices.value = currentList
                            }
                        }
                    })
                }
            }

            override fun onServiceLost(service: NsdServiceInfo) {
                Log.e("NsdHelper", "Service lost: $service")
                val currentList = _discoveredDevices.value.toMutableList()
                currentList.removeIf { it.serviceName == service.serviceName }
                _discoveredDevices.value = currentList
            }

            override fun onDiscoveryStopped(serviceType: String) {
                Log.i("NsdHelper", "Discovery stopped: $serviceType")
            }

            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e("NsdHelper", "Discovery failed: Error code:$errorCode")
                nsdManager.stopServiceDiscovery(this)
            }

            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e("NsdHelper", "Discovery failed: Error code:$errorCode")
                nsdManager.stopServiceDiscovery(this)
            }
        }

        nsdManager.discoverServices(serviceType, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
    }

    fun stopDiscovery() {
        discoveryListener?.let {
            nsdManager.stopServiceDiscovery(it)
        }
    }

    fun tearDown() {
        registrationListener?.let {
            nsdManager.unregisterService(it)
        }
    }
}
