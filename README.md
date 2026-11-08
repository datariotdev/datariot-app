# Datariot App

Mobile and desktop application (Expo / React Native / Expo Web).

## Migration status
The live application source currently remains in [datariot-site](https://github.com/datariotdev/datariot-site). This repository is reserved for a controlled migration. **Do not change Vercel or Android build settings yet.**

## Planned structure
- `src/app/` — routes
- `src/components/` — reusable UI
- `src/lib/` — application integrations
- `assets/` — application assets

## Next steps
Copy the full app with its Git history, run Android and web builds, validate Supabase auth and video playback, then switch deployment sources with a rollback plan.
