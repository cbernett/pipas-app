package expo.modules.pipasusbserial

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.hoho.android.usbserial.driver.CdcAcmSerialDriver
import com.hoho.android.usbserial.driver.ProbeTable
import com.hoho.android.usbserial.driver.UsbSerialDriver
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val ACTION_USB_PERMISSION = "expo.modules.pipasusbserial.USB_PERMISSION"
private const val RECONNECT_DELAY_MS    = 1500L
private const val MAX_RECONNECT_TRIES   = 3

class PipasUsbSerialModule : Module() {
  private var port: UsbSerialPort? = null
  private var ioManager: SerialInputOutputManager? = null
  private var permissionReceiver: BroadcastReceiver? = null
  private var lastBaud = 115200
  private var reconnectTries = 0
  private var intentionalDisconnect = false
  private val handler = Handler(Looper.getMainLooper())

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No context available")

  override fun definition() = ModuleDefinition {
    Name("PipasUsbSerial")

    Events("onData", "onDisconnect", "onError")

    Function("isSupported") {
      val manager = context.getSystemService(Context.USB_SERVICE) as UsbManager
      manager.deviceList.isNotEmpty()
    }

    AsyncFunction("connect") { baudRate: Int, promise: expo.modules.kotlin.Promise ->
      try {
        intentionalDisconnect = false
        reconnectTries = 0
        // Clean up stale state
        try { ioManager?.stop() } catch (_: Exception) {}
        try { port?.close() } catch (_: Exception) {}
        ioManager = null; port = null
        permissionReceiver?.let { try { context.unregisterReceiver(it) } catch (_: Exception) {} }
        permissionReceiver = null
        lastBaud = baudRate

        findAndOpen(baudRate, promise)
      } catch (e: Exception) {
        promise.reject("CONNECT_ERROR", e.message ?: "Erro ao conectar", e)
      }
    }

    AsyncFunction("disconnect") { promise: expo.modules.kotlin.Promise ->
      intentionalDisconnect = true
      handler.removeCallbacksAndMessages(null)
      try {
        ioManager?.stop(); ioManager = null
        port?.close();     port = null
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("DISCONNECT_ERROR", e.message ?: "Erro ao desconectar", e)
      }
    }

    AsyncFunction("write") { bytes: List<Int>, promise: expo.modules.kotlin.Promise ->
      val p = port
      if (p == null) {
        promise.reject("NOT_CONNECTED", "Placa não conectada", null)
        return@AsyncFunction
      }
      try {
        val buf = ByteArray(bytes.size) { i -> bytes[i].toByte() }
        p.write(buf, 1000)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("WRITE_ERROR", e.message ?: "Erro ao escrever", e)
      }
    }
  }

  // Finds the first available driver and opens the port (or requests permission first).
  private fun findAndOpen(baudRate: Int, promise: expo.modules.kotlin.Promise?) {
    val manager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    var drivers = UsbSerialProber.getDefaultProber().findAllDrivers(manager)
    if (drivers.isEmpty()) {
      val table = ProbeTable()
      for (dev in manager.deviceList.values) {
        table.addProduct(dev.vendorId, dev.productId, CdcAcmSerialDriver::class.java)
      }
      drivers = UsbSerialProber(table).findAllDrivers(manager)
    }
    val driver = drivers.firstOrNull()
    if (driver == null) {
      promise?.reject("NO_DEVICE", "Nenhuma placa USB encontrada. Conecte a placa e tente novamente.", null)
        ?: run { sendEvent("onDisconnect", mapOf("reason" to "device not found after reconnect")) }
      return
    }
    if (!manager.hasPermission(driver.device)) {
      if (promise != null) {
        requestPermissionThenOpen(manager, driver, baudRate, promise)
      } else {
        // During auto-reconnect Android should still have permission; if not, give up.
        sendEvent("onDisconnect", mapOf("reason" to "permission lost"))
      }
    } else {
      openPort(manager, driver, baudRate, promise)
    }
  }

  // Called when the IO thread dies. Tries to silently reopen the port up to MAX_RECONNECT_TRIES
  // times before notifying JS that the connection is truly gone.
  private fun handleRunError(reason: String) {
    if (intentionalDisconnect) return

    try { ioManager?.stop() } catch (_: Exception) {}
    ioManager = null
    // Don't close port yet — we'll try to reuse the connection.

    if (reconnectTries >= MAX_RECONNECT_TRIES) {
      port = null
      reconnectTries = 0
      sendEvent("onDisconnect", mapOf("reason" to reason))
      return
    }

    reconnectTries++
    handler.postDelayed({
      if (intentionalDisconnect) return@postDelayed
      try {
        // Try to restart IO on the existing port first (fastest path — covers MCU reboot)
        val p = port
        if (p != null) {
          try {
            // Re-assert DTR/RTS so the board resumes transmitting
            try { p.dtr = true } catch (_: Exception) {}
            try { p.rts = true } catch (_: Exception) {}
            val listener = makeListener()
            val mgr = SerialInputOutputManager(p, listener)
            mgr.start()
            ioManager = mgr
            reconnectTries = 0
            return@postDelayed
          } catch (_: Exception) {
            try { port?.close() } catch (_: Exception) {}
            port = null
          }
        }
        // Port is gone — do a full re-open
        findAndOpen(lastBaud, null)
      } catch (_: Exception) {
        handleRunError("reconnect failed")
      }
    }, RECONNECT_DELAY_MS)
  }

  private fun makeListener() = object : SerialInputOutputManager.Listener {
    override fun onNewData(data: ByteArray) {
      reconnectTries = 0 // data flowing = connection healthy
      val ints = data.map { (it.toInt() and 0xFF) }
      sendEvent("onData", mapOf("bytes" to ints))
    }
    override fun onRunError(e: Exception) {
      handleRunError(e.message ?: "io error")
    }
  }

  private fun requestPermissionThenOpen(
    manager: UsbManager,
    driver: UsbSerialDriver,
    baudRate: Int,
    promise: expo.modules.kotlin.Promise
  ) {
    val explicitIntent = Intent(ACTION_USB_PERMISSION).apply { setPackage(context.packageName) }
    val permissionIntent = PendingIntent.getBroadcast(
      context, 0, explicitIntent, PendingIntent.FLAG_IMMUTABLE
    )
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == ACTION_USB_PERMISSION) {
          context.unregisterReceiver(this)
          permissionReceiver = null
          val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
          if (granted) openPort(manager, driver, baudRate, promise)
          else promise.reject("PERMISSION_DENIED", "Permissão USB negada", null)
        }
      }
    }
    permissionReceiver = receiver
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(receiver, IntentFilter(ACTION_USB_PERMISSION), Context.RECEIVER_NOT_EXPORTED)
    } else {
      context.registerReceiver(receiver, IntentFilter(ACTION_USB_PERMISSION))
    }
    manager.requestPermission(driver.device, permissionIntent)
  }

  private fun openPort(
    manager: UsbManager,
    driver: UsbSerialDriver,
    baudRate: Int,
    promise: expo.modules.kotlin.Promise?
  ) {
    try {
      val connection = manager.openDevice(driver.device)
      if (connection == null) {
        promise?.reject("OPEN_ERROR", "Não foi possível abrir a conexão USB", null)
          ?: sendEvent("onDisconnect", mapOf("reason" to "could not open device"))
        return
      }
      val p = driver.ports[0]
      p.open(connection)
      p.setParameters(baudRate, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)
      try { p.dtr = true } catch (_: Exception) {}
      try { p.rts = true } catch (_: Exception) {}
      port = p

      val mgr = SerialInputOutputManager(p, makeListener())
      mgr.start()
      ioManager = mgr

      promise?.resolve(null)
    } catch (e: Exception) {
      promise?.reject("OPEN_ERROR", e.message ?: "Erro ao abrir porta", e)
        ?: handleRunError(e.message ?: "open failed")
    }
  }
}
