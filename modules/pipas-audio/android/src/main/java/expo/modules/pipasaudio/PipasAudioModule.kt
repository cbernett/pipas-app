package expo.modules.pipasaudio

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.nio.ByteOrder
import kotlin.math.roundToInt

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

    AsyncFunction("playFileWithRobot") { path: String, promise: expo.modules.kotlin.Promise ->
      try {
        val key = "__file__$path"
        players[key]?.let { try { it.stop(); it.release() } catch (_: Exception) {} }
        val player = MediaPlayer()
        player.setDataSource(path)
        player.prepare()
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
          val params = android.media.PlaybackParams().setSpeed(0.85f)
          player.playbackParams = params
        }
        player.setOnCompletionListener { it.release(); players.remove(key) }
        players[key] = player
        player.start()
        // Short rapid echo at 40ms gives a mechanical/robotic stutter
        Handler(Looper.getMainLooper()).postDelayed({
          try {
            val echoKey = "__robot__$path"
            val echo = MediaPlayer()
            echo.setDataSource(path)
            echo.prepare()
            echo.setVolume(0.6f, 0.6f)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
              val params = android.media.PlaybackParams().setSpeed(0.85f)
              echo.playbackParams = params
            }
            echo.setOnCompletionListener { it.release(); players.remove(echoKey) }
            players[echoKey] = echo
            echo.start()
          } catch (_: Exception) {}
        }, 40)
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

    // Renders audio with effects baked in. speed=1 for no pitch/speed change,
    // echoDelayMs=0 for no echo. Runs on background thread.
    AsyncFunction("renderWithEffects") { inputPath: String, outputPath: String, speed: Float, echoDelayMs: Int, echoGain: Float, promise: expo.modules.kotlin.Promise ->
      Thread {
        try {
          applyPcmEffects(inputPath, outputPath, speed, echoDelayMs, echoGain)
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("RENDER_ERROR", e.message ?: "Erro ao processar áudio", e)
        }
      }.start()
    }
  }

  private fun applyPcmEffects(inputPath: String, outputPath: String, speed: Float, echoDelayMs: Int, echoGain: Float) {
    // Decode to PCM
    val extractor = MediaExtractor()
    extractor.setDataSource(inputPath)
    var trackIdx = -1
    for (i in 0 until extractor.trackCount) {
      if (extractor.getTrackFormat(i).getString(MediaFormat.KEY_MIME)!!.startsWith("audio/")) {
        trackIdx = i; break
      }
    }
    if (trackIdx < 0) throw Exception("No audio track found")
    val inputFormat = extractor.getTrackFormat(trackIdx)
    val mime = inputFormat.getString(MediaFormat.KEY_MIME)!!
    val sampleRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
    val channelCount = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
    extractor.selectTrack(trackIdx)

    val decoder = MediaCodec.createDecoderByType(mime)
    decoder.configure(inputFormat, null, null, 0)
    decoder.start()
    val pcmList = mutableListOf<Short>()
    val bufInfo = MediaCodec.BufferInfo()
    var inputDone = false; var outputDone = false
    while (!outputDone) {
      if (!inputDone) {
        val idx = decoder.dequeueInputBuffer(10_000)
        if (idx >= 0) {
          val buf = decoder.getInputBuffer(idx)!!
          val size = extractor.readSampleData(buf, 0)
          if (size < 0) {
            decoder.queueInputBuffer(idx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM); inputDone = true
          } else {
            decoder.queueInputBuffer(idx, 0, size, extractor.sampleTime, 0); extractor.advance()
          }
        }
      }
      val idx = decoder.dequeueOutputBuffer(bufInfo, 10_000)
      if (idx >= 0) {
        val buf = decoder.getOutputBuffer(idx)!!
        buf.order(ByteOrder.LITTLE_ENDIAN)
        val sb = buf.asShortBuffer(); val arr = ShortArray(sb.remaining()); sb.get(arr)
        pcmList.addAll(arr.toList())
        decoder.releaseOutputBuffer(idx, false)
        if (bufInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) outputDone = true
      }
    }
    decoder.stop(); decoder.release(); extractor.release()

    // Apply effects to PCM
    var samples = pcmList.toShortArray()
    if (speed != 1f) {
      val newSize = (samples.size / speed).roundToInt()
      val out = ShortArray(newSize)
      for (i in 0 until newSize) {
        val src = i * speed; val lo = src.toInt(); val hi = (lo + 1).coerceAtMost(samples.size - 1)
        out[i] = (samples[lo] * (1f - (src - lo)) + samples[hi] * (src - lo)).roundToInt().coerceIn(-32768, 32767).toShort()
      }
      samples = out
    }
    if (echoDelayMs > 0 && echoGain > 0f) {
      val delay = (sampleRate * channelCount * echoDelayMs / 1000f).roundToInt()
      val out = samples.copyOf()
      for (i in delay until samples.size) {
        out[i] = (out[i].toInt() + (samples[i - delay] * echoGain).roundToInt()).coerceIn(-32768, 32767).toShort()
      }
      samples = out
    }

    // Re-encode to AAC in M4A
    val encFormat = MediaFormat.createAudioFormat(MediaFormat.MIMETYPE_AUDIO_AAC, sampleRate, channelCount)
    encFormat.setInteger(MediaFormat.KEY_BIT_RATE, 128_000)
    encFormat.setInteger(MediaFormat.KEY_AAC_PROFILE, android.media.MediaCodecInfo.CodecProfileLevel.AACObjectLC)
    val encoder = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC)
    encoder.configure(encFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    encoder.start()
    File(outputPath).delete()
    val muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    var muxTrack = -1; var muxStarted = false
    val encInfo = MediaCodec.BufferInfo()
    var pos = 0; var encInputDone = false; var encOutputDone = false
    val FRAME = 1024 * channelCount
    while (!encOutputDone) {
      if (!encInputDone) {
        val idx = encoder.dequeueInputBuffer(10_000)
        if (idx >= 0) {
          val buf = encoder.getInputBuffer(idx)!!; buf.clear()
          val rem = samples.size - pos
          if (rem <= 0) {
            encoder.queueInputBuffer(idx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM); encInputDone = true
          } else {
            val n = minOf(FRAME, rem)
            buf.asShortBuffer().put(samples, pos, n)
            val pts = pos.toLong() * 1_000_000L / (sampleRate * channelCount)
            encoder.queueInputBuffer(idx, 0, n * 2, pts, 0); pos += n
          }
        }
      }
      val idx = encoder.dequeueOutputBuffer(encInfo, 10_000)
      if (idx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
        if (!muxStarted) { muxTrack = muxer.addTrack(encoder.outputFormat); muxer.start(); muxStarted = true }
      } else if (idx >= 0) {
        if (muxStarted && encInfo.size > 0 && encInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0) {
          muxer.writeSampleData(muxTrack, encoder.getOutputBuffer(idx)!!, encInfo)
        }
        encoder.releaseOutputBuffer(idx, false)
        if (encInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) encOutputDone = true
      }
    }
    encoder.stop(); encoder.release()
    if (muxStarted) { muxer.stop(); muxer.release() }
  }
}
