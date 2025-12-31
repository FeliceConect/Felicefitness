// Audio Player Service
// Reproduz sons usando HTMLAudioElement (melhor compatibilidade com iOS)
// Inclui áudio base64 embutido para funcionar sem arquivos externos

// Som de timer completo (3 beeps ascendentes) - gerado via tone.js e convertido para base64
// Este é um WAV simples de ~0.5 segundos com 3 tons
const TIMER_COMPLETE_AUDIO_BASE64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgYGBgYKCgoKDg4ODhISEhIWFhYaGhoaHh4eHiIiIiImJiYqKiouLi4yMjI2NjY6Ojo+Pj5CQkJGRkZKSkpOTk5SUlJWVlZaWlpeXl5iYmJmZmZqampubm5ycnZ2dnp6en5+foKCgoaGhoqKio6OjpKSkpaWlpqamp6enqKioqampqqqqq6urrKysra2trq6ur6+vsLCwsbGxsrKys7OztLS0tbW1tra2t7e3uLi4ubm5urq6u7u7vLy8vb29vr6+v7+/wMDAwcHBwsLCw8PDxMTExcXFxsbGx8fHyMjIycnJysrKy8vLzMzMzc3Nzs7Oz8/P0NDQ0dHR0tLS09PT1NTU1dXV1tbW19fX2NjY2dnZ2tra29vb3Nzc3d3d3t7e39/f4ODg4eHh4uLi4+Pj5OTk5eXl5ubm5+fn6Ojo6enp6urq6+vr7Ozs7e3t7u7u7+/v8PDw8fHx8vLy8/Pz9PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+////gICAgICAgICAgICAgICAgICAgICAgICAgH9/f39+fn5+fX19fXx8fHx7e3t7enp6enl5eXl4eHh4d3d3d3Z2dnZ1dXV1dHR0dHNzc3NycnJycXFxcXBwcHBvb29vbm5ubm1tbW1sbGxsa2tra2pqamppaWlpaGhoaGdnZ2dmZmZmZWVlZWRkZGRjY2NjYmJiYmFhYWFgYGBgX19fX15eXl5dXV1dXFxcXFtbW1taWlpaWVlZWVhYWFhXV1dXVlZWVlVVVVVUVFRUU1NTU1JSUlJRUVFRUFBQUE9PT09OTk5OTU1NTUxMTExLS0tLSkpKSklJSUlISEhIR0dHR0ZGRkZFRUVFREREREREREVFRUVGRkZGR0dHR0hISEhJSUlJSkpKSktLS0tMTExMTU1NTU5OTk5PT09PUFBQUFFRUVISUFBRU1JTU1RUVFRVVVVVVlZWVldXV1dYWFhYWVlZWVpaWlpbW1tbXFxcXF1dXV1eXl5eX19fX2BgYGBhYWFhYmJiYmNjY2NkZGRkZWVlZWZmZmZnZ2dnaGhoaGlpaWlqampqa2tra2xsbGxtbW1tbm5ubm9vb29wcHBwcXFxcXJycnJzc3NzdHR0dHV1dXV2dnZ2d3d3d3h4eHh5eXl5enp6ent7e3t8fHx8fX19fX5+fn5/f39/gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBgYGBgoKCgoODg4OEhISEhYWFhYaGhoaHh4eHiIiIiImJiYmKioqKi4uLi4yMjIyNjY2Njo6Oj4+Pj5CQkJCRkZGRkpKSkpOTk5OUlJSUlZWVlZaWlpaXl5eXmJiYmJmZmZmampqam5ubm5ycnJydnZ2dnp6enp+fn5+goKCgoaGhoaKioqKjo6OjpKSkpKWlpaWmpqamp6enp6ioqKipqamqqqqqqqqqqqqpqamoqKinp6emppampaWkpKSjo6OioqKhoaGgoJ+fn56enZ2dnJycm5ubmpqamZmZmJiYl5eXlpaWlZWVlJSUk5OTkpKSkZGRkJCQj4+Pjo6OjY2NjIyMi4uLioqKiYmJiIiIh4eHhoaGhYWFhISEg4ODgoKCgYGBgICAgH9/f35+fn19fXx8fHt7e3p6enl5eXh4eHd3d3Z2dnV1dXR0dHNzc3JycnFxcXBwcG9vb25ubm1tbWxsbGtra2pqamlpaWhoaGdnZ2ZmZmVlZWRkZGNjY2JiYmFhYWBgYF9fX15eXl1dXVxcXFtbW1paWllZWVhYWFdXV1ZWVlVVVVRUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVERERDQ0NCQkJBQUFAQEA/Pz8+Pj49PT08PDw7Ozs6Ojo5OTk4ODg3Nzc2NjY1NTU0NDQzMzMyMjIxMTEwMDAvLy8uLi4tLS0sLCwrKysqKionJycoKCgpKSkqKiorKywsLS0uLi8vMDAxMTIyMzM0NDU1NjY3Nzg4OTk6Ojs7PDw9PT4+Pz9AQEFBQ0NERUVGRkdHSEhJSUpKS0tMTE1NTk5PT1BQUVFSUlNTVFRVVVZWV1dYWFlZWlpbW1xcXV1eXl9fYGBhYWJiY2NkZGVlZmZnZ2hoaWlqamtrbGxtbW5ub29wcHFxcnJzc3R0dXV2dnd3eHh5eXp6e3t8fH19fn5/f4CAgA=='

// Som de countdown beep
const COUNTDOWN_BEEP_BASE64 = 'data:audio/wav;base64,UklGRl4BAABXQVZFZm10IBAAAAABAAEAQBsAAEAbAAABAAgAZGF0YToBAACAfoB+gH6AfYF8gnyDe4R6hXmGeId3iHaJdYp0i3OMco1xjnCPb5BukW2SbJNrlGqVaZZol2eYZplmmmabaJtnm2abZptmm2WbZZtlm2WbZZtlm2abZptmm2ebZ5tom2icaZ1qnmufbKBtoW6ib6NwpHGlcqZzp3SodKl1qnapd6p4q3mseq17rnyve7B7sXyyfLN8tHu1e7Z7t3u4e7l6unq7ebx5vXi+eL94wHfBd8J2w3bEdsV1xnXHdch0yXTKdMtzC3MMcw1yDnIPchByEXISchNyFHMVcxZ0F3QYdRl1GnYbdxx4HXgeeR95IHoheiJ7I3skfCV8Jn0nfSh9KX4qfyt/LH8tgC6AL4AwgDGBMoEzgjOCNII0'

class AudioPlayerService {
  private audioElement: HTMLAudioElement | null = null
  private isIOS: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    }
  }

  /**
   * Inicializa o player de áudio (deve ser chamado após interação do usuário)
   */
  initialize(): void {
    if (typeof window === 'undefined') return

    // Criar elemento de áudio se não existir
    if (!this.audioElement) {
      this.audioElement = new Audio()
      this.audioElement.volume = 1.0

      // Pre-load para iOS
      if (this.isIOS) {
        this.audioElement.load()
      }
    }
  }

  /**
   * Reproduz o som de timer completo
   */
  async playTimerComplete(volume = 0.8): Promise<void> {
    await this.playSound(TIMER_COMPLETE_AUDIO_BASE64, volume)
  }

  /**
   * Reproduz o som de countdown
   */
  async playCountdownBeep(volume = 0.6): Promise<void> {
    await this.playSound(COUNTDOWN_BEEP_BASE64, volume)
  }

  /**
   * Reproduz um som a partir de uma URL ou base64
   */
  private async playSound(src: string, volume: number): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Método 1: Usar HTMLAudioElement existente
      if (this.audioElement) {
        this.audioElement.src = src
        this.audioElement.volume = Math.max(0, Math.min(1, volume))
        this.audioElement.currentTime = 0

        try {
          await this.audioElement.play()
          console.log('[AudioPlayer] Som reproduzido via HTMLAudioElement')
          return
        } catch (e) {
          console.warn('[AudioPlayer] Falha no HTMLAudioElement:', e)
        }
      }

      // Método 2: Criar novo Audio element
      const audio = new Audio(src)
      audio.volume = Math.max(0, Math.min(1, volume))

      try {
        await audio.play()
        console.log('[AudioPlayer] Som reproduzido via novo Audio')
        return
      } catch (e) {
        console.warn('[AudioPlayer] Falha no novo Audio:', e)
      }

      // Método 3: Fallback para Web Audio API
      await this.playViaWebAudio(volume)

    } catch (error) {
      console.error('[AudioPlayer] Erro ao reproduzir som:', error)
    }
  }

  /**
   * Fallback: Reproduz via Web Audio API
   */
  private async playViaWebAudio(volume: number): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Criar sequência de beeps
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.frequency.value = freq
        osc.type = 'sine'

        const now = ctx.currentTime + startTime
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(volume, now + 0.01)
        gain.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.7)
        gain.gain.linearRampToValueAtTime(0, now + duration)

        osc.start(now)
        osc.stop(now + duration)
      }

      // Três beeps ascendentes
      playTone(660, 0, 0.15)
      playTone(880, 0.18, 0.15)
      playTone(1100, 0.36, 0.25)

      console.log('[AudioPlayer] Som reproduzido via Web Audio API')
    } catch (e) {
      console.error('[AudioPlayer] Falha no Web Audio API:', e)
    }
  }

  /**
   * Tenta "acordar" o áudio no iOS (chamar após interação do usuário)
   */
  warmUp(): void {
    if (!this.audioElement) {
      this.initialize()
    }

    // Tocar som silencioso para "desbloquear" o áudio no iOS
    if (this.audioElement && this.isIOS) {
      const silentAudio = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
      this.audioElement.src = silentAudio
      this.audioElement.volume = 0.01
      this.audioElement.play().catch(() => {})
    }
  }
}

// Singleton
export const audioPlayerService = new AudioPlayerService()
