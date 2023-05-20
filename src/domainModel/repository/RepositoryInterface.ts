import * as deviceModule from '../valueObjects/RegisteredDevice'

export interface Repository {
    
    getDeviceConnectionString: (hash: string) => Promise<deviceModule.RegisteredDeviceImpl>;

    addDevice: (deviceId: string) => Promise<deviceModule.RegisteredDeviceImpl>;

    registerDevice: (hash: string, email: string) => Promise<boolean>;

    //TODO tolgo la mail nel record all'interno del db, cancello la relazione su firebase e mando un messaggio DISS al device
    unRegisterDevice: (email: string, hash: string) => Promise<boolean>;

    getDeviceConnectionStringNotRegistered: (hash: string) => Promise<deviceModule.RegisteredDeviceImpl>;

}