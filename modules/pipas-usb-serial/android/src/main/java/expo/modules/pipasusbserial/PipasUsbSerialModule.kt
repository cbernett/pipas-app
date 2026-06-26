package expo.modules.pipasusbserial

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import com.hoho.android.usbserial.driver.CdcAcmSerialDriver
import com.hoho.android.usbserial.driver.ProbeTable
import com.hoho.android.usbserial.driver.UsbSerialDriver
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val ACTION_USB_PERMISSION = "expo.modules.pipasusbserial.USB_PERMISSION"

/**
 * Mirrors the subset of the Web Serial API used by src/serial.ts
 * (connect / disconnect / write / onData / onDisconnect), so the JS
 * side can branch on Platform.OS without changing the protocol logic.
 */
class PipasUsbSerialModule : Module() {
  private var port: UsbSerialPort? = null
  private var ioManager: SerialInputOutputManager? = null
  private var permissionReceiver: BroadcastReceiver? = null

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No context available")

  override fun definition() = ModuleDefinition {
    Name("PipasUsbSerial")

    Events("onData", "onDisconnect", "onError")

    // True if any USB device is attached (not just ones with known VID/PIDs).
    Function("isSupported") {
      val manager = context.getSystemService(Context.USB_SERVICE) as UsbManager
      manager.deviceList.isNotEmpty()
    }

    AsyncFunction("connect") { baudRate: Int, promise: expo.modules.kotlin.Promise ->
      try {
        val manager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        // Try default prober first (FTDI, CH340, CP210x, PL2303, CDC)
        var drivers: List<UsbSerialDriver> = UsbSerialProber.getDefaultProber().findAllDrivers(manager)
        // Fallback: wrap every attached device as CdcAcm (covers Arduino, Adafruit, etc.)
        if (drivers.isEmpty()) {
          val customTable = ProbeTable()
          for (dev in manager.deviceList.values) {
            customTable.addProduct(dev.vendorId, dev.productId, CdcAcmSerialDriver::class.java)
          }
          drivers = UsbSerialProber(customTable).findAllDrivers(manager)
        }
        val driver = drivers.firstOrNull()
        if (driver == null) {
          promise.reject("NO_DEVICE", "Nenhuma placa USB encontrada", null)
          return@AsyncFunction
        }
        val device: UsbDevice = driver.device

        if (!manager.hasPermission(device)) {
          requestPermissionThenOpen(manager, driver, baudRate, promise)
        } else {
          openPort(manager, driver, baudRate, promise)
        }
      } catch (e: Exception) {
        promise.reject("CONNECT_ERROR", e.message ?: "Erro ao conectar", e)
      }
    }

    AsyncFunction("disconnect") { promise: expo.modules.kotlin.Promise ->
      try {
        ioManager?.stop()
        ioManager = null
        port?.close()
        port = null
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

  private fun requestPermissionThenOpen(
    manager: UsbManager,
    driver: UsbSerialDriver,
    baudRate: Int,
    promise: expo.modules.kotlin.Promise
  ) {
    val explicitIntent = Intent(ACTION_USB_PERMISSION).apply { setPackage(context.packageName) }
    val permissionIntent = PendingIntent.getBroadcast(
      context, 0, explicitIntent,
      PendingIntent.FLAG_IMMUTABLE
    )
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == ACTION_USB_PERMISSION) {
          context.unregisterReceiver(this)
          permissionReceiver = null
          val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
          if (granted) {
            openPort(manager, driver, baudRate, promise)
          } else {
            promise.reject("PERMISSION_DENIED", "Permissão USB negada", null)
          }
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
    promise: expo.modules.kotlin.Promise
  ) {
    try {
      val connection = manager.openDevice(driver.device)
      if (connection == null) {
        promise.reject("OPEN_ERROR", "Não foi possível abrir a conexão USB", null)
        return
      }
      val p = driver.ports[0]
      p.open(connection)
      p.setParameters(baudRate, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)
      // DTR/RTS signals some boards to start transmitting
      try { p.dtr = true } catch (_: Exception) {}
      try { p.rts = true } catch (_: Exception) {}
      port = p

      val listener = object : SerialInputOutputManager.Listener {
        override fun onNewData(data: ByteArray) {
          val ints = data.map { (it.toInt() and 0xFF) }
          sendEvent("onData", mapOf("bytes" to ints))
        }
        override fun onRunError(e: Exception) {
          sendEvent("onDisconnect", mapOf("reason" to (e.message ?: "io error")))
        }
      }
      ioManager = SerialInputOutputManager(p, listener)
      ioManager!!.start()

      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("OPEN_ERROR", e.message ?: "Erro ao abrir porta", e)
    }
  }
}
