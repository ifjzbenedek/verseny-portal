import { useCallback, useState } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

export interface GeolocationState {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
  });

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({
        position: null,
        error: 'A böngésző nem támogatja a Geolocation API-t.',
        loading: false,
      });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          position: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          error: null,
          loading: false,
        }),
      (err) =>
        setState({
          position: null,
          error:
            err.code === err.PERMISSION_DENIED
              ? 'Helymeghatározás megtagadva.'
              : err.code === err.POSITION_UNAVAILABLE
                ? 'A helyzet nem elérhető.'
                : err.code === err.TIMEOUT
                  ? 'Időtúllépés a helymeghatározás során.'
                  : err.message,
          loading: false,
        }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, request };
}
