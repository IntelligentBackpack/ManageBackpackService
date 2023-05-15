import { Client } from "azure-iothub";
import { Message } from "azure-iot-common";

class RaspDeviceConsumer {


    private connectionString = 'HostName=IntelligentBackpackHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=kkEXnnmh9gfASfrgeav6MG3O8Wi85j+vngraAQvz904=';
    private targetDevice = 'raspTest';
    private serviceClient = Client.fromConnectionString(this.connectionString);
    sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    constructor() {
        
    }

    getDeviceConnectionString(hash: string): string {

      //mettere un active in ogni zaino uguale a true

      return ""
    }

    sendMessage(): void {
        this.serviceClient.open(async (err) => {
            if (err) {
              console.error('Could not connect: ' + err.message);
            } else {
                console.log('Service client connected');
                this.serviceClient.getFeedbackReceiver((errr, receiver) => {
                    if(!receiver)
                        return
                    receiver.on('message', (msg) => {
                      console.log('Feedback message:')
                      console.log(msg.getData().toString('utf-8'));
                    });
                  });
                var message = new Message('Cloud to device message.');
                message.ack = 'full';
                message.messageId = "My Message ID";
                console.log('Sending message: ' + message.getData());
                this.serviceClient.send(this.targetDevice, message);
                await this.sleep(2);
            }
          });
    }
}

const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Sending message...')
  //new RaspDeviceConsumer().sendMessage();
})

app.get('/register', (req, res) => {
  res.send('Hello world!')
  console.log(req.query.hash)
  console.log(req.query.email)
})

const port = process.env.PORT || 80;
app.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
