import { Client } from "azure-iothub";
import { Message } from "azure-iot-common";
import sql, { config } from 'mssql';
import axios from 'axios';
import fs = require('fs');

export class RaspDeviceConsumer {

    conf: config = {
        
    }

    private connectionStringPolicy = "";//'HostName=IntelligentBackpackHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=kkEXnnmh9gfASfrgeav6MG3O8Wi85j+vngraAQvz904=';
    
    sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    constructor() {
        const mydata = JSON.parse(fs.readFileSync("./build/properties.json").toString());
        this.conf = {
            user: mydata["user"],
            password: mydata["pass"],
            server: 'intelligent-system.database.windows.net',
            port: 1433,
            database: 'IntelligentBackpack',
            options: {
                encrypt: true
            }
        };
        this.connectionStringPolicy = mydata["hub"];
    }

    async addDeviceConnectionString(hash: string, connectionString: string): Promise<string> {
      try {
          const poolConnection = await sql.connect(this.conf);
          const resultSet:sql.IResult<any> = await poolConnection.request()
                                          .query("insert into RegisteredDevices (hashedConnection, ConnectionString, email) values ('" + hash + "', '" + connectionString + "', 'dani@gmoil.cim')");
          poolConnection.close();
          
          if(resultSet.rowsAffected[0] == 0)
              return null;

          console.log(resultSet);

      } catch (e: any) {
          console.error(e);
      }

      return null;
    }

    async updateDeviceConnectionString(): Promise<string> {
      try {
          const poolConnection = await sql.connect(this.conf);
          const resultSet:sql.IResult<any> = await poolConnection.request()
          .query("update RegisteredDevices set ConnectionString='raspTest' where hashedConnection='add1ae943c02aaa781535b0003e60bc1bd873cc64a79a782bde20266bfbfd74c'");
          poolConnection.close();
          
          if(resultSet.rowsAffected[0] == 0)
              return null;

          console.log(resultSet);

      } catch (e: any) {
          console.error(e);
      }

      return null;
    }

    async getDeviceConnectionString(hash: string): Promise<string> {      
        const poolConnection = await sql.connect(this.conf);
        //TODO and not registered yet
        const resultSet:sql.IResult<any> = await poolConnection.request()
                                        .query("select ConnectionString from RegisteredDevices where hashedConnection='" + hash + "'");
        poolConnection.close();
        
        if(resultSet.rowsAffected[0] == 0)
            return null;
        console.log(resultSet);

      return resultSet.recordset[0].ConnectionString;
    }

    sendMessage(deviceId: string, data: string): void {
      const serviceClient = Client.fromConnectionString(this.connectionStringPolicy);
      serviceClient.open(async (err) => {
          if (err) {
            console.error('Could not connect: ' + err.message);
            throw err;
          } else {
              console.log('Service client connected');
              serviceClient.getFeedbackReceiver((errr, receiver) => {
                  if(!receiver)
                      return
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
          }
        });
    }

    async createEntryForFirebase(email: string, deviceId: string) {
        const url = "https://intelligentbackpack-d463a-default-rtdb.europe-west1.firebasedatabase.app"
        email = email.replace(".", "-")
        await axios.put(url + '/' + email + '/' + deviceId + '.json', {
            "active": true
        })
        .then((response) => {
            console.log(response);            
        }, (error) => {
            console.log(error);
        });
    }
}