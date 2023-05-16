import { Client } from "azure-iothub";
import { Message } from "azure-iot-common";
import sql, { config } from 'mssql';

export class RaspDeviceConsumer {

    conf: config = {
        user: 'intelligentSystem',
        password: 'LSS#2022',
        server: 'intelligent-system.database.windows.net',
        port: 1433,
        database: 'IntelligentBackpack',
        options: {
            encrypt: true
        }
    }

    private connectionStringPolicy = 'HostName=IntelligentBackpackHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=kkEXnnmh9gfASfrgeav6MG3O8Wi85j+vngraAQvz904=';
    
    sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    constructor() {
        
    }

    async addDeviceConnectionString(hash: string, connectionString: string): Promise<string> {
      try {
          var poolConnection = await sql.connect(this.conf);
          var resultSet:sql.IResult<any> = await poolConnection.request()
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
          var poolConnection = await sql.connect(this.conf);
          var resultSet:sql.IResult<any> = await poolConnection.request()
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
      try {
          var poolConnection = await sql.connect(this.conf);
          var resultSet:sql.IResult<any> = await poolConnection.request()
                                          .query("select ConnectionString from RegisteredDevices where hashedConnection='" + hash + "'");
          poolConnection.close();
          
          if(resultSet.rowsAffected[0] == 0)
              return null;
          console.log(resultSet);

      } catch (e: any) {
          console.error(e);
          throw e;
      }

      return resultSet.recordset[0].ConnectionString;
    }

    sendMessage(deviceId: string, data: string): void {
      var serviceClient = Client.fromConnectionString(this.connectionStringPolicy);
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
              var message = new Message(data);
              message.ack = 'full';
              message.messageId = "My Message ID";
              console.log('Sending message: ' + message.getData());
              
              serviceClient.send(deviceId, message);
          }
        });
    }

    createEntryForFirebase() {
        //mettere un active in ogni zaino uguale a true su firebase e creare l'entry
    }
}