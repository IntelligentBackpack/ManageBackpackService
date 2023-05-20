import { RegisteredDeviceImpl } from "../valueObjects/RegisteredDevice";
import { Repository } from '../repository/RepositoryInterface'
import { EmailPolicyImpl } from '../policies/EmailPolicy';
import {DevicePortInterface} from './DevicePort';

export class SendService {

    private sendConsumer: DevicePortInterface;
    private repository: Repository;

    constructor(consumer: DevicePortInterface, repository: Repository) {
        this.sendConsumer = consumer;
        this.repository = repository;
    }



    private async updateSystem(hash: string, email: string, success: ()=>void, error: ()=>void, register: boolean) {
        
        var device;
        if(register) {
            device = await this.repository.getDeviceConnectionStringNotRegistered(hash);
        } else {
            device = await this.repository.getDeviceConnectionString(hash);
        }
        
        if(device != null && EmailPolicyImpl.checkEmail(email)) {
            var isTimeoutOver = false;
            var myTimeout = setTimeout(() => {
                isTimeoutOver = true;
                error();
            }, 50000);
            // il dispositivo esiste e non è registrato
            var callback = async () => {
                if(isTimeoutOver) {
                    console.log("RETURN")
                    return;
                }
                clearTimeout(myTimeout);
                myTimeout = null;
                var result: boolean;
                if(register) {
                    console.log("REGISTRO")
                    result = await this.repository.registerDevice(hash, email);
                } else {
                    console.log("UNREGISTRO")
                    result = await this.repository.unRegisterDevice(hash, email);
                }
                
                if(result) {
                    success();
                }
                else {
                    error();
                }
            }
            var msg = "";
            if(register) {
                msg = this.getRegistrationMessage(email);
            } else {
                msg = this.getUnRegistrationMessage(email);
            }
            this.sendConsumer.sendMessageConsumer(device.getDeviceId(), msg, callback);
            return true;
        } else {
            return false;
        }
    }

    public async register(hash: string, email: string, success: ()=>void, error: ()=>void) {
        return await this.updateSystem(hash, email, success, error, true);;
    }

    public async unRegister(hash: string, email: string, success: ()=>void, error: ()=>void) {
        return await this.updateSystem(hash, email, success, error, false);
    }

    public async addDevice(deviceId: string) {
        this.repository.addDevice(deviceId);
    }

    public sendUpdateNotification() {
        
    }

    private getRegistrationMessage(email: string) {
        return "EMAIL:" + email;
    }

    private getUnRegistrationMessage(email: string) {
        return "UNREGISTER";
    }

    private getUpdateMessage() {
        return "UPDATE";
    }

}
