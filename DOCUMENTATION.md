# Dokumentacja Techniczna - Delay Calculator (v1.0.0)

## 1. Przegląd Rozwiązania
Aplikacja desktopowa typu **Standalone** służąca do przeliczania tempa (BPM) na czasy opóźnień (ms) oraz próbki (samples). Dedykowana dla inżynierów dźwięku i producentów muzycznych.
Wyróżnia się **ekstremalną optymalizacją wydajności** oraz interfejsem w stylu **Windows 95/98 Classic**.

## 2. Architektura Systemu
*   **Framework:** Electron (Node.js + Chromium).
*   **Model:** Single Page Application (SPA) – cała logika UI zawarta w jednym pliku HTML.
*   **Komunikacja:**
    *   IPC (Main <-> Renderer) wykorzystywane *wyłącznie* do obsługi okien dialogowych zapisu plików (Export) oraz sterowania oknem (minimalizacja, zamknięcie).
    *   Brak narzutu komunikacyjnego przy obliczeniach w czasie rzeczywistym.

## 3. Kluczowe Algorytmy i Logika (`index.html`)

### 3.1. Przeliczanie Wartości
Aplikacja działa w dwóch trybach, korzystając z bazy czasu ćwierćnuty:
`QuarterNote_ms = 60000 / BPM`

1.  **Tryb Standard Delay:**
    *   Lista mnożników: 1/1, 1/2, 1/4, 1/8, 1/16, 1/32, triole (t) i nuty z kropką (.).
    *   Wzór: `Value_ms = QuarterNote_ms * Multiplier`
2.  **Tryb Reverb Pre-Delay:**
    *   Zestaw bardzo krótkich wartości (1/16 do 1/64) używanych do ustawiania pre-delay w pogłosach.
    *   Zmiana trybu zmienia również tytuł okna i kolor paska tytułu (Niebieski -> Morski).

### 3.2. Konwersja na Próbki (Samples)
Możliwość przełączenia jednostek z milisekund na próbki audio:
`Samples = (Value_ms / 1000) * SampleRate`
Obsługiwane częstotliwości próbkowania: 44.1kHz, 48kHz, 88.2kHz, 96kHz.

### 3.3. Tap Tempo
Algorytm wykrywania tempa z uderzeń klawisza (Spacja lub przycisk Tap):
*   Bufor ostatnich 5 uderzeń.
*   Reset bufora po 2 sekundach bezczynności.
*   Wynik to średnia arytmetyczna interwałów między uderzeniami.

## 4. Optymalizacja Wydajności ("Redukcja Obciążenia")

Aplikacja została poddana rygorystycznej optymalizacji, aby zużycie CPU w stanie spoczynku wynosiło **0%**, a podczas intensywnej pracy było minimalne.

### 4.1. DOM Caching & Zero Layout Thrashing
*   **Problem:** Częste zapytania `document.getElementById` i przebudowa tabeli HTML przy każdej zmianie BPM (np. przy scrollowaniu) obciążają silnik renderujący.
*   **Rozwiązanie:**
    *   Tabela (`initTable`) budowana jest **tylko raz** (lub przy zmianie trybu).
    *   Referencje do komórek z wartościami są przechowywane w tablicy cache (`tableRowCache`).
    *   Podczas aktualizacji (`updateTableValues`) zmieniana jest **wyłącznie właściwość `.textContent`** węzłów tekstowych.
    *   Struktura DOM, klasy i style pozostają nienaruszone, co eliminuje kosztowne przeliczanie układu strony (Layout/Reflow).

### 4.2. Input Throttling & Debouncing
*   **Problem:** Touchpady generują setki zdarzeń `wheel` na sekundę, co mogłoby "dławić" główny wątek.
*   **Rozwiązanie:**
    *   Wykorzystanie `requestAnimationFrame` do synchronizacji z odświeżaniem ekranu.
    *   Zdarzenia wejściowe (scroll, klawisze) jedynie akumulują wartość zmiany (`scrollAccumulator`).
    *   Faktyczne przeliczenie i aktualizacja UI następuje maksymalnie raz na klatkę obrazu.
    *   **Deadzone:** Zmiany skumulowane mniejsze niż `0.1 BPM` są ignorowane w pętli renderowania, oszczędzając cykle procesora.

### 4.3. Logic Optimization
*   **Funkcja `setBPM`:** Posiada wbudowany bezpiecznik – jeśli nowa wartość różni się od starej o mniej niż `0.001`, cała kaskada aktualizacji UI jest przerywana.
*   **Brak procesów w tle:** Żadne timery ani interwały nie działają w tle (poza wygaszaniem komunikatów statusu). Kopiowanie do schowka następuje *tylko* w momencie kliknięcia (on-demand).

## 5. Interfejs Użytkownika (UI)
*   **Styl:** Wiernie odwzorowany Windows 98 (czcionka MS Sans Serif/Tahoma, szarość `#C0C0C0`, obramowania 3D).
*   **Custom Title Bar:** Własna implementacja paska tytułu (bez systemowej ramki Windows) pozwalająca na zmianę koloru (Granatowy dla Delay, Morski dla Reverb).
*   **Menu:** Własna implementacja paska menu (File, Options, Help) działająca wewnątrz DOM.
*   **Responsive:** Layout oparty na Flexbox, ale ze sztywnymi wymiarami kluczowych elementów, aby zachować charakter "pixel-perfect".

## 6. Struktura Projektu i Build
```text
/
├── main.js                 # Proces główny (okno, IPC)
├── index.html              # Proces renderujący (logika, UI, style)
├── package.json            # Konfiguracja i skrypty
├── DOCUMENTATION.md        # Niniejszy plik
└── FINAL_BUILD_V9_OPTIMIZED/ # Zoptymalizowana wersja wynikowa
```

### Proces Budowania (Build)
Używamy `electron-packager` z agresywnym filtrowaniem plików (`--ignore`), aby w finalnej paczce `.exe` znalazły się tylko niezbędne pliki (`main.js`, `index.html`, `package.json`, `node_modules`).
Wszelkie pliki źródłowe, dokumentacja, stare wersje i pliki konfiguracyjne IDE są usuwane z dystrybucji.

**Komenda budująca:**
```bash
npm run package
```
(Zdefiniowana w `package.json`, automatycznie ignoruje zbędne katalogi).
