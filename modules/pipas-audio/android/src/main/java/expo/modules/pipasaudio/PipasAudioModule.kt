package expo.modules.pipasaudio

import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PipasAudioModule : Module() {
  private val players = mutableMapOf<String, MediaPlayer>()

  override fun definition() = ModuleDefinition {
    Name("PipasAudio")

    AsyncFunction("play") { name: String, promise: expo.modules.kotlin.Promise ->
      try {
        val ctx = appContext.reactContext ?: throw IllegalStateException("No context")
        players[name]?.let { try { it.stop(); it.release() } catch (_: Exception) {} }
        val afd = ctx.assets.openFd("sounds/$name.wav")
        val player = MediaPlayer()
        player.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
        afd.close()
        player.prepare()
        player.setOnCompletionListener { it.release(); players.remove(name) }
        players[name] = player
        player.start()
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("PLAY_ERROR", e.message ?: "Erro ao tocar som", e)
      }
    }

    AsyncFunction("playFile") { path: String, promise: expo.modules.kotlin.Promise ->
      try {
        val key = "__file__$path"
        players[key]?.let { try { it.stop(); it.release() } catch (_: Exception) {} }
        val player = MediaPlayer()
        player.setDataSource(path)
        player.prepare()
        player.setOnCompletionListener { it.release(); players.remove(key) }
        players[key] = player
        player.start()
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("PLAY_ERROR", e.message ?: "Erro ao tocar arquivo", e)
      }
    }

    AsyncFunction("playFileAtSpeed") { path: String, speed: Float, promise: expo.modules.kotlin.Promise ->
      try {
        val key = "__file__$path"
        players[key]?.let { try { it.stop(); it.release() } catch (_: Exception) {} }
        val player = MediaPlayer()
        player.setDataSource(path)
        player.prepare()
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
          val params = android.media.PlaybackParams().setSpeed(speed)
          player.playbackParams = params
        }
        player.setOnCompletionListener { it.release(); players.remove(key) }
        players[key] = player
        player.start()
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("PLAY_ERROR", e.message ?: "Erro ao tocar arquivo", e)
      }
    }

    AsyncFunction("playFileWithEcho") { path: String, promise: expo.modules.kotlin.Promise ->
      try {
        val key = "__file__$path"
        players[key]?.let { try { it.stop(); it.release() } catch (_: Exception) {} }
        val player = MediaPlayer()
        player.setDataSource(path)
        player.prepare()
        player.setOnCompletionListener { it.release(); players.remove(key) }
        players[key] = player
        player.start()
        // Delayed echo: replay at 40% volume after 280ms
        Handler(Looper.getMainLooper()).postDelayed({
          try {
            val echoKey = "__echo__$path"
            val echo = MediaPlayer()
            echo.setDataSource(path)
            echo.prepare()
            echo.setVolume(0.4f, 0.4f)
            echo.setOnCompletionListener { it.release(); players.remove(echoKey) }
            players[echoKey] = echo
            echo.start()
          } catch (_: Exception) {}
        }, 280)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("PLAY_ERROR", e.message ?: "Erro ao tocar arquivo", e)
      }
    }

    AsyncFunction("stopFile") { path: String, promise: expo.modules.kotlin.Promise ->
      val key = "__file__$path"
      players[key]?.let { try { it.stop(); it.release() } catch (_: Exception) {} }
      players.remove(key)
      promise.resolve(null)
    }

    AsyncFunction("stopAll") { promise: expo.modules.kotlin.Promise ->
      players.values.forEach { try { it.stop(); it.release() } catch (_: Exception) {} }
      players.clear()
      promise.resolve(null)
    }
  }
}
