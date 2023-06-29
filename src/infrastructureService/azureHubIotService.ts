import { Client } from "azure-iothub";
import { Message } from "azure-iot-common";
import { DevicePortInterface } from "../domainModel/domainService/DevicePort";

export class AzureHubUtilities implements DevicePortInterface {

    private connectionStringPolicy = "";

    constructor(connectionStringPolicy: string) {
        this.connectionStringPolicy = connectionStringPolicy;
    }

    sendMessageConsumer(deviceId: string, data: string, callback: () => void) {
        const serviceClient = Client.fromConnectionString(this.connectionStringPolicy);
        serviceClient.open((err) => {
            if (err) {
                console.error('Could not connect: ' + err.message);
                throw err;
            } else {
                console.log('Service client connected');
                serviceClient.getFeedbackReceiver((err, receiver) => {
                    if (!receiver) {
                        return;
                    }
                    receiver.on('message', (msg) => {
                        console.log('Feedback message:')
                        console.log(msg.getData().toString('utf-8'));
                    });
                });
                const message = new Message(data);
                message.ack = 'full';
                message.messageId = "My Message ID";
                console.log('Sending message: ' + message.getData());
                
                serviceClient.send(deviceId, message);

                callback();
            }
        });
    }
}
