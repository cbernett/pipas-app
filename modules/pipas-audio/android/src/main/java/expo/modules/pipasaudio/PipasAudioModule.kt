package expo.modules.pipasaudio

import android.media.MediaPlayer
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

    AsyncFunction("stopAll") { promise: expo.modules.kotlin.Promise ->
      players.values.forEach { try { it.stop(); it.release() } catch (_: Exception) {} }
      players.clear()
      promise.resolve(null)
    }
  }
}
