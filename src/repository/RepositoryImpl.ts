import { Repository } from '../domainModel/repository/RepositoryInterface'
import { RegisteredDeviceImpl } from '../domainModel/valueObjects/RegisteredDevice';
import sql, { config } from 'mssql';
import axios from 'axios';

import { createHash } from 'crypto';

export class RepositoryImpl implements Repository {

    private conf: config = {
        user: "",
        password: "",
        server: 'intelligent-system.database.windows.net',
        port: 1433,
        database: 'IntelligentBackpack',
        requestTimeout : 50000,
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

    async getDeviceConnectionStringNotRegistered(hash: string): Promise<RegisteredDeviceImpl> {
        const records = await this.executeQuery("select * from RegisteredDevices \
        where hashedConnection='" + hash + "' AND email = ''");
        if(records.rowsAffected[0] > 0) {
            if(records.recordset == null || records.recordset == undefined || records.recordset.length  == 0)
                return null;
            else {
                const deviceId = records.recordset[0].ConnectionString;
                const hashedConnection = records.recordset[0].hashedConnection;
                const email = records.recordset[0].email;
                return new RegisteredDeviceImpl(hashedConnection, deviceId, email);
            }
        } else {
            return null;
        }
    }

    async getDeviceConnectionString(hash: string): Promise<RegisteredDeviceImpl> {
        const records = await this.executeQuery("select * from RegisteredDevices \
        where hashedConnection='" + hash + "' AND email != ''");
        if(records.rowsAffected[0] > 0) {
            if(records.recordset == null || records.recordset == undefined || records.recordset.length  == 0)
                return null;
            else {
                const deviceId = records.recordset[0].ConnectionString;
                const hashedConnection = records.recordset[0].hashedConnection;
                const email = records.recordset[0].email;
                return new RegisteredDeviceImpl(hashedConnection, deviceId, email);
            }
        } else {
            return null;
        }
    }

    async registerDevice(hash: string, email: string): Promise<boolean> {
        const records = await this.executeQuery("update RegisteredDevices set email='" + email + "' \
                        where hashedConnection='" + hash + "'")
        if(records == null)
            return false;
        else {
            this.createEntryForFirebase(email, hash);
            
            return true;
        }
    }

    async addDevice(deviceId: string): Promise<RegisteredDeviceImpl> {
        const hash: string = createHash('sha256').update(deviceId).digest('hex');
        const records = await this.executeQuery("insert into RegisteredDevices \
            (hashedConnection, ConnectionString, email) values \
            ('" + hash + "', '" + deviceId + "', '')")
        
        if(records.rowsAffected[0] > 0) {
            return new RegisteredDeviceImpl(hash, deviceId, "");
        } else {
            return null;
        }
    }

    async unRegisterDevice(hash: string, email: string): Promise<boolean> {
        const records = await this.executeQuery("update RegisteredDevices set email='' \
                        where hashedConnection='" + hash + "'")
        if(records == null)
            return false;
        else {
            this.deleteEntryForFirebase(email, hash);
            
            return true;
        }
    }

    private async executeQuery(query: string) {
        const poolConnection = await sql.connect(this.conf);
        
        const resultSet:sql.IResult<any> = await poolConnection.request()
                                        .query(query);
        poolConnection.close();
        
        return resultSet;
    }

    private async checkEntryForFirebase(email: string, callback: (url, obj) => void) {
        email = email.replace(".", "-")
        const url = this.firebaseUrl + '/' + email + '.json';
        await axios.get(url)
        .then((response) => {
            if(response.data == null) {
                callback(url, {"active": true});
            }
        }, (error) => {
            //console.log(error);
        });
    }

    private async createEntryForFirebase(email: string, id: string) {
        email = email.replace(".", "-")
        await this.checkEntryForFirebase(email, (url, obj) => {
            axios.patch(url, obj);
        });
        await axios.patch(this.firebaseUrl + '/' + email + '/' + id + '.json', {
            "active": true
        })
        .then((response) => {
            //console.log(response);
        }, (error) => {
            //console.log(error);
        });
    }

    private async deleteEntryForFirebase(email: string, id: string) {
        email = email.replace(".", "-")
        const url = this.firebaseUrl + '/' + email + '/' + id + '.json';
        await axios.delete(url)
        .then((response) => {
            //console.log(response);
        }, (error) => {
            //console.log(error);
        });
    }

}