// Service worker mínimo: habilita a instalação do PWA. Sem cache offline (dados financeiros sempre frescos).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
