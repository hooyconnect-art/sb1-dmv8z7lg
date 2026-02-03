# Hagaha Fudud - Bolt Users

## Hal Tallaabo Oo Keliya

### 1. Soo Qaad Key-ga
Tag halkan: https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api

Copy key-ga **service_role** (kan dheer ee ah)

### 2. Ku Dar App-kaaga
Fur faylkan: `lib/supabase-config.ts`

Ka beddel xariiqdan:
```typescript
SERVICE_ROLE_KEY: 'your_service_role_key_here',
```

Ku dar key-gaaga:
```typescript
SERVICE_ROLE_KEY: 'eyJhbGci...KEY_KAAGA_DHABTA_AH',
```

### 3. Dhammaystiran!
Admin dashboard-kaagu wuu shaqeyn doonaa si otomaatig ah.

---

## Maxaa La Hagaajiyay
- Admin users page ayaa soo bixi doonta
- Waxaad abuuri kartaa host cusub
- Dhammaan features-ka admin way shaqeyn doonaan
- Cilad "Failed to fetch users" ma jirto

---

## Ma Baahan Tahay Caawimaad?
Key-gu wuxuu u eegahaa: `eyJhbGci...` (xarafo badan oo dhaadheer)

Hubi inaad copy gareeneyso **service_role** key, MA AHA anon key!

---

## Talooyin Kale

File-ka `lib/supabase-config.ts` ayaa ku yaal project-kaaga. Waa file fudud oo TypeScript ah.

Halkan ayaad gelisaa key-ga markeliyo, dabadeed app-kaaga oo dhan ayuu si otomaatig u isticmaali doonaa.

### Tusaale:

```typescript
export const SUPABASE_CONFIG = {
  // Halkan ku dar service role key-gaaga
  SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6ZG5icnhmd2NreGNlZXl3ZXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDQxNDY1OCwiZXhwIjoyMDQ5OTkwNjU4fQ.YOUR_ACTUAL_KEY_HERE',

  // Kuwan yaa dhammaystiran (ha beddelin)
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};
```

Oo keliya ku beddel qeybta `YOUR_ACTUAL_KEY_HERE` key-gaaga dhab ah.
