export type ScanSoundVariant = "success" | "error";

/** Served from sortorium-pos-desktop-app/public/ — add your files beside these paths. */
export const SCAN_SOUND_URLS: Record<ScanSoundVariant, string> = {
  success: "/assets/sounds/pos/scan-success.mp3",
  error: "/assets/sounds/pos/scan-error.mp3",
};

export function scanAddedMessage(productName: string): string {
  return `Scan successful — ${productName} added to order`;
}

export function scanNotFoundMessage(): string {
  return "Scan complete — no product available for this barcode";
}

export function scanOutOfStockMessage(productName: string): string {
  return `Scan successful — ${productName} is out of stock at this branch`;
}

export function scanStockLimitMessage(productName: string): string {
  return `Scan successful — ${productName} cannot be added (stock limit reached)`;
}

/** Play scan sound from public assets, falling back to synthesized beeps. */
export function playScanSound(variant: ScanSoundVariant): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = SCAN_SOUND_URLS[variant];
  const audio = new Audio(url);
  audio.volume = 0.85;

  void audio.play().catch(() => {
    playScanSoundFallback(variant);
  });
}

function playScanSoundFallback(variant: ScanSoundVariant): void {
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  try {
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    if (variant === "success") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      oscillator.start(now);
      oscillator.stop(now + 0.12);
    } else {
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      oscillator.frequency.setValueAtTime(180, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.16);
    }

    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    // Ignore autoplay or audio context errors.
  }
}
