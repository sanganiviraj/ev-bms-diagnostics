import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import {
  Bluetooth,
  BluetoothSearching,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Radio,
  Zap,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { bleManagerService, ScannedDevice } from '../services/diagnostic/BleManagerService';
import { useDiagnostic } from '../services/diagnostic/DiagnosticContext';

export function BluetoothScannerCard() {
  const { connectionMode, connect, disconnect, connectionState } = useDiagnostic();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBleMode = connectionMode === 'ble_obd';
  const isBleAvailable = bleManagerService.isAvailable();

  useEffect(() => {
    if (bleManagerService.isConnected()) {
      setConnectedName(bleManagerService.getConnectedDeviceName());
    } else {
      setConnectedName(null);
    }
  }, [connectionState]);

  const handleStartScan = async () => {
    if (!isBleAvailable) {
      setErrorMessage(
        'Native Bluetooth LE is available on physical Android or iOS builds (run via npx expo run:android or run:ios).'
      );
      return;
    }

    setErrorMessage(null);
    setDevices([]);
    setIsScanning(true);

    try {
      await bleManagerService.startScan((found) => {
        setDevices((prev) => {
          if (prev.some((d) => d.id === found.id)) return prev;
          // Sort likely OBD adapters to the top
          const updated = [...prev, found];
          return updated.sort((a, b) => (b.isLikelyObd ? 1 : 0) - (a.isLikelyObd ? 1 : 0));
        });
      }, 8000);

      setTimeout(() => {
        setIsScanning(false);
      }, 8000);
    } catch (err: any) {
      setIsScanning(false);
      setErrorMessage(err.message || 'Bluetooth scan failed.');
    }
  };

  const handleConnectDevice = async (device: ScannedDevice) => {
    setConnectingId(device.id);
    setErrorMessage(null);

    try {
      await bleManagerService.connectToDevice(device.id);
      setConnectedName(device.name);
      setConnectingId(null);
      // Trigger context level connect
      await connect();
    } catch (err: any) {
      setConnectingId(null);
      setErrorMessage(err.message || 'Failed to connect to OBD-II dongle.');
    }
  };

  const handleDisconnect = async () => {
    await bleManagerService.disconnect();
    setConnectedName(null);
    await disconnect();
  };

  if (!isBleMode) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bluetooth size={20} color={Theme.colors.electricBlue} />
          <View>
            <Text style={styles.title}>Physical Bluetooth OBD-II Scanner</Text>
            <Text style={styles.subtitle}>react-native-ble-plx Native Hardware Engine</Text>
          </View>
        </View>

        {connectedName ? (
          <View style={styles.connectedBadge}>
            <CheckCircle2 size={12} color="#10B981" />
            <Text style={styles.connectedBadgeText}>PAIRED</Text>
          </View>
        ) : (
          <View style={styles.standbyBadge}>
            <Radio size={12} color={Theme.colors.textMuted} />
            <Text style={styles.standbyBadgeText}>BLE READY</Text>
          </View>
        )}
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <AlertCircle size={14} color={Theme.colors.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {connectedName ? (
        <View style={styles.pairedBox}>
          <View style={styles.pairedInfo}>
            <Zap size={18} color="#10B981" />
            <View>
              <Text style={styles.pairedTitle}>{connectedName}</Text>
              <Text style={styles.pairedSubtitle}>Active ISO 15765-4 CAN stream connected</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
            activeOpacity={0.7}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonActive]}
            onPress={handleStartScan}
            disabled={isScanning}
            activeOpacity={0.8}
          >
            {isScanning ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.scanButtonText}>Scanning for OBD-II Adapters (8s)...</Text>
              </>
            ) : (
              <>
                <BluetoothSearching size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.scanButtonText}>Scan for Nearby OBD-II Dongles</Text>
              </>
            )}
          </TouchableOpacity>

          {devices.length > 0 && (
            <View style={styles.deviceList}>
              <Text style={styles.deviceListTitle}>Discovered Bluetooth Devices ({devices.length}):</Text>
              {devices.map((device) => {
                const isConnecting = connectingId === device.id;
                return (
                  <View key={device.id} style={styles.deviceRow}>
                    <View style={styles.deviceInfo}>
                      <View style={styles.deviceNameRow}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        {device.isLikelyObd && (
                          <View style={styles.obdBadge}>
                            <Text style={styles.obdBadgeText}>OBD-II</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.deviceId}>ID: {device.id}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.connectButton}
                      onPress={() => handleConnectDevice(device)}
                      disabled={isConnecting}
                      activeOpacity={0.7}
                    >
                      {isConnecting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.connectButtonText}>Connect</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {!isScanning && devices.length === 0 && (
            <View style={styles.infoHint}>
              <Text style={styles.infoHintText}>
                Plug your OBD-II dongle (OBDLink MX+, vLinker MC+, Veepeak, or ELM327) into your EV's OBD port and tap "Scan" above.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  standbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    gap: 4,
  },
  standbyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.danger,
    lineHeight: 16,
  },
  pairedBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
  },
  pairedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pairedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  pairedSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  disconnectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
  },
  disconnectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.danger,
  },
  scanButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Theme.borderRadius.md,
  },
  scanButtonActive: {
    opacity: 0.8,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deviceList: {
    marginTop: Theme.spacing.md,
  },
  deviceListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceSubtle,
    borderColor: Theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: 10,
    marginBottom: 6,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  obdBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  obdBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  deviceId: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
    minWidth: 70,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoHint: {
    marginTop: Theme.spacing.md,
    padding: 10,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderRadius: Theme.borderRadius.md,
  },
  infoHintText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 17,
  },
});
