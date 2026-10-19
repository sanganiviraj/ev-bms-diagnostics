import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Characteristic, Subscription } from 'react-native-ble-plx';
import { BleTransportHandler } from './BluetoothObdAdapter';
import { stringToBase64, base64ToString } from '../../utils/base64';

export interface ScannedDevice {
  id: string;
  name: string;
  rssi?: number;
  isLikelyObd: boolean;
}

// Common GATT UUIDs used by ELM327, OBDLink, vLinker, and BLE-CAN adapters
const KNOWN_UART_SERVICES = [
  '0000fff0-0000-1000-8000-00805f9b34fb', // Standard ELM327 BLE (FFF0)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Vgate / Veepeak / iCar (FFE0)
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic Semiconductor UART
  '000018f0-0000-1000-8000-00805f9b34fb', // OBDLink Proprietary
];

export class BleManagerService implements BleTransportHandler {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private writeCharacteristic: Characteristic | null = null;
  private notifyCharacteristic: Characteristic | null = null;
  private monitorSubscription: Subscription | null = null;

  private receiveBuffer: string = '';
  private pendingResolver: ((value: string) => void) | null = null;
  private pendingRejecter: ((reason: any) => void) | null = null;
  private commandTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // BleManager requires native modules; guard against web/Jest environments
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        this.manager = new BleManager();
      } catch (err) {
        console.warn('[BLE] Could not initialize native BleManager:', err);
      }
    }
  }

  public isAvailable(): boolean {
    return this.manager !== null;
  }

  public isConnected(): boolean {
    return this.connectedDevice !== null && this.writeCharacteristic !== null;
  }

  public getConnectedDeviceName(): string | null {
    return this.connectedDevice?.name || this.connectedDevice?.id || null;
  }

  /**
   * Request Bluetooth permissions on Android
   */
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('[BLE] Permission request error:', err);
      return false;
    }
  }

  /**
   * Scan for nearby Bluetooth devices
   */
  public async startScan(
    onDeviceFound: (device: ScannedDevice) => void,
    durationMs: number = 10000
  ): Promise<void> {
    if (!this.manager) {
      throw new Error('Native Bluetooth LE is not available in this environment.');
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions were denied.');
    }

    const seenIds = new Set<string>();

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('[BLE] Scan error:', error);
        return;
      }

      if (device && !seenIds.has(device.id)) {
        seenIds.add(device.id);
        const name = device.name || device.localName || 'Unnamed Device';
        const isLikelyObd = /obd|elm|link|vgate|vlinker|bms|can|carista|veepeak/i.test(name);

        onDeviceFound({
          id: device.id,
          name,
          rssi: device.rssi ?? undefined,
          isLikelyObd,
        });
      }
    });

    setTimeout(() => {
      this.stopScan();
    }, durationMs);
  }

  public stopScan(): void {
    if (this.manager) {
      try {
        this.manager.stopDeviceScan();
      } catch (e) {
        // scan already stopped
      }
    }
  }

  /**
   * Connect to an OBD-II dongle and locate UART characteristics
   */
  public async connectToDevice(deviceId: string): Promise<Device> {
    if (!this.manager) {
      throw new Error('Native Bluetooth LE is not available.');
    }

    this.stopScan();

    const device = await this.manager.connectToDevice(deviceId, {
      autoConnect: false,
      timeout: 10000,
    });

    const discoveredDevice = await device.discoverAllServicesAndCharacteristics();
    this.connectedDevice = discoveredDevice;

    // Locate UART service and RX/TX characteristics
    const services = await discoveredDevice.services();
    let writeChar: Characteristic | null = null;
    let notifyChar: Characteristic | null = null;

    for (const service of services) {
      const characteristics = await service.characteristics();

      for (const char of characteristics) {
        if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
          if (!writeChar) writeChar = char;
        }
        if (char.isNotifiable || char.isIndicatable) {
          if (!notifyChar) notifyChar = char;
        }
      }

      // Prioritize known OBD-II services
      const isKnown = KNOWN_UART_SERVICES.some((uuid) =>
        service.uuid.toLowerCase().includes(uuid.toLowerCase())
      );
      if (isKnown && writeChar && notifyChar) {
        break;
      }
    }

    if (!writeChar || !notifyChar) {
      throw new Error(
        `Failed to locate UART serial characteristics on ${device.name || deviceId}. Make sure this is an OBD-II BLE dongle.`
      );
    }

    this.writeCharacteristic = writeChar;
    this.notifyCharacteristic = notifyChar;

    // Listen to incoming serial stream
    this.monitorSubscription = notifyChar.monitor((error, characteristic) => {
      if (error) {
        console.warn('[BLE] Monitor notification error:', error);
        return;
      }

      if (characteristic?.value) {
        const rawChunk = base64ToString(characteristic.value);
        this.receiveBuffer += rawChunk;

        // Check for ELM327 command completion prompt '>'
        if (this.receiveBuffer.includes('>')) {
          if (this.commandTimeoutTimer) {
            clearTimeout(this.commandTimeoutTimer);
            this.commandTimeoutTimer = null;
          }

          if (this.pendingResolver) {
            const fullResponse = this.receiveBuffer;
            this.receiveBuffer = '';
            const resolver = this.pendingResolver;
            this.pendingResolver = null;
            this.pendingRejecter = null;
            resolver(fullResponse);
          }
        }
      }
    });

    return discoveredDevice;
  }

  /**
   * Send a raw string (e.g. ATZ\r or 22 D1 00\r) and wait for the ELM '>' prompt
   */
  public async sendRaw(command: string): Promise<string> {
    if (!this.isConnected() || !this.writeCharacteristic) {
      throw new Error('BLE Transport: Device not connected.');
    }

    // Ensure command ends with carriage return
    const formattedCommand = command.endsWith('\r') ? command : `${command}\r`;
    const base64Data = stringToBase64(formattedCommand);

    return new Promise<string>((resolve, reject) => {
      this.pendingResolver = resolve;
      this.pendingRejecter = reject;
      this.receiveBuffer = '';

      // Safety timeout if ECU does not respond
      this.commandTimeoutTimer = setTimeout(() => {
        if (this.pendingRejecter) {
          const timeoutReject = this.pendingRejecter;
          const buffered = this.receiveBuffer;
          this.pendingResolver = null;
          this.pendingRejecter = null;
          this.receiveBuffer = '';

          if (buffered.length > 0) {
            // If partial data arrived, return what was received
            resolve(buffered);
          } else {
            timeoutReject(new Error(`OBD-II Timeout: No response to '${command.trim()}'.`));
          }
        }
      }, 5000);

      const writeOp = this.writeCharacteristic!.isWritableWithoutResponse
        ? this.writeCharacteristic!.writeWithoutResponse(base64Data)
        : this.writeCharacteristic!.writeWithResponse(base64Data);

      writeOp.catch((err) => {
        if (this.commandTimeoutTimer) clearTimeout(this.commandTimeoutTimer);
        this.pendingResolver = null;
        this.pendingRejecter = null;
        reject(err);
      });
    });
  }

  /**
   * Disconnect from current device
   */
  public async disconnect(): Promise<void> {
    if (this.commandTimeoutTimer) {
      clearTimeout(this.commandTimeoutTimer);
      this.commandTimeoutTimer = null;
    }
    if (this.monitorSubscription) {
      this.monitorSubscription.remove();
      this.monitorSubscription = null;
    }
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (err) {
        // ignore disconnection error
      }
      this.connectedDevice = null;
    }
    this.writeCharacteristic = null;
    this.notifyCharacteristic = null;
    this.receiveBuffer = '';
    this.pendingResolver = null;
    this.pendingRejecter = null;
  }
}

// Singleton export
export const bleManagerService = new BleManagerService();
