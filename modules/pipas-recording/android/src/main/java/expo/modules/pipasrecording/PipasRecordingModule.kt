package expo.modules.pipasrecording

import android.media.MediaRecorder
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class PipasRecordingModule : Module() {
  private var recorder: MediaRecorder? = null
  private var currentPath: String? = null

  override fun definition() = ModuleDefinition {
    Name("PipasRecording")

    AsyncFunction("startRecording") { promise: expo.modules.kotlin.Promise ->
      try {
        val ctx = appContext.reactContext ?: throw IllegalStateException("No context")
        recorder?.let { try { it.stop(); it.release() } catch (_: Exception) {} }

        val file = File(ctx.cacheDir, "rec_${System.currentTimeMillis()}.m4a")
        currentPath = file.absolutePath

        val rec = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          MediaRecorder(ctx)
        } else {
          @Suppress("DEPRECATION")
          MediaRecorder()
        }
        rec.setAudioSource(MediaRecorder.AudioSource.MIC)
        rec.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        rec.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
        rec.setAudioSamplingRate(44100)
        rec.setAudioEncodingBitRate(128000)
        rec.setOutputFile(file.absolutePath)
        rec.prepare()
        rec.start()
        recorder = rec
        promise.resolve(file.absolutePath)
      } catch (e: Exception) {
        promise.reject("RECORD_ERROR", e.message ?: "Erro ao gravar", e)
      }
    }

    AsyncFunction("stopRecording") { promise: expo.modules.kotlin.Promise ->
      try {
        val rec = recorder ?: throw IllegalStateException("Nenhuma gravação em andamento")
        rec.stop()
        rec.release()
        recorder = null
        promise.resolve(currentPath)
      } catch (e: Exception) {
        recorder?.let { try { it.release() } catch (_: Exception) {} }
        recorder = null
        promise.reject("STOP_ERROR", e.message ?: "Erro ao parar gravação", e)
      }
    }

    AsyncFunction("cancelRecording") { promise: expo.modules.kotlin.Promise ->
      try {
        recorder?.let { try { it.stop(); it.release() } catch (_: Exception) {} }
        recorder = null
        currentPath?.let { File(it).delete() }
        currentPath = null
        promise.resolve(null)
      } catch (_: Exception) {
        promise.resolve(null)
      }
    }

    Function("getMaxAmplitude") {
      recorder?.maxAmplitude ?: 0
    }
  }
}
