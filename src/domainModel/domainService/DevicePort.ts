
export interface DevicePortInterface {

    sendMessageConsumer: (deviceId: string, data: string, callback: () => void) => void;

}