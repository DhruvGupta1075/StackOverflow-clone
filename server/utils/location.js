export const getApproximateLocation = async (ip) => {
  if (!ip) return "Unknown";

  // Check for local/private IPs
  const isLocal =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("fe80:");

  if (isLocal) {
    return "Localhost (New Delhi, India)";
  }

  try {
    // Set a timeout of 500ms to prevent blocking login flows if IP-API is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);

    const response = await fetch(`http://ip-api.com/json/${ip}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return "Unknown";
    }

    const data = await response.json();
    if (data && data.status === "success") {
      const parts = [];
      if (data.city) parts.push(data.city);
      if (data.regionName && data.regionName !== data.city) parts.push(data.regionName);
      if (data.country) parts.push(data.country);
      return parts.join(", ");
    }
    
    return "Unknown";
  } catch (error) {
    console.warn(`[Location Lookup Warning] Could not geolocate IP ${ip}:`, error.message);
    return "Unknown";
  }
};
