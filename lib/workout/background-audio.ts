// Background Audio Service
// Mantém o app ativo no iOS usando um áudio silencioso em loop
// Isso permite que o timer continue rodando mesmo com a tela bloqueada

class BackgroundAudioService {
  private audioContext: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null
  private isPlaying = false
  private keepAliveInterval: NodeJS.Timeout | null = null

  /**
   * Inicia o áudio silencioso em background
   * Deve ser chamado após interação do usuário (ex: ao iniciar o timer)
   */
  start(): void {
    if (this.isPlaying) return

    try {
      // Criar AudioContext se não existir
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }

      // Resumir se suspenso
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      // Criar oscillator com volume zero (inaudível)
      this.oscillator = this.audioContext.createOscillator()
      this.gainNode = this.audioContext.createGain()

      // Volume zero - completamente silencioso
      this.gainNode.gain.value = 0.00001 // Quase zero, mas suficiente para manter ativo

      this.oscillator.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)

      // Frequência baixa (inaudível)
      this.oscillator.frequency.value = 1
      this.oscillator.type = 'sine'

      this.oscillator.start()
      this.isPlaying = true

      // Manter o AudioContext ativo com um intervalo
      this.keepAliveInterval = setInterval(() => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {})
        }
      }, 1000)

      console.log('[BackgroundAudio] Iniciado')
    } catch (error) {
      console.error('[BackgroundAudio] Erro ao iniciar:', error)
    }
  }

  /**
   * Para o áudio em background
   */
  stop(): void {
    if (!this.isPlaying) return

    try {
      if (this.oscillator) {
        this.oscillator.stop()
        this.oscillator.disconnect()
        this.oscillator = null
      }

      if (this.gainNode) {
        this.gainNode.disconnect()
        this.gainNode = null
      }

      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval)
        this.keepAliveInterval = null
      }

      this.isPlaying = false
      console.log('[BackgroundAudio] Parado')
    } catch (error) {
      console.error('[BackgroundAudio] Erro ao parar:', error)
    }
  }

  /**
   * Verifica se está rodando
   */
  get running(): boolean {
    return this.isPlaying
  }

  /**
   * Reproduz um som de alerta (beep audível)
   * Útil para quando o timer termina
   */
  playAlertSound(volume = 0.7): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    try {
      // Criar sequência de beeps
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.connect(gain)
        gain.connect(this.audioContext!.destination)

        osc.frequency.value = freq
        osc.type = 'sine'

        // Envelope
        const now = this.audioContext!.currentTime + startTime
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(volume, now + 0.01)
        gain.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.7)
        gain.gain.linearRampToValueAtTime(0, now + duration)

        osc.start(now)
        osc.stop(now + duration)
      }

      // Três beeps ascendentes
      playBeep(660, 0, 0.15)
      playBeep(880, 0.18, 0.15)
      playBeep(1100, 0.36, 0.25)

      console.log('[BackgroundAudio] Som de alerta reproduzido')
    } catch (error) {
      console.error('[BackgroundAudio] Erro ao reproduzir alerta:', error)
    }
  }

  /**
   * Reproduz beep de countdown (últimos 3 segundos)
   */
  playCountdownBeep(volume = 0.5): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.connect(gain)
      gain.connect(this.audioContext.destination)

      osc.frequency.value = 880
      osc.type = 'sine'

      const now = this.audioContext.currentTime
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + 0.01)
      gain.gain.linearRampToValueAtTime(0, now + 0.15)

      osc.start(now)
      osc.stop(now + 0.15)
    } catch {
      // Ignore errors
    }
  }
}

// Singleton
export const backgroundAudioService = new BackgroundAudioService()
