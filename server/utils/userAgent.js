export const parseUserAgent = (uaString) => {
  if (!uaString) {
    return {
      browser: "Unknown",
      operatingSystem: "Unknown",
      deviceType: "Other",
    };
  }

  let browser = "Unknown";
  let operatingSystem = "Unknown";
  let deviceType = "Other";

  // Detect OS
  if (/Windows NT 10\.0/i.test(uaString)) {
    operatingSystem = "Windows 10/11";
  } else if (/Windows NT 6\.3/i.test(uaString)) {
    operatingSystem = "Windows 8.1";
  } else if (/Windows NT 6\.2/i.test(uaString)) {
    operatingSystem = "Windows 8";
  } else if (/Windows NT 6\.1/i.test(uaString)) {
    operatingSystem = "Windows 7";
  } else if (/Windows/i.test(uaString)) {
    operatingSystem = "Windows";
  } else if (/Android/i.test(uaString)) {
    operatingSystem = "Android";
  } else if (/iPhone/i.test(uaString)) {
    operatingSystem = "iOS (iPhone)";
  } else if (/iPad/i.test(uaString)) {
    operatingSystem = "iOS (iPad)";
  } else if (/Macintosh|Mac OS X/i.test(uaString)) {
    operatingSystem = "macOS";
  } else if (/Linux/i.test(uaString)) {
    operatingSystem = "Linux";
  } else if (/CrOS/i.test(uaString)) {
    operatingSystem = "Chrome OS";
  }

  // Detect Device Type
  if (/iPad/i.test(uaString)) {
    deviceType = "Tablet";
  } else if (/Mobile|iPhone|iPod|Windows Phone|BlackBerry|IEMobile/i.test(uaString)) {
    deviceType = "Mobile";
  } else if (/Tablet|Android/i.test(uaString) && !/Mobile/i.test(uaString)) {
    deviceType = "Tablet";
  } else if (/Macintosh|Windows|Linux|CrOS/i.test(uaString)) {
    deviceType = "Desktop";
  } else {
    deviceType = "Other";
  }

  // Detect Browser
  if (/Edg/i.test(uaString)) {
    const match = uaString.match(/Edg\/(\d+)/i);
    browser = match ? `Edge ${match[1]}` : "Edge";
  } else if (/OPR|Opera/i.test(uaString)) {
    const match = uaString.match(/(?:OPR|Opera)\/(\d+)/i);
    browser = match ? `Opera ${match[1]}` : "Opera";
  } else if (/Chrome/i.test(uaString)) {
    const match = uaString.match(/Chrome\/(\d+)/i);
    browser = match ? `Chrome ${match[1]}` : "Chrome";
  } else if (/Firefox/i.test(uaString)) {
    const match = uaString.match(/Firefox\/(\d+)/i);
    browser = match ? `Firefox ${match[1]}` : "Firefox";
  } else if (/Safari/i.test(uaString) && !/Chrome|Android/i.test(uaString)) {
    const match = uaString.match(/Version\/(\d+)/i);
    browser = match ? `Safari ${match[1]}` : "Safari";
  } else if (/MSIE|Trident/i.test(uaString)) {
    browser = "Internet Explorer";
  }

  return { browser, operatingSystem, deviceType };
};
