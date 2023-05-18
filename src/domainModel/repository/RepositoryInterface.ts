import * as deviceModule from '../valueObjects/RegisteredDevice'

export interface Repository {
    
    getDeviceConnectionString: (hash: string) => Promise<deviceModule.RegisteredDeviceImpl>;

    addDevice: (hash: string, deviceId: string) => Promise<deviceModule.RegisteredDeviceImpl>;

    registerDevice: (hash: string, email: string) => Promise<string>;

}