const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// Adds USB_DEVICE_ATTACHED intent filter + device filter XML to AndroidManifest
module.exports = function withUsbSerial(config) {
  // Step 1: write the usb_device_filter.xml resource file
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'usb_device_filter.xml'),
        `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <usb-device />\n</resources>\n`
      );
      return cfg;
    },
  ]);

  // Step 2: add the intent-filter and meta-data to MainActivity
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = manifest.manifest.application[0];
    const activities = app.activity || [];
    const main = activities.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );
    if (!main) return cfg;

    // Avoid duplicates
    const filters = main['intent-filter'] || [];
    const already = filters.some(
      (f) => f.action?.[0]?.['$']?.['android:name'] === 'android.hardware.usb.action.USB_DEVICE_ATTACHED'
    );
    if (!already) {
      main['intent-filter'] = [
        ...filters,
        {
          action: [{ $: { 'android:name': 'android.hardware.usb.action.USB_DEVICE_ATTACHED' } }],
        },
      ];
    }

    // Avoid duplicate meta-data
    const metas = main['meta-data'] || [];
    const metaExists = metas.some(
      (m) => m.$['android:name'] === 'android.hardware.usb.action.USB_DEVICE_ATTACHED'
    );
    if (!metaExists) {
      main['meta-data'] = [
        ...metas,
        {
          $: {
            'android:name': 'android.hardware.usb.action.USB_DEVICE_ATTACHED',
            'android:resource': '@xml/usb_device_filter',
          },
        },
      ];
    }

    return cfg;
  });

  return config;
};
