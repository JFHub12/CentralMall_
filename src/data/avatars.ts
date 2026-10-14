export interface AvatarProfile {
  id: string;
  name: string;
  svg: string;
}

export const AVATAR_PROFILES: AvatarProfile[] = [
  {
    id: 'cool-cat',
    name: 'Cool Cat',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 35L20 15L42 27Z" fill="#F59E0B"/>
      <path d="M70 35L80 15L58 27Z" fill="#F59E0B"/>
      <circle cx="50" cy="55" r="28" fill="#FBBF24"/>
      <path d="M40 50L45 55L50 50" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
      <path d="M60 50L55 55L50 50" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
      <circle cx="40" cy="45" r="4" fill="#1E293B"/>
      <circle cx="60" cy="45" r="4" fill="#1E293B"/>
      <path d="M47 62C47 62 49 65 53 62" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
      <path d="M30 60L20 58" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      <path d="M30 64L18 64" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      <path d="M70 60L80 58" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      <path d="M70 64L82 64" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'cosmic-bot',
    name: 'Cosmic Bot',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="32" y="32" width="36" height="38" rx="8" fill="#38BDF8"/>
      <line x1="50" y1="20" x2="50" y2="32" stroke="#0284C7" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="18" r="4" fill="#F43F5E"/>
      <rect x="38" y="42" width="24" height="12" rx="4" fill="#0F172A"/>
      <circle cx="45" cy="48" r="3" fill="#38BDF8"/>
      <circle cx="55" cy="48" r="3" fill="#38BDF8"/>
      <rect x="42" y="62" width="16" height="3" rx="1.5" fill="#0F172A"/>
      <path d="M26 45L32 48" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
      <path d="M74 45L68 48" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'bubblegum-panda',
    name: 'Bubblegum Panda',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="12" fill="#0F172A"/>
      <circle cx="70" cy="30" r="12" fill="#0F172A"/>
      <circle cx="50" cy="55" r="28" fill="#F8FAFC"/>
      <ellipse cx="38" cy="52" rx="7" ry="9" fill="#0F172A" transform="rotate(-15 38 52)"/>
      <ellipse cx="62" cy="52" rx="7" ry="9" fill="#0F172A" transform="rotate(15 62 52)"/>
      <circle cx="39" cy="50" r="2" fill="#FFFFFF"/>
      <circle cx="61" cy="50" r="2" fill="#FFFFFF"/>
      <circle cx="50" cy="62" r="4" fill="#0F172A"/>
      <circle cx="60" cy="65" r="10" fill="#F472B6" opacity="0.8"/>
    </svg>`
  },
  {
    id: 'sunny-smiley',
    name: 'Sunny Smiley',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="30" fill="#FACC15"/>
      <circle cx="40" cy="44" r="4" fill="#1E293B"/>
      <circle cx="60" cy="44" r="4" fill="#1E293B"/>
      <path d="M38 58C42 66 58 66 62 58" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="52" r="5" fill="#F87171" opacity="0.6"/>
      <circle cx="68" cy="52" r="5" fill="#F87171" opacity="0.6"/>
    </svg>`
  },
  {
    id: 'neon-geek',
    name: 'Neon Geek',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="52" r="26" fill="#FCD34D"/>
      <rect x="32" y="38" width="16" height="12" rx="3" fill="#1E293B"/>
      <rect x="52" y="38" width="16" height="12" rx="3" fill="#1E293B"/>
      <line x1="48" y1="44" x2="52" y2="44" stroke="#1E293B" stroke-width="3"/>
      <path d="M35 25C40 20 60 20 65 25L68 35H32L35 25Z" fill="#7C3AED"/>
      <path d="M45 68C47 72 53 72 55 68" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'cyber-punk',
    name: 'Cyber Punk',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20L65 35H35L50 20Z" fill="#38BDF8"/>
      <circle cx="50" cy="55" r="26" fill="#FED7AA"/>
      <path d="M35 45L65 45L60 55H40L35 45Z" fill="#0F172A"/>
      <circle cx="42" cy="50" r="3" fill="#38BDF8"/>
      <circle cx="58" cy="50" r="3" fill="#38BDF8"/>
      <path d="M44 67C47 70 53 70 56 67" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'mischief-fox',
    name: 'Mischief Fox',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 35L35 50L20 55L25 35Z" fill="#EA580C"/>
      <path d="M75 35L65 50L80 55L75 35Z" fill="#EA580C"/>
      <path d="M50 25L75 60H25L50 25Z" fill="#F97316"/>
      <path d="M50 40L70 65H30L50 40Z" fill="#FFF7ED"/>
      <circle cx="40" cy="50" r="3" fill="#1E293B"/>
      <circle cx="60" cy="50" r="3" fill="#1E293B"/>
      <ellipse cx="50" cy="58" rx="4" ry="3" fill="#1E293B"/>
    </svg>`
  },
  {
    id: 'boba-ghost',
    name: 'Boba Ghost',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 70V45C30 33.9543 38.9543 25 50 25C61.0457 25 70 33.9543 70 45V70L63 65L56 70L50 65L44 70L37 65L30 70Z" fill="#F8FAFC"/>
      <circle cx="42" cy="45" r="4" fill="#1E293B"/>
      <circle cx="58" cy="45" r="4" fill="#1E293B"/>
      <path d="M47 52C47 52 49 55 53 52" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="44" cy="50" r="2" fill="#F472B6"/>
      <circle cx="56" cy="50" r="2" fill="#F472B6"/>
    </svg>`
  },
  {
    id: 'alien-buddy',
    name: 'Alien Buddy',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="52" rx="28" ry="32" fill="#34D399"/>
      <ellipse cx="38" cy="48" rx="7" ry="10" fill="#064E3B" transform="rotate(-15 38 48)"/>
      <ellipse cx="62" cy="48" rx="7" ry="10" fill="#064E3B" transform="rotate(15 62 48)"/>
      <circle cx="40" cy="46" r="3" fill="#FFFFFF"/>
      <circle cx="60" cy="46" r="3" fill="#FFFFFF"/>
      <path d="M47 66C47 66 49 68 53 66" stroke="#064E3B" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'hipster-bear',
    name: 'Hipster Bear',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="10" fill="#78716C"/>
      <circle cx="68" cy="32" r="10" fill="#78716C"/>
      <circle cx="50" cy="55" r="28" fill="#A8A29E"/>
      <circle cx="40" cy="48" r="4" fill="#1C1917"/>
      <circle cx="60" cy="48" r="4" fill="#1C1917"/>
      <ellipse cx="50" cy="58" rx="8" ry="6" fill="#E7E5E4"/>
      <circle cx="50" cy="56" r="3" fill="#1C1917"/>
      <path d="M42 42L58 42" stroke="#1C1917" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  }
];

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getRandomAvatarDataUri(): string {
  const randomProf = AVATAR_PROFILES[Math.floor(Math.random() * AVATAR_PROFILES.length)];
  return svgToDataUri(randomProf.svg);
}
