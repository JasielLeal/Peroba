"use client";

import { useEffect, useRef, useState } from "react";

// Lê o código de barras (ITF 44 dígitos) pela câmera. Usa o BarcodeDetector nativo quando existe
// (Chrome/Android) e o polyfill em WebAssembly nos demais (iPhone/Safari, Firefox).
export default function Scanner({
  aoLer,
  aoFechar,
  aoDigitar,
}: {
  aoLer: (digitos: string) => void;
  aoFechar: () => void;
  aoDigitar?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [msg, setMsg] = useState("Abrindo câmera…");

  useEffect(() => {
    let ativo = true;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout>;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setMsg("Câmera indisponível. Use HTTPS ou digite o código.");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (!ativo || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();

        const Detector =
          "BarcodeDetector" in window
            ? (window as unknown as { BarcodeDetector: typeof import("barcode-detector/ponyfill").BarcodeDetector }).BarcodeDetector
            : (await import("barcode-detector/ponyfill")).BarcodeDetector;
        const detector = new Detector({ formats: ["itf"] });
        setMsg("Aponte para o código de barras (celular deitado ajuda)");

        const ciclo = async () => {
          if (!ativo || !video.current) return;
          try {
            const achados = await detector.detect(video.current);
            const ok = achados.map((a) => a.rawValue.replace(/\D/g, "")).find((v) => v.length === 44);
            if (ok) {
              navigator.vibrate?.(60);
              aoLer(ok);
              return;
            }
          } catch {
            /* frame sem código: segue tentando */
          }
          timer = setTimeout(ciclo, 200);
        };
        ciclo();
      } catch (e) {
        const negado = (e as DOMException).name === "NotAllowedError";
        setMsg(negado ? "Permissão da câmera negada. Libere nas configurações do navegador." : "Não consegui abrir a câmera.");
      }
    })();

    return () => {
      ativo = false;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [aoLer]);

  return (
    <div className="scanner">
      <video ref={video} playsInline muted />
      <div className="mira" />
      <p>{msg}</p>
      <div className="scanner-acoes">
        {aoDigitar && <button type="button" className="primario" onClick={aoDigitar}>Digitar manualmente</button>}
        <button type="button" onClick={aoFechar}>Cancelar</button>
      </div>
    </div>
  );
}
