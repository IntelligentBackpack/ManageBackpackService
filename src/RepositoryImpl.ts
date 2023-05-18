import { Repository } from './domainModel/repository/RepositoryInterface'
import { RegisteredDeviceImpl } from './domainModel/valueObjects/RegisteredDevice';
import sql, { config } from 'mssql';
import axios from 'axios';

export class RepositoryImpl implements Repository {

    private conf: config = {
        user: "",
        password: "",
        server: 'intelligent-system.database.windows.net',
        port: 1433,
        database: 'IntelligentBackpack',
        options: {
            encrypt: true
        }
    };

    private firebaseUrl = "";

    constructor(user: string, password: string, firebaseUrl: string) {
        this.conf.user = user;
        this.conf.password = password;
        this.firebaseUrl = firebaseUrl;
    }

    async getDeviceConnectionString(hash: string): Promise<RegisteredDeviceImpl> {
        var records = await this.executeQuery("select ConnectionString from RegisteredDevices \
        where hashedConnection='" + hash + "' AND email != ''")
        if(records == null)
            return null;
        else {
            var deviceId = records.recordset[0].ConnectionString;
            var hashedConnection = records.recordset[0].hashedConnection;
            var email = records.recordset[0].email;
            return new RegisteredDeviceImpl(hashedConnection, deviceId, email);
        }
    }

    async registerDevice(hash: string, email: string): Promise<string> {
        var records = await this.executeQuery("update RegisteredDevices set email='" + email + "' \
                        where hashedConnection='" + hash + "' AND email != ''")
        if(records == null)
            return null;
        else {
            var deviceId = records.recordset[0].ConnectionString;
            this.createEntryForFirebase(email, deviceId);
            return deviceId;
        }
    }

    async addDevice(hash: string, deviceId: string): Promise<RegisteredDeviceImpl> {
        var records = await this.executeQuery("insert into RegisteredDevices \
        (hashedConnection, ConnectionString, email) values \
        ('" + hash + "', '" + deviceId + "', '')")
        if(records == null)
            return null;
        else {
            return new RegisteredDeviceImpl(hash, deviceId, "");
        }
    }

    private async executeQuery(query: string) {
        var poolConnection = await sql.connect(this.conf);
        
        var resultSet:sql.IResult<any> = await poolConnection.request()
                                        .query(query);
        poolConnection.close();
        
        if(resultSet.rowsAffected[0] == 0)
            return null;
        return resultSet.rowsAffected;
    }

    private async createEntryForFirebase(email: string, deviceId: string) {
        email = email.replace(".", "-")
        await axios.put(this.firebaseUrl + '/' + email + '/' + deviceId + '.json', {
            "active": true
        })
        .then((response) => {
            console.log(response);            
        }, (error) => {
            console.log(error);
        });
    }

}