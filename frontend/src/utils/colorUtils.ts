/**
 * Generuje relativně unikátní, ale konzistentní barvu na základě číselného ID.
 * Používá HSL barevný model pro lepší distribuci barev.
 * @param id - Číselné ID (např. feed_id)
 * @returns CSS HSL barvu jako string (např. 'hsl(120, 70%, 80%)')
 */
export const generateColorFromId = (id: number): string => {
  // Jednoduchý hash z ID pro generování Hue (0-360)
  const hue = (id * 137.5) % 360; // Použití zlatého úhlu pro lepší distribuci
  
  // Nastavení saturace a světlosti - chceme pastelovější/světlejší barvy pro tagy
  const saturation = 60; // Procenta (0-100)
  const lightness = 75;  // Procenta (0-100)

  return `hsl(${hue.toFixed(0)}, ${saturation}%, ${lightness}%)`;
};

/**
 * Funkce pro získání kontrastní barvy textu (černá nebo bílá) k dané barvě pozadí.
 * @param bgColor - Barva pozadí (např. výstup z generateColorFromId)
 * @returns 'black' nebo 'white'
 */
export const getContrastTextColor = (bgColor: string): 'black' | 'white' => {
    // Zjednodušený přístup založený na HSL světlosti (lightness)
    // HSL barva je ve formátu 'hsl(H, S%, L%)'
    try {
        const lightnessMatch = bgColor.match(/hsl\(\s*\d+\s*,\s*\d+%\s*,\s*(\d+)%\s*\)/);
        if (lightnessMatch && lightnessMatch[1]) {
            const lightness = parseInt(lightnessMatch[1], 10);
            // Prahová hodnota - pokud je světlost > 65%, použijeme černý text, jinak bílý
            return lightness > 65 ? 'black' : 'white';
        }
    } catch (e) {
        console.error("Could not parse HSL color for contrast:", bgColor, e);
    }
    // Výchozí hodnota, pokud parsování selže
    return 'black'; 
};
 