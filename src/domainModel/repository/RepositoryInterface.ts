import * as deviceModule from '../valueObjects/RegisteredDevice'

export interface Repository {
    
    getDeviceConnectionString: (hash: string) => Promise<deviceModule.RegisteredDeviceImpl>;

    addDevice: (hash: string, deviceId: string) => Promise<deviceModule.RegisteredDeviceImpl>;

    registerDevice: (hash: string, email: string, deviceId: string) => Promise<string>;

    //TODO tolgo la mail nel record all'interno del db, cancello la relazione su firebase e mando un messaggio DISS al device
    //disassociateBackpack: (hash: string) => void;

}