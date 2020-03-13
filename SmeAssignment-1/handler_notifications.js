'use strict';

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

module.exports.sendNotification = event => {

    event.Records.forEach((record) => {
        console.log('Stream record: ', JSON.stringify(record, null, 2));

        const newImage = record.dynamodb.NewImage;
        const departureAirport = newImage.departure_airport.S;
        const flightNumber = newImage.flight_num.S;
        const carrier = newImage.carrierFsCode.S;
        const departureDate = newImage.departure_date.S;
        const ruleEvent = newImage.ruleEvent.S;
        
        const params = buildScanParams(departureAirport, flightNumber, carrier, departureDate);

        scanDb(params, flightNumber, ruleEvent);
    });
};

function buildScanParams(departureAirport, flightNumber, carrier, departureDate) {
    return {
        TableName: process.env.FLIGHT_DETAILS_TABLE_NAME,
        ProjectionExpression: "cell",
        FilterExpression: "departure_airport = :airport" +
            " and flight_num = :flight_num" +
            " and carrier = :carrier" +
            " and departure_date = :departure_date",
        ExpressionAttributeValues: {
            ":airport": departureAirport,
            ":flight_num": flightNumber,
            ":carrier": carrier,
            ":departure_date": departureDate
        }
    };
}

function scanDb(params, flightNumber, ruleEvent) {
    dynamoDb.scan(params, (err, data) => {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        }
        else {
            console.log("Scan succeeded.");
            data.Items.forEach((item) => {
                sendNotification(item.cell.toString(), flightNumber, ruleEvent);
            });
        }
    });
}

function sendNotification(cell, flightNumber, ruleEvent) {
    const msg = buildMessage(flightNumber, ruleEvent)
    var publishParams = {
        Message: msg,
        PhoneNumber: cell
    };
    sns.publish(publishParams, (err, data) => {
        if (err) console.log(err, err.stack);
        else console.log(data);
    });
}

function buildMessage(flightNumber, ruleEvent) {
    var event;
    switch (ruleEvent) {
        case 'CANCELLATION':
            event = 'cancelled';
            break;
        case 'DELAY':
            event = 'delayed';
            break;
        default:
            event = 'modified';
    }
    return `Flight ${flightNumber} has been ${event}.`
}