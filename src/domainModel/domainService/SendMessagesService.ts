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
        
        let device;
        if(register) {
            device = await this.repository.getDeviceConnectionStringNotRegistered(hash);
        } else {
            device = await this.repository.getDeviceConnectionString(hash);
        }
        
        if(device != null && EmailPolicyImpl.checkEmail(email)) {
            let isTimeoutOver = false;
            let myTimeout = setTimeout(() => {
                isTimeoutOver = true;
                error();
            }, 180000);
            // il dispositivo esiste e non è registrato
            const callback = async () => {
                if(isTimeoutOver) {
                    console.log("RETURN")
                    return;
                }
                clearTimeout(myTimeout);
                myTimeout = null;
                let result: boolean;
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
            let msg = "";
            if(register) {
                msg = this.getRegistrationMessage(email, hash);
            } else {
                msg = this.getUnRegistrationMessage();
            }
            this.sendConsumer.sendMessageConsumer(device.getDeviceId(), msg, callback);
            return true;
        } else {
            return false;
        }
    }

    public async register(hash: string, email: string, success: ()=>void, error: ()=>void) {
        return await this.updateSystem(hash, email, success, error, true);
    }

    public async unRegister(hash: string, email: string, success: ()=>void, error: ()=>void) {
        return await this.updateSystem(hash, email, success, error, false);
    }

    public async addDevice(deviceId: string) {
        this.repository.addDevice(deviceId);
    }

    private getRegistrationMessage(email: string, hash: string) {
        return "REGISTER;" + email + ";" + hash;
    }

    private getUnRegistrationMessage() {
        return "UNREGISTER";
    }

    private getUpdateMessage() {
        return "UPDATE";
    }

}
