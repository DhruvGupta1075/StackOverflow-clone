import { useTranslation as useTranslationOriginal } from "react-i18next";
import { useEffect, useState } from "react";

export function useTranslation() {
  const { t, i18n, ready } = useTranslationOriginal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeT = (key: string, defaultValue?: string) => {
    if (!mounted) {
      return defaultValue !== undefined ? defaultValue : key;
    }
    return defaultValue !== undefined ? t(key, defaultValue) : t(key);
  };

  return {
    t: safeT,
    i18n,
    ready: ready && mounted,
  };
}
